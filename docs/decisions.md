# 决策与修复记录 (V1.0)

> 仓库的 ADR（Architecture Decision Records）。每条记录归档一个"关键决策"或"已修复的非平凡问题"，目的是让后人理解为什么是这样，而不是"猜测当时"。
>
> 维护规则：
> - 出现新决策、bug 修复、方案细节调整时，**追加**条目（不删历史）。
> - 已落地的决策若被推翻，新加一条 `Supersedes #N` 的记录，不要原地改旧条目。

---

## 索引

| ID | 类型 | 主题 | 状态 |
|---|---|---|---|
| [D-001](#d-001-包管理器选-pnpm-而非-agentsmd-写的-yarn) | 决策 | 包管理器选 pnpm 而非 AGENTS.md 写的 yarn | ✅ Accepted |
| [D-002](#d-002-接口全部用-post--短划线动宾不使用-restful) | 决策 | 接口全部用 POST + 短划线动宾，不使用 RESTful | ✅ Accepted |
| [D-003](#d-003-响应格式用-interceptor--filter-统一包装) | 决策 | 响应格式用 Interceptor + Filter 统一包装 | ✅ Accepted |
| [D-004](#d-004-shared-包产出-dist而非让-backend-一起编译源码) | 决策 | shared 包产出 dist，而非让 backend 一起编译源码 | ✅ Accepted |
| [D-005](#d-005-jwtstrategyvalidate-不查库) | 决策 | JwtStrategy.validate 不查库 | ✅ Accepted |
| [F-001](#f-001-pnpm-11-阻止-bcrypt-原生构建) | 修复 | pnpm 11 阻止 bcrypt 原生构建 | ✅ Fixed |
| [F-002](#f-002-backend-编译产物嵌套到-distappsbackendsrc) | 修复 | backend 编译产物嵌套到 dist/apps/backend/src | ✅ Fixed |
| [F-003](#f-003-jwtmoduleregisterasync-的-expiresin-类型不兼容) | 修复 | JwtModule.registerAsync 的 expiresIn 类型不兼容 | ✅ Fixed |

---

## 决策

### D-001 包管理器选 pnpm 而非 AGENTS.md 写的 yarn

**日期**：2026-05-25  
**状态**：Accepted

**上下文**

AGENTS.md「后端编码指南」第 15 条明文写「包管理器：yarn」。但本项目 root
已存在 `pnpm-workspace.yaml`、`pnpm-lock.yaml`，frontend 也是按 pnpm
workspaces 装好的。两者直接冲突。

**决策**

**采用 pnpm**，不沿用 AGENTS.md 的 yarn 规约。

**理由**

1. 切回 yarn 会丢失 workspace 软链与现有 lockfile，pnpm 的 `link:` /
   `workspace:*` 协议与 yarn 不一致，迁移成本远大于收益。
2. AGENTS.md 的 yarn 规约写于早期，没考虑 monorepo 场景。
3. 在 `backend_scaffold.md` §7 与 `project_design.md` V1.1
   明确标注「以本项目实际为准」，避免后人按 AGENTS.md 误操作。

**影响**

* 所有 install / 脚本执行命令以 pnpm 为准。
* `pnpm-workspace.yaml` 是 workspace 配置的单一来源。

---

### D-002 接口全部用 POST + 短划线动宾，不使用 RESTful

**日期**：2026-05-25  
**状态**：Accepted

**上下文**

NestJS 默认推 RESTful 风格（GET/POST/PUT/PATCH/DELETE + 资源路径），而
AGENTS.md「后端编码指南」第 4 条要求「统一使用 post」+ 短划线动宾
（如 `get-label-statistic`、`delete-item`）。两种风格无法共存。

**决策**

**严格按 AGENTS.md**：全部 `POST`，路径形如 `task/get-list`、`task/create`、
`task/update`、`task/delete`，不使用 PUT/PATCH/DELETE。

**理由**

1. AGENTS.md 是项目级强约定，与项目其他后端服务保持一致更重要。
2. 全 POST 在浏览器层避免缓存与 query 长度问题，传 body 表达更复杂的筛选条件也更顺。
3. RESTful 在动作语义边界（如「批量软删除」「重置密码」）经常陷入争论，
   全 POST + 动宾免去这类争论。

**影响**

* Task 模块的删除接口用 body 传 `taskId`，而非 URL path 参数。
* 前端 axios 封装时不需要区分 method，逻辑更简单。
* 与 RESTful 工具链（自动生成、缓存中间件等）的兼容性差，但项目用 Apifox
  作契约平台，影响可控。

---

### D-003 响应格式用 Interceptor + Filter 统一包装

**日期**：2026-05-25  
**状态**：Accepted

**上下文**

后端响应格式有两种主流选择：
1. 裸数据（HTTP status 表达成功/失败 + 直接返回业务数据）
2. 统一包装（`{ code, data, message }` + HTTP status 永远是 200/对应错误码）

**决策**

**采用统一包装**：
* 成功：`ResponseInterceptor` 全局拦截 → `{ code: 0, data, message: 'success' }`
* 失败：`HttpExceptionFilter` 全局捕获 → `{ code: <HTTP status>, data: null, message }`

**理由**

1. 前端 axios 拦截器只解一次包就能拿到 `data`，业务代码不用每次判断 status。
2. 业务错误码可以脱离 HTTP status 自由扩展（虽然当前还没用到，但留好口子）。
3. 全局组件统一处理 = Controller 写业务时只关心业务返回值，认知负担低。

**理由（反方）**

* 失去 HTTP 语义，CDN / 浏览器 / 中间件无法根据 status 自动处理。
* 但本项目接口都走业务层，不存在 CDN 缓存场景，反方理由不成立。

**影响**

* Controller 不需要 `res.json()`，直接 return 即可。
* 前端 axios 响应拦截器必须实现 `response.data.data` 的二次解包。
* OPTIONS 预检、Passport 抛的 401 这类**不进 Controller 的响应**也会被
  `HttpExceptionFilter` 包装，保证全局一致。

---

### D-004 shared 包产出 dist，而非让 backend 一起编译源码

**日期**：2026-05-25  
**状态**：Accepted  
**Supersedes**：原 `project_design.md` V1.0 的 shared 包定义（main 指向 `index.ts`）

**上下文**

shared 包初版 `main` / `types` 都指向源码 `index.ts`，前端
Vite 可以直接吃，但后端 Node.js 运行时不能 require `.ts`。
若让 backend 的 `tsc` 把 shared 一并编译进 backend dist，
`outDir` 会因输入超出 `rootDir` 而被自动提升，
导致 backend 产物变成 `dist/apps/backend/src/main.js`，
破坏 `start:prod` 的入口路径。

**决策**

让 **shared 自己执行 `tsc`** 产出 `dist/`，
`main` / `types` 指向 `dist/index.js` / `dist/index.d.ts`。

**理由**

1. 这是 monorepo 标准做法 —— shared 作为可消费的 npm 包对外稳定。
2. 后端 backend 的 `tsconfig` 只 include `src/**/*`，
   `dist` 结构干净，`main.js` 落在根。
3. 前端 Vite 也能正常吃 dist（默认按 `main` 字段解析），无需额外配置。
4. 缺点是必须先 build shared 才能 build backend，
   通过 root scripts `build:shared` 串联解决。

**影响**

* 根 `package.json` 的 `dev:backend` / `build:backend`
  都 prepend `pnpm run build:shared`。
* shared 修改后需要重新 build 才能被 backend 看到。
  开发期建议跑 `pnpm --filter @taskmanager/shared build --watch`（待加）
  或暂时把变更同步过来。

---

### D-005 JwtStrategy.validate 不查库

**日期**：2026-05-25  
**状态**：Accepted

**上下文**

Passport-JWT 的 `validate` 方法可以做任意校验，常见做法是查 DB 确认用户还存在、未被禁用。但每次受保护请求都查一次 user 表，DB 压力随 QPS 线性增长。

**决策**

`JwtStrategy.validate` 只把 `payload.sub` 映射成 `{ userId }`，**不查库**。

**理由**

1. JWT 签发即证明该用户当时存在；过期由 `expiresIn` 控制。
2. 用户存在性校验在 Service 层按需做（例如 `getUserProfile` 才需要）。
3. 把 DB 访问压在真正需要的业务路径上，QPS 高时收益明显。

**反方理由 / 风险**

* 用户被禁用后 JWT 仍可继续用至过期。
* 当前 PRD 没有「禁用」概念，未来若引入，可在 `validate` 中加入
  「黑名单 / 状态位 cache 查询（Redis）」而非 DB 查询。

**影响**

* `@CurrentUser()` 装饰器只返回 `{ userId }`，不含其他用户字段。
* Service 需要 username 等信息时自行调 `userService.findById`。

---

## 修复

### F-001 pnpm 11 阻止 bcrypt 原生构建

**日期**：2026-05-25  
**严重度**：阻塞构建

**症状**

`pnpm install` 后任何 script 执行（包括 `pnpm build:backend`）都直接报错：

```
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: @nestjs/core@11.1.23, bcrypt@5.1.1
```

且不会 build 出 bcrypt 的原生二进制 `bcrypt_lib.node`，运行时调用 `bcrypt.hash` 会崩。

**根因**

pnpm 11 默认禁止任意包在 install 阶段执行 build script（防供应链攻击）。
需要显式 allowlist。早期版本通过 `package.json` 的 `pnpm.onlyBuiltDependencies`
配置，11.2 之后这个字段不再被读取，迁移到 `pnpm-workspace.yaml` 的
`allowBuilds`。

**修复**

`pnpm-workspace.yaml`：

```yaml
allowBuilds:
  '@nestjs/core': true
  bcrypt: true
```

重新 `pnpm install` → bcrypt 通过 node-pre-gyp 下载对应平台二进制并落地。

**坑点**

* 第一次尝试在 `package.json` 写 `pnpm.onlyBuiltDependencies`，被 pnpm 直接忽略并提示新位置。
* 第二次尝试在 `pnpm-workspace.yaml` 写 `onlyBuiltDependencies`（旧字段名），pnpm
  hook 自动注入 `allowBuilds: { '...': 'set this to true or false' }`
  作为占位符，覆盖时要小心 hook 再次写入。

**预防**

新增需要原生构建的依赖（如 `argon2`、`sharp`、`canvas`），
要在 `pnpm-workspace.yaml` 的 `allowBuilds` 中显式列出。

---

### F-002 backend 编译产物嵌套到 dist/apps/backend/src

**日期**：2026-05-25  
**严重度**：破坏部署入口

**症状**

第一次 `pnpm --filter @taskmanager/backend build` 成功后，
`dist` 结构错乱：

```
dist/
├── apps/backend/src/main.js      ← 不是预期路径
├── packages/shared/index.js      ← shared 被一起编译进来
└── tsconfig.build.tsbuildinfo
```

`package.json` 的 `start:prod` 指向 `dist/main.js`，找不到。

**根因**

backend 的 `tsconfig.json` 把 `../../packages/shared/**/*` 写进了 `include`，
让 tsc 一并编译 shared。当 include 的文件跨越项目根目录时，
tsc 把 `rootDir` 自动提升到共同祖先（monorepo root），
`outDir: ./dist` 相对计算就出现了 `apps/backend/src/` 嵌套。

**修复**

两步：

1. 让 shared 自己 build 出 `dist`（见 [D-004](#d-004-shared-包产出-dist而非让-backend-一起编译源码)）。
2. backend 的 `tsconfig.json` 移除 shared include，只编译 `src/**/*`：

```json
{
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

**验证**

构建后 `find dist -name "*.js" | head` 显示 `dist/main.js`、`dist/app.module.js` 等都在根，shared 通过模块解析走 `node_modules/@taskmanager/shared/dist/index.js`。

---

### F-003 JwtModule.registerAsync 的 expiresIn 类型不兼容

**日期**：2026-05-25  
**严重度**：阻塞编译

**症状**

```
src/modules/auth/auth.module.ts:17:7 - error TS2322:
Type 'string | undefined' is not assignable to type 'number | StringValue | undefined'.
  Type 'string' is not assignable to type 'number | StringValue | undefined'.
```

**根因**

`@nestjs/jwt` 的 `signOptions.expiresIn` 类型来自上游
`jsonwebtoken@9` 的 `SignOptions.expiresIn`，类型是
`number | ms.StringValue`。`ms.StringValue` 是字面量联合
（`` `${number}d` ``、`` `${number}h` `` 等），任意从
`process.env.JWT_EXPIRES_IN` 读出来的 `string` 都不能自动 narrow 进去。

**修复**

`auth.module.ts` 局部断言：

```typescript
useFactory: (configService: ConfigService): JwtModuleOptions => ({
  secret: configService.get<string>('jwt.secret'),
  // ms.StringValue 是字面量联合类型，环境变量字符串需要在此处放宽断言
  signOptions: { expiresIn: configService.get<string>('jwt.expiresIn') as unknown as number }
})
```

**取舍**

* 不引入 `@types/ms` 仅为这一个字段，避免拉新依赖。
* `as unknown as number` 虽然丑，但有注释解释为什么；
  比 `as any` 显式表达「这是已知的类型放宽」。
* 若后续 JwtModule 类型放宽（接受 `string`），可移除断言。

---

*创建日期：2026-05-25*  
*版本：V1.0*
