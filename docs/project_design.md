
# 个人任务管理系统 - 架构与系统设计文档 (V1.1)

## 版本变更

| 版本 | 日期 | 说明 |
|---|---|---|
| V1.0 | 2026-05-25 | 初稿，奠定 Monorepo + Vue3 + NestJS + MongoDB 的整体方案 |
| V1.1 | 2026-05-25 | 后端脚手架落地后回写：补充接口规范、统一响应格式、全局拦截链路、shared 包构建产物方案、pnpm 包管理决策 |

## 1. 整体架构与物理拓扑

系统采用 **Monorepo (pnpm workspaces)** 组织代码。前后端作为独立的应用（Apps）存在，核心的类型定义（Interfaces、DTOs）作为独立的共享包（Packages）被前后端共同引用，以此保证数据契约的严格一致。

> 包管理器决策（V1.1 补充）：AGENTS.md 后端编码指南原文写明 yarn，但本项目以 pnpm 实现 workspace。包管理器规范**以本项目实际为准**，不再与 AGENTS.md 对齐。`pnpm-workspace.yaml` 中通过 `allowBuilds` 显式放行 `bcrypt`、`@nestjs/core` 的原生 / postinstall 构建脚本（pnpm 11 默认阻止）。

**目录结构规划：**

```text
TaskManager/
├── package.json
├── pnpm-workspace.yaml         # workspace + allowBuilds 配置
├── .nvmrc                      # 锁定 Node.js v20.10.0
├── .prettierrc                 # 全局 Prettier 格式化规则
├── eslint.config.js            # 全局 ESLint 扁平化校验规则
├── apps/
│   ├── frontend/               # Vue3 应用 (Vite 构建)
│   └── backend/                # NestJS 应用（详见 backend_scaffold.md）
├── packages/
│   └── shared/                 # 核心数据模型、TS 类型、通用枚举（产出 dist）
├── scripts/
│   ├── backup.js               # 数据库自动化备份脚本（骨架待完善）
│   └── restore.js              # 数据库恢复脚本（骨架待完善）
├── docker/
│   └── docker-compose.yml      # 容器编排文件
└── docs/
    ├── requirements_analysis.md
    ├── project_design.md       # 当前文档
    └── backend_scaffold.md     # 后端脚手架详细设计（V1.1 新增）
```

### 1.1 shared 包的产物策略（V1.1 新增）

`packages/shared` 的 `main` / `types` 指向 `dist/index.js` / `dist/index.d.ts`。理由：

* 后端运行时（Node.js + NestJS）只能消费 `.js`，不能直接 require `.ts`，必须有真实产物。
* 若让 backend 的 `tsc` 一并编译 shared 源码，`outDir` 会因输入目录超出 `rootDir` 而被自动提升，导致后端 `dist` 结构变成 `dist/apps/backend/src/main.js`，破坏 `start:prod` 的入口路径。

构建顺序由根目录脚本编排：

```jsonc
{
  "build:shared":  "pnpm --filter @taskmanager/shared build",
  "dev:backend":   "pnpm run build:shared && pnpm --filter backend start:dev",
  "build:backend": "pnpm run build:shared && pnpm --filter backend build"
}
```

## 2. 前端架构设计 (Vue3)

前端侧重于"状态与视图分离"的设计思想，确保逻辑层的独立性与可维护性。

### 2.1 模块拆分

* **视图层 (Views/Pages)：** 负责页面骨架组装，如 `Login.vue`、`TaskBoard.vue`。
* **组件层 (Components)：** 提取高内聚、低耦合的纯展示组件，如 `TaskCard.vue`、`StatusBadge.vue`、`ThemeSwitcher.vue`。
* **状态层 (Stores)：** 使用 Pinia 全局托管核心状态。业务数据流转在此闭环，避免组件间通过繁琐的 Props/Emits 传递深层数据。
* **服务层 (Services/API)：** 使用 Axios 封装 HTTP 请求，统一处理请求拦截（注入 JWT）与响应拦截（**解包后端 `{ code, data, message }` 统一响应格式**、全局错误提示、Token 失效处理）。

### 2.2 核心特性实现方案

* **状态持久化：** 引入 `pinia-plugin-persistedstate`。对于用户 Token、当前选择的语言环境、界面主题色等状态，由 Pinia 自动序列化并存储至 `localStorage`。
* **多语言适配 (i18n)：** 基于 `vue-i18n` 建立翻译字典。字典键值在 `setup` 阶段或通过 `$t` 注入到视图，切换语言时触发全局 Vue 响应式更新。
* **主题切换 (Theme)：** 采用 CSS 变量 (CSS Variables) 与 Less 结合。Less 负责预编译逻辑与变量映射，通过在 `<html>` 标签动态挂载 `[data-theme='dark']` 属性，驱动全局颜色变量的实时重绘。

## 3. 后端架构设计 (NestJS)

> 详细的目录结构、模块说明、配置项与启动方式见 `docs/backend_scaffold.md`。本节只描述整体设计原则。

后端采用经典的控制反转 (IoC) 与依赖注入 (DI) 模式，保障业务逻辑的模块化与高测试性。

### 3.1 核心层级划分

* **Controllers (控制层)：** 接收 HTTP 请求，触发 DTO 校验（class-validator），将处理后的数据传递给服务层。**不承担业务逻辑、不直接操作数据库。**
* **Services (业务层)：** 系统的"大脑"，执行核心业务逻辑（任务状态合法性校验、用户存在性校验、密码哈希比对），并调用数据层。业务异常统一抛 `DefaultException`。
* **Mongoose Schemas (数据层)：** 通过 `@nestjs/mongoose` 装饰器定义集合结构，Schema 类以 `Document` 结尾（对齐 AGENTS.md 第 5 条）。

### 3.2 全局组件链（V1.1 补充）

`app.module.ts` 通过 `APP_GUARD` / `APP_INTERCEPTOR` / `APP_FILTER` 注入三层全局组件：

| 组件 | 作用 |
|---|---|
| `JwtAuthGuard` | 全局鉴权守卫，识别 `@Public()` 装饰器跳过登录 / 注册接口 |
| `ResponseInterceptor` | 把 Controller 的返回值统一包装为 `{ code: 0, data, message: 'success' }` |
| `HttpExceptionFilter` | 捕获所有异常，输出 `{ code: <status>, data: null, message }`，500+ 写日志 |

外加 `main.ts` 注册的 `ValidationPipe`（`whitelist + forbidNonWhitelisted + transform`），构成请求 → 响应的完整拦截链。

### 3.3 拦截与鉴权流转

所有的非公开接口（如创建任务、获取列表）均由全局鉴权守卫保护。

1. 客户端在请求头中携带 `Authorization: Bearer <JWT>`。
2. `JwtAuthGuard` 拦截请求，先检查 `@Public()` 元数据；若为公开接口直接放行，否则委托给 `JwtStrategy`。
3. `JwtStrategy.validate(payload)` 把 `payload.sub` 映射为 `{ userId }`，挂载到 `request.user`。
4. Controller 通过 `@CurrentUser()` 参数装饰器取出当前用户。
5. Token 缺失 / 过期 / 非法时由 Passport 自动抛 `401 Unauthorized`，再由 `HttpExceptionFilter` 包装成统一错误响应。

> 设计选择：`JwtStrategy.validate` 不查库，只解析 JWT 声明。用户存在性、有效性由 Service 在使用 `userId` 时自行决定是否校验。理由：避免每个 API 请求都触发一次 user 查询，把数据库访问压在真正需要的业务路径上。

### 3.4 接口规范（V1.1 新增）

完全按 AGENTS.md 后端编码指南落地：

* **HTTP Method**：一律 `POST`，不使用 RESTful 风格的 `PUT/PATCH/DELETE`。
* **路径风格**：`{module}/{action}` + 短划线连接动宾短语。例：`task/get-list`、`task/create`、`task/update`、`task/delete`。
* **全局前缀**：`/api`。
* **响应格式**：所有成功响应统一包装；所有异常响应统一包装。前端拦截器只需解一次包。

### 3.5 数据契约共享

`UserDocument` / `TaskDocument` 的字段契约定义在 `packages/shared/types.ts`，后端 Schema 类 `implements` 共享接口。`TaskDocument.userId` 在共享契约层为 `string`（前后端 JSON 传输形式），在 Mongoose Schema 层为 `Types.ObjectId`，Service 层负责字符串与 ObjectId 之间的转换。

## 4. 数据库设计 (MongoDB)

结合文档型数据库的特性，设计以下核心集合 (Collections)，通过 `userId` 建立软关联。

### 4.1 Users (用户集合)

| 字段名 | 类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `_id` | ObjectId | 主键 | 系统自动生成 |
| `username` | String | Unique, Required | 用户名 |
| `password` | String | Required | 经 bcrypt 加密后的哈希值 |
| `createdAt` | Date | 自动生成 | 账号注册时间 |
| `updatedAt` | Date | 自动更新 | 最后修改时间 |

### 4.2 Tasks (任务集合)

| 字段名 | 类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `_id` | ObjectId | 主键 | 系统自动生成 |
| `userId` | ObjectId | Index, Required | 关联的创建者 ID |
| `title` | String | Required | 任务简短标题 |
| `content` | String | Optional | 任务详细描述 |
| `status` | String | Enum, Required | 状态枚举 (`TODO`, `IN_PROGRESS`, `DONE`)，默认 `TODO` |
| `priority` | String | Enum, Required | 优先级 (`LOW`, `MEDIUM`, `HIGH`)，默认 `MEDIUM` |
| `dueDate` | Date | Optional | 期望截止日期 |
| `createdAt` | Date | 自动生成 | 任务创建时间 |
| `updatedAt` | Date | 自动更新 | 任务最后修改时间 |

## 5. 工程质量与规范基线

* **代码质量监控：** ESLint 负责捕获潜在的逻辑错误与类型漏洞（结合 TypeScript-ESLint 解析器）。
* **格式化约束：** Prettier 接管所有代码风格（缩进、引号、尾逗号等），通过 `eslint-config-prettier` 抹平冲突。
* **提交卡口 (Git Hooks)：** 计划引入 Husky 与 lint-staged。开发者执行 `git commit` 时，仅对暂存区内的文件触发 ESLint 和 Prettier 的强制校验与自动修复，确保入库代码 100% 符合规范。**当前未落地，列入待办。**
* **DTO 校验：** 后端通过 class-validator + 全局 `ValidationPipe` 在请求边界做白名单校验，未知字段直接 400 拒绝。
* **统一异常：** 业务异常一律抛 `DefaultException`，避免 `throw new Error()` 散落各处。

## 6. 待办与后续迭代

| 项 | 状态 | 说明 |
|---|---|---|
| 后端脚手架 | ✅ V1.1 落地 | 详见 `backend_scaffold.md` |
| 前端业务页面 | 🚧 待开发 | Login / TaskBoard / 主题切换 / i18n |
| 备份恢复脚本 | 🚧 骨架 | `scripts/{backup,restore}.js` 需补 `mongodump/mongorestore` |
| Docker 镜像 | 🚧 缺文件 | `docker/{backend,frontend}.Dockerfile` 在 compose 中被引用但未创建 |
| 提交卡口 | 🚧 待引入 | Husky + lint-staged |
| 测试体系 | 🚧 待引入 | Jest 单测 + supertest e2e |

---

*更新日期：2026-05-25*
*版本：V1.1*
