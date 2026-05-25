# 后端脚手架设计文档 (V1.0)

> 文档维护：随 `apps/backend` 重大变更（新增模块、调整鉴权方案、调整全局组件）同步迭代。

## 1. 概述

本文档描述 `apps/backend` 的脚手架结构、核心设计与对齐 AGENTS.md
后端编码规范的落地方式。脚手架基于 NestJS 11 + Mongoose 8 +
Passport-JWT，部署目标运行环境为 Node.js v20.10.0（由根目录 `.nvmrc` 锁定）。

## 2. 目录结构

```text
apps/backend/
├── src/
│   ├── main.ts                                # 启动入口
│   ├── app.module.ts                          # 根模块
│   ├── common/                                # 通用层
│   │   ├── exceptions/default.exception.ts    # DefaultException（AGENTS.md 第 8 条）
│   │   ├── filters/http-exception.filter.ts   # 全局异常 → 统一错误响应
│   │   ├── interceptors/response.interceptor.ts # 成功响应包装为 { code, data, message }
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts            # @Public() 标记白名单
│   │   │   └── current-user.decorator.ts      # @CurrentUser() 注入 JWT 解析后的用户
│   │   └── guards/jwt-auth.guard.ts           # 全局 JWT 守卫（识别 @Public）
│   ├── config/                                # 配置层（@nestjs/config）
│   │   ├── app.config.ts                      # port / apiPrefix
│   │   ├── database.config.ts                 # MongoDB 连接串
│   │   ├── jwt.config.ts                      # JWT 密钥与过期时间
│   │   └── index.ts
│   └── modules/                               # 业务模块层
│       ├── user/                              # 用户领域（无 Controller，仅供 auth 复用）
│       │   ├── schemas/user.schema.ts
│       │   ├── user.service.ts
│       │   └── user.module.ts
│       ├── auth/                              # 鉴权领域
│       │   ├── dto/{register,login}.dto.ts
│       │   ├── strategies/jwt.strategy.ts
│       │   ├── auth.controller.ts             # 公开接口
│       │   ├── auth.service.ts
│       │   └── auth.module.ts
│       └── task/                              # 任务领域
│           ├── dto/{create,update,query,delete}-task.dto.ts
│           ├── schemas/task.schema.ts
│           ├── task.controller.ts             # 受 JwtAuthGuard 保护
│           ├── task.service.ts
│           └── task.module.ts
├── .env.example
├── nest-cli.json
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

## 3. 核心设计

### 3.1 分层

| 层级 | 职责 | 文件位置 |
|---|---|---|
| Controller | 接收 HTTP、做 DTO 校验、调 Service | `modules/*/*.controller.ts` |
| Service | 业务逻辑、跨集合编排、抛 `DefaultException` | `modules/*/*.service.ts` |
| Schema | Mongoose 模型定义（Class 以 Document 结尾） | `modules/*/schemas/*.schema.ts` |
| DTO | class-validator 校验、class-transformer 转换 | `modules/*/dto/*.dto.ts` |

### 3.2 接口命名

完全对齐 AGENTS.md 第 4 条：

- 全部使用 `POST`，不使用 `PUT/PATCH/DELETE`。
- 路径使用动宾短语 + 短划线连接。
- 路径段落：`{module}/{action}` 形式，例如 `task/get-list`、`task/create`。

接口清单（全部带全局前缀 `/api`）：

| 接口 | 鉴权 | DTO |
|---|---|---|
| `POST /api/auth/register` | Public | `RegisterDto` |
| `POST /api/auth/login` | Public | `LoginDto` |
| `POST /api/task/get-list` | JWT | `QueryTaskDto`（status / priority 可选） |
| `POST /api/task/create` | JWT | `CreateTaskDto` |
| `POST /api/task/update` | JWT | `UpdateTaskDto`（含 `taskId`） |
| `POST /api/task/delete` | JWT | `DeleteTaskDto`（含 `taskId`） |

### 3.3 统一响应格式

由 `ResponseInterceptor` 在全局拦截成功路径，所有 Controller 返回的对象会被包装：

```json
{
  "code": 0,
  "data": <controller 返回值>,
  "message": "success"
}
```

错误路径由 `HttpExceptionFilter` 统一拦截，输出：

```json
{
  "code": <HTTP status>,
  "data": null,
  "message": "<错误信息>"
}
```

约束：

- Service 抛出业务异常一律用 `DefaultException(message, status?)`，避免散乱的 `new Error()`。
- 500 级错误会带 stack 写入日志。

### 3.4 鉴权流转

```
Client ──Bearer JWT──▶ JwtAuthGuard (APP_GUARD 全局)
                          │
                          ├── 检查 @Public() ─→ 放行
                          │
                          └── 调用 JwtStrategy.validate(payload)
                                    │
                                    └── req.user = { userId }
                                          │
                                          └── @CurrentUser() 注入 Controller
```

- JWT 密钥与过期时间来自 `JWT_SECRET` / `JWT_EXPIRES_IN`。
- `JwtStrategy.validate` 只把 `sub` 映射为 `userId`，不查库（鉴权层不承担用户存在性校验，存在性校验交由 Service）。

### 3.5 全局 ValidationPipe

`main.ts` 注册：

```typescript
new ValidationPipe({
  whitelist: true,             // 剥离未声明字段，避免脏数据落库
  forbidNonWhitelisted: true,  // 出现未知字段直接 400
  transform: true,             // 自动 plain → class
  transformOptions: { enableImplicitConversion: false } // 显式声明类型转换，避免隐式 cast 出错
})
```

## 4. 数据契约

### 4.1 shared 包

`packages/shared` 是前后端共享类型的唯一来源。后端 Schema 类
`UserDocument` / `TaskDocument` `implements`
共享接口，保证字段命名一致。`TaskDocument.userId` 在前后端契约层统一为 `string`，
在 Mongoose Schema 层为 `ObjectId`，转换由 Service 层完成。

### 4.2 集合

| Collection | Schema 类 | 主要字段 |
|---|---|---|
| `users` | `UserDocument` | `username` (unique), `password` (bcrypt), `createdAt`, `updatedAt` |
| `tasks` | `TaskDocument` | `userId` (Indexed ObjectId), `title`, `content?`, `status`, `priority`, `dueDate?`, `createdAt`, `updatedAt` |

## 5. 配置项

通过 `.env` 注入，`.env.example` 提供模板：

| 环境变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `3000` | HTTP 服务端口 |
| `API_PREFIX` | `api` | 全局接口前缀 |
| `MONGODB_URI` | `mongodb://localhost:27017/taskmanager` | MongoDB 连接串 |
| `JWT_SECRET` | `please-change-me-in-production` | JWT 密钥 |
| `JWT_EXPIRES_IN` | `7d` | JWT 过期时间 |

## 6. 启动与构建

| 命令 | 作用 |
|---|---|
| `pnpm dev:backend` | 先 build shared，再以 watch 模式启动后端 |
| `pnpm build:backend` | 先 build shared，再 nest build 后端 |
| `pnpm --filter @taskmanager/backend start:prod` | 直接启动 `dist/main.js`（需先 build） |

## 7. 工程约定

1. **包管理器**：pnpm（AGENTS.md 原文写 yarn，本项目以实际为准，**不与 AGENTS.md 对齐**，因 monorepo workspace 协议依赖 pnpm 实现）。
2. **构建顺序**：shared → backend。shared 通过 `tsc` 自己产出 `dist/`，
   不由 backend 一起编译，避免 backend `dist` 出现嵌套路径。
3. **bcrypt 原生构建**：pnpm 11 默认阻止 install 阶段的 build script，
   已在 `pnpm-workspace.yaml` 通过 `allowBuilds` 放行 `bcrypt` 与 `@nestjs/core`。
4. **命名约束**：完全按 AGENTS.md 后端编码指南——
   - Schema 类以 `Document` 结尾
   - DTO 类以 `Dto` 结尾
   - 枚举 KEY 全大写下划线，Value 与 KEY 一致
   - 接口路径短划线动宾
   - 业务异常统一 `DefaultException`

## 8. 未实现 / 后续迭代项

- 自动化备份脚本 `scripts/{backup,restore}.js` 仍为骨架，需补 `mongodump/mongorestore` 调度。
- `docker/{backend,frontend}.Dockerfile` 在 `docker-compose.yml` 中被引用，但文件本身尚未提供，需在容器化阶段补齐。
- 暂未引入 Husky / lint-staged 提交卡口（PRD 提到，未落地）。
- 暂未引入 e2e 测试与单元测试样例。

---

*创建日期：2026-05-25*
*版本：V1.0*
