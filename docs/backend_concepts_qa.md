> 版本：v1.0 ｜ 最后更新：2026-05-25
>
> 修订记录
> - v1.0 (2026-05-25)：初版。沉淀关于 DTO、JWT 鉴权落点、NestJS Provider 与 DI、四个 APP_* 特殊 token、完整请求生命周期的长对话讨论。

# 后端核心概念问答（NestJS）

本文档不是"怎么写代码"的教程，而是回答**"为什么这么写"**的概念辨析。所有解释都对应到本项目 `apps/backend/` 下的真实代码，避免脱离语境的抽象讨论。

## 目录

1. [DTO 是什么，为什么不用 interface](#1-dto-是什么为什么不用-interface)
2. [为什么 Service 里看不到 JWT 校验代码](#2-为什么-service-里看不到-jwt-校验代码)
3. [Provider 是什么，是不是每个请求都走一遍](#3-provider-是什么是不是每个请求都走一遍)
4. [四个 APP_* 特殊 token 的对照](#4-四个-app_-特殊-token-的对照)
5. [完整的请求生命周期](#5-完整的请求生命周期)
6. [设计取舍的立场](#6-设计取舍的立场)

---

## 1. DTO 是什么，为什么不用 interface

**DTO = Data Transfer Object（数据传输对象）**，本质是一个**带类型和校验规则的 class**，定义在前后端交互边界上，约束请求/响应的数据形状。

参考 [create-task.dto.ts](apps/backend/src/modules/task/dto/create-task.dto.ts):

```ts
export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string

  @IsOptional()
  @IsEnum(TASK_STATUS)
  status?: TASK_STATUS

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date
}
```

### DTO 的标准要素

| 元素 | 作用 |
|---|---|
| `class XxxDto` | 定义数据形状 |
| 字段 + TS 类型 | 编译期类型契约 |
| `@IsString()` `@MaxLength()` 等 | 运行时校验（来自 `class-validator`） |
| `@IsOptional()` | 可选字段标识 |
| `@IsEnum(EnumType)` | 枚举值约束 |
| `@Type(() => Date)` | 类型转换（字符串自动转 Date 等） |

### 它的工作机制

配合 [main.ts:15-22](apps/backend/src/main.ts#L15-L22) 注册的全局 `ValidationPipe`：

1. **解析**：HTTP body JSON → `XxxDto` 实例
2. **校验**：跑所有 `@IsXxx` 装饰器，不符合直接 400，业务代码不会执行
3. **过滤**：`whitelist: true` 剥掉未声明的多余字段，防脏数据入库
4. **拒绝**：`forbidNonWhitelisted: true` 对多余字段直接报错

### 为什么不用 interface 或裸 object

| 方案 | 问题 |
|---|---|
| `interface` | 只在编译期存在，运行时拿不到，无法做校验和反射 |
| `any` / 裸 object | 任意字段可流入，安全/数据完整性大坑 |
| **`class` + 装饰器**（DTO） | 装饰器需要附着在 class 上、运行时反射读取，唯一可行方案 |

### 三个常见误区

1. **DTO ≠ 数据库模型**：DB Schema（Mongoose Document）是"数据存什么样"，DTO 是"接口传什么样"，两者必须解耦。比如 `password` 永远不能出现在响应 DTO 里，但必然存在于数据库模型中。
2. **DTO 不只是请求**：响应也可以用 DTO（本项目响应直接复用了 Service 返回类型，是 P0 阶段简化）。
3. **DTO 不该装业务逻辑**：只描述数据形状和校验，不要往里塞方法。

---

## 2. 为什么 Service 里看不到 JWT 校验代码

**结论**：因为本项目用了**全局 Guard + `@Public()` 反向标记**的"默认拒绝"设计。认证发生在 Controller **之前**的 Guard 层，Service 拿到的是已经被验证过的干净 `userId`，根本不需要碰 token。

### 核心证据：全局 Guard 注册

[app.module.ts:30](apps/backend/src/app.module.ts#L30)：

```ts
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  ...
]
```

`APP_GUARD` 是 NestJS 内置 token，注册到这里的 Guard 会作为**全局守卫**应用到每一个路由。意味着：

- TaskController、UserController、所有业务 controller **默认全部带 JWT 校验**
- 不需要在每个方法上手动加 `@UseGuards(JwtAuthGuard)`
- 只有**显式标记** `@Public()` 的接口才放行

[auth.controller.ts:11-19](apps/backend/src/modules/auth/auth.controller.ts#L11-L19) 中 `register`/`login` 加了 `@Public()`，是因为这俩本身就是"拿 token 用的"，不能要求登录前先登录。

### Guard 如何工作

[jwt-auth.guard.ts:12-21](apps/backend/src/common/guards/jwt-auth.guard.ts#L12-L21)：

```ts
canActivate(context) {
  const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
    context.getHandler(),
    context.getClass()
  ])
  if (isPublic) return true              // 标了 @Public 直接放行
  return super.canActivate(context)      // 否则走 passport-jwt
}
```

`AuthGuard('jwt')` 由 `@nestjs/passport` 提供，自动：
1. 从 `Authorization: Bearer xxx` 取 token
2. 交给 [jwt.strategy.ts](apps/backend/src/modules/auth/strategies/jwt.strategy.ts) 验签 + 解 payload
3. 把解出的用户信息挂到 `request.user`
4. 验证失败抛 401

### Controller 与 Service 的接力

[task.controller.ts:15-16](apps/backend/src/modules/task/task.controller.ts#L15-L16)：

```ts
async getList(@CurrentUser() user: AuthUser, @Body() dto: QueryTaskDto) {
  return this.taskService.getList(user.userId, dto)
}
```

`@CurrentUser()` 是项目自定义参数装饰器（[current-user.decorator.ts](apps/backend/src/common/decorators/current-user.decorator.ts)），从 `request.user` 提取数据。Service 拿到的就是 string 类型的 `userId`，业务代码无需理会 token 的存在。

### 全局 Guard vs 每方法装饰器

| 维度 | 全局 Guard + `@Public()`（当前） | 每方法 `@UseGuards(JwtAuthGuard)` |
|---|---|---|
| 安全默认值 | **默认安全**：新接口自动要鉴权 | **默认不安全**：忘加装饰器 = 接口裸奔 |
| 代码噪音 | controller 干净 | 几乎每方法重复一行 |
| 出错代价 | 漏标 `@Public()` → 接口 401（容易发现） | 漏加 `@UseGuards` → 信息泄露（难发现） |

**安全领域铁律：默认拒绝（deny by default）**。让"需要鉴权"成为开发者必须主动声明的事，迟早会有人忘记。Spring Security、AWS IAM 都是同一思路。

> **关于 `@JwtAuth` 这类装饰器**：NestJS 本身**不提供**。社区有人封装 `@JwtAuth() = @UseGuards(JwtAuthGuard)` 当快捷方式，但本质还是 Guard。本项目选择全局 Guard 模式，是更稳的做法。

---

## 3. Provider 是什么，是不是每个请求都走一遍

**Provider 不是"插件"**，而是 NestJS 依赖注入（DI）容器里的**可注入对象**。把它理解成"被 IoC 容器管理、可以注入到其他类里的实例"才准确。**默认是单例**，整个应用生命周期里只有一个实例被共享，**跟"每个请求走一遍"完全相反**。

### Provider 的本质：DI

```ts
// auth.service.ts
@Injectable()  // ← 标记为可注入 Provider
export class AuthService {
  constructor(
    private readonly userService: UserService,   // ← 容器自动注入
    private readonly jwtService: JwtService       // ← 容器自动注入
  ) {}
}
```

启动流程：
1. NestJS 扫描所有 `@Module` 装饰器
2. 把 `providers: [...]` 里的类**实例化一次**，存到 DI 容器
3. 谁要用就通过构造函数声明，容器自动塞进去

### 为什么会以为"每个请求都走"

困惑来源是 [app.module.ts:30-32](apps/backend/src/app.module.ts#L30-L32)：

```ts
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  { provide: APP_FILTER, useClass: HttpExceptionFilter }
]
```

这里语法上是 Provider 注册，但用了**特殊 token**（`APP_GUARD` 等）。NestJS 会自动把这些 Provider 应用到**所有路由**上。所以**"每个请求都走"成立的只有这种用了特殊 token 的切面型 Provider，不是所有 Provider**。

普通的 `TaskService`、`UserService` 这种 Provider 只有在被调用时才执行，**跟"插件"或"中间件"完全不是一个概念**。

### "插件"类比为什么不准确

| 维度 | 插件 | Provider |
|---|---|---|
| 生效范围 | 横切关注点（log、auth） | 任何可注入依赖都是 Provider，包括纯业务逻辑 |
| 调用方式 | 框架固定时机调用 | 由依赖方主动通过构造函数声明 |
| 默认作用 | 注册即激活 | 注册仅入容器，**不被注入就不会被使用** |

### 一个简单的判断标准

- 有 `@Injectable()`、写在 `providers: [...]` 里 → **是 Provider**
- 构造函数 `constructor(private xxx: SomeService)` 拿到的 → SomeService 来自 Provider
- 用 `APP_GUARD` / `APP_INTERCEPTOR` / `APP_FILTER` / `APP_PIPE` 注册的 → 全局切面 Provider，会作用到所有请求；其余都是按需注入的普通服务

---

## 4. 四个 APP_* 特殊 token 的对照

NestJS 官方的"全局应用级"特殊 token 只有 **4 个**，**不要预期还有什么神秘 token**。

| Token | 类型 | 在生命周期的位置 | 用途 |
|---|---|---|---|
| `APP_GUARD` | Guard | Controller 之前 | 决定**能不能进**（鉴权/授权） |
| `APP_PIPE` | Pipe | Guard 之后、Controller 之前 | **校验和转换**入参（DTO 校验、类型转换） |
| `APP_INTERCEPTOR` | Interceptor | Controller 前后双向切入 | **包装/改写**请求和响应（统一返回、日志、缓存） |
| `APP_FILTER` | Exception Filter | 任何环节抛异常时 | **统一异常处理** |

### 本项目的使用情况

- [app.module.ts:30](apps/backend/src/app.module.ts#L30) 用了 `APP_GUARD` → `JwtAuthGuard`
- [app.module.ts:31](apps/backend/src/app.module.ts#L31) 用了 `APP_INTERCEPTOR` → `ResponseInterceptor`（统一包装为 `{code, data, message}`）
- [app.module.ts:32](apps/backend/src/app.module.ts#L32) 用了 `APP_FILTER` → `HttpExceptionFilter`
- `ValidationPipe` 通过 [main.ts:15-22](apps/backend/src/main.ts#L15-L22) 的 `app.useGlobalPipes()` 注册，**没走 `APP_PIPE` token**

### 两种全局注册方式的差异

| 方式 | 能否注入其他 Provider |
|---|---|
| `{ provide: APP_xxx, useClass: ... }` | **可以**，在 DI 容器内 |
| `app.useGlobalXxx(new XxxClass())` | **不可以**，在 DI 容器外部 |

本项目 `ValidationPipe` 不需要注入任何东西，所以走 `app.useGlobalPipes()` 也合理。如果 Pipe 需要注入 Service（如读配置、查 DB），必须用 `APP_PIPE`。

---

## 5. 完整的请求生命周期

以 `POST /api/task/get-list` 为例：

```
HTTP 请求
   ↓
[Middleware]              ← Express 层，本项目未使用
   ↓
[Guard]                   ← APP_GUARD：JwtAuthGuard
    ├─ 验 JWT，挂载 request.user
    └─ 失败 → 抛 401
   ↓
[Interceptor 前置]        ← APP_INTERCEPTOR：ResponseInterceptor
   ↓
[Pipe]                    ← ValidationPipe（DTO 校验/转换）
   ↓
[Controller 方法]         ← TaskController.getList
    └─ 调 Service         ← TaskService.getList(userId, dto)
   ↓
[Interceptor 后置]        ← 把返回值包装成 { code, data, message }
   ↓
HTTP 响应

任何一步抛异常 → [Exception Filter] ← HttpExceptionFilter
```

### 关键观察

- **Guard 在 Pipe 之前**：鉴权失败时 DTO 校验都不会跑，是合理顺序
- **Service 完全在切面之内**：它根本不知道 Guard/Interceptor 存在，业务代码非常纯粹
- **`@CurrentUser()` 装饰器**起作用的时机在 Pipe 阶段，从 `request.user`（Guard 阶段挂上的）提取数据

---

## 6. 设计取舍的立场

### 全局 Guard 模式（默认拒绝） vs 每方法装饰器
**立场：全局 Guard 模式更优。** 默认拒绝是安全领域铁律，避免"漏加装饰器导致接口裸奔"这类隐蔽高危错误。代价只是写几个 `@Public()` 标记。本项目已做对。

### DTO 用 class 而非 interface
**立场：必须用 class。** interface 在运行时不存在，无法承载校验装饰器；裸 object 无法防脏字段。class + class-validator 是 NestJS 生态唯一可行方案。

### 全局 Pipe 走 `useGlobalPipes` 而非 `APP_PIPE`
**立场：本项目这个选择正确。** `ValidationPipe` 是无状态的、配置固定的工具，不需要 DI 容器管理。只有需要注入其他 Provider 的 Pipe 才必须走 `APP_PIPE`。

### `JwtStrategy.validate` 不查库
**立场：合理。** JWT 自带 `userId` 和 `username`，每请求查一次 DB 是浪费。用户是否存在/被禁用，由 Service 在真正需要时按需校验。这是已记录在 [02_backend_walkthrough.md](docs/walkthrough/02_backend_walkthrough.md) 的明确决定。

### NestJS 不提供 `@JwtAuth` 装饰器
**事实陈述（非取舍）**：社区有 `@JwtAuth() = @UseGuards(JwtAuthGuard)` 的封装，但 NestJS 官方刻意只提供 `@UseGuards`。本项目用全局 Guard，根本不需要这个糖。
