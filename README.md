# TaskManager

个人任务管理系统 —— 基于 Monorepo 架构的全栈实践项目。前端 Vue 3，后端
NestJS，数据库 MongoDB；通过 pnpm workspaces 共享前后端的类型契约。

## 技术栈

| 层 | 技术 |
|---|---|
| 包管理 | pnpm workspaces |
| 前端 | Vue 3 · Vite · Pinia · vue-i18n · Less |
| 后端 | NestJS 11 · Mongoose 8 · Passport-JWT · class-validator |
| 数据库 | MongoDB |
| 运行时 | Node.js v20.10.0（由 `.nvmrc` 锁定） |

## 目录结构

```text
TaskManager/
├── apps/
│   ├── frontend/        Vue 3 应用
│   └── backend/         NestJS 应用
├── packages/
│   └── shared/          前后端共享的类型与枚举（构建产出 dist）
├── docker/              docker-compose 与 Dockerfile（部分待补）
├── scripts/             备份 / 恢复脚本（骨架待完善）
├── docs/                项目文档（见下方索引）
├── package.json
└── pnpm-workspace.yaml
```

## 环境要求

- **Node.js**：`v20.10.0`（建议用 nvm：`nvm use`）
- **pnpm**：`>= 11`（项目用 `allowBuilds` 配置原生构建放行）
- **MongoDB**：本地 `27017` 端口，或通过 `docker/docker-compose.yml` 启动

## 快速启动

### 1. 安装依赖

```bash
pnpm install
```

> 首次安装时 bcrypt 会通过 node-pre-gyp 下载对应平台的二进制，
> 已在 `pnpm-workspace.yaml` 的 `allowBuilds` 放行。

### 2. 启动 MongoDB

任选其一：

```bash
# 方式 A：本机已装 MongoDB
mongod --dbpath <你的数据目录>

# 方式 B：docker（只起 database 服务）
docker compose -f docker/docker-compose.yml up database -d
```

### 3. 配置后端环境变量

```bash
cp apps/backend/.env.example apps/backend/.env
# 按需修改 MONGODB_URI / JWT_SECRET
```

### 4. 启动后端（开发模式）

```bash
pnpm dev:backend
```

启动成功后访问 `http://localhost:3000/api`。

> `dev:backend` 会先 build `packages/shared`，再以 watch 模式启动 NestJS。
> 修改 shared 包后需重新执行 `pnpm run build:shared`（或手动 rebuild）。

### 5. 启动前端（开发模式）

```bash
pnpm dev:frontend
```

默认在 `http://localhost:5173`。

## 常用命令

| 命令 | 作用 |
|---|---|
| `pnpm dev:frontend` | 启动前端 Vite dev server |
| `pnpm dev:backend` | 启动后端 watch 模式（含 shared build） |
| `pnpm build:shared` | 构建共享包（产出 `packages/shared/dist`） |
| `pnpm build:frontend` | 构建前端生产产物 |
| `pnpm build:backend` | 构建后端生产产物（含 shared build） |
| `pnpm --filter @taskmanager/backend start:prod` | 直接启动 `dist/main.js` |

## 接口规范概要

- **全局前缀**：`/api`
- **HTTP Method**：一律 `POST`，路径用短划线动宾（如 `task/get-list`）
- **响应格式**：成功 `{ code: 0, data, message }`、失败 `{ code: <status>, data: null, message }`
- **鉴权**：所有非 `@Public()` 接口需在请求头携带 `Authorization: Bearer <JWT>`

完整接口清单见 [`docs/backend_scaffold.md`](docs/backend_scaffold.md)。

## 文档索引

| 文档 | 内容 |
|---|---|
| [`docs/requirements_analysis.md`](docs/requirements_analysis.md) | 需求分析（PRD） |
| [`docs/project_design.md`](docs/project_design.md) | 总体架构与系统设计（V1.1） |
| [`docs/backend_scaffold.md`](docs/backend_scaffold.md) | 后端脚手架详细设计（V1.0） |
| [`docs/decisions.md`](docs/decisions.md) | 关键决策与 bug 修复记录（ADR） |
| [`TODO.md`](TODO.md) | 全项目 TODO 清单与进度 |

## 当前进度

后端脚手架已搭建完成（鉴权 + 任务 CRUD），前端业务页面尚未开始开发。详细进度见 [`TODO.md`](TODO.md)。

## 协作规范

- 编码规范：见根 `AGENTS.md`、`CLAUDE.md`
- Git commit：Conventional Commits（`feat: ...` / `fix: ...` / `chore: ...`）
- 分支命名：`<type>/<scope>/<description>`（全小写，短划线连接）
