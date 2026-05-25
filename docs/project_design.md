
# 个人任务管理系统 - 架构与系统设计文档 (V1.0)

## 1. 整体架构与物理拓扑

系统采用 **Monorepo (pnpm workspaces)** 组织代码。前后端作为独立的应用（Apps）存在，核心的类型定义（Interfaces、DTOs）作为独立的共享包（Packages）被前后端共同引用，以此保证数据契约的严格一致。

**目录结构规划：**

```text
TaskManager/
├── package.json
├── pnpm-workspace.yaml
├── .nvmrc                   # 锁定 Node.js v20.10.0
├── .prettierrc              # 全局 Prettier 格式化规则
├── eslint.config.js         # 全局 ESLint 扁平化校验规则
├── apps/
│   ├── frontend/            # Vue3 应用 (Vite 构建)
│   └── backend/             # NestJS 应用
├── packages/
│   └── shared/              # 核心数据模型、TS 类型、通用枚举
├── scripts/
│   ├── backup.js            # 数据库自动化备份脚本
│   └── restore.js           # 数据库恢复脚本
└── docker/
    └── docker-compose.yml   # 容器编排文件

```

## 2. 前端架构设计 (Vue3)

前端侧重于“状态与视图分离”的设计思想，确保逻辑层的独立性与可维护性。

### 2.1 模块拆分

* **视图层 (Views/Pages)：** 负责页面骨架组装，如 `Login.vue`、`TaskBoard.vue`。
* **组件层 (Components)：** 提取高内聚、低耦合的纯展示组件，如 `TaskCard.vue`、`StatusBadge.vue`、`ThemeSwitcher.vue`。
* **状态层 (Stores)：** 使用 Pinia 全局托管核心状态。业务数据流转在此闭环，避免组件间通过繁琐的 Props/Emits 传递深层数据。
* **服务层 (Services/API)：** 使用 Axios 封装 HTTP 请求，统一处理请求拦截（注入 JWT）与响应拦截（全局错误提示、Token 失效处理）。

### 2.2 核心特性实现方案

* **状态持久化：** 引入 `pinia-plugin-persistedstate`。对于用户 Token、当前选择的语言环境、界面主题色等状态，由 Pinia 自动序列化并存储至 `localStorage`。
* **多语言适配 (i18n)：** 基于 `vue-i18n` 建立翻译字典。字典键值在 `setup` 阶段或通过 `$t` 注入到视图，切换语言时触发全局 Vue 响应式更新。
* **主题切换 (Theme)：** 采用 CSS 变量 (CSS Variables) 与 Less 结合。Less 负责预编译逻辑与变量映射，通过在 `<html>` 标签动态挂载 `[data-theme='dark']` 属性，驱动全局颜色变量的实时重绘。

## 3. 后端架构设计 (NestJS)

后端采用经典的控制反转 (IoC) 与依赖注入 (DI) 模式，保障业务逻辑的模块化与高测试性。

### 3.1 核心层级划分

* **Controllers (控制层)：** 负责接收 HTTP 请求，解析入参（Body/Query），并将处理后的 DTO 传递给服务层。
* **Services (业务层)：** 系统的“大脑”，负责执行核心业务逻辑（如任务状态合法性校验、权限比对），并调用数据库层。
* **Mongoose Models (数据层)：** 负责与 MongoDB 交互，执行具体的 CRUD 操作。

### 3.2 拦截与鉴权流转

所有的非公开接口（如创建任务、获取列表）均由全局鉴权守卫保护。

1. 客户端在请求头中携带 `Authorization: Bearer <JWT>`。
2. `JwtAuthGuard` 拦截请求，调用内部解密模块验证 Token 的签发时长与合法性。
3. 验证通过后，将解析出的 `userId` 挂载至 Request 对象上下文中，供后续 Controller 读取并隔离不同用户的数据。
4. 验证失败直接抛出 `401 Unauthorized` 异常。

## 4. 数据库设计 (MongoDB)

结合文档型数据库的特性，设计以下核心集合 (Collections)，通过 `userId` 建立软关联。

### 4.1 Users (用户集合)

| 字段名 | 类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `_id` | ObjectId | 主键 | 系统自动生成 |
| `username` | String | Unique, Required | 用户名 |
| `password` | String | Required | 经 bcrypt 加密后的哈希值 |
| `createdAt` | Date | 自动生成 | 账号注册时间 |

### 4.2 Tasks (任务集合)

| 字段名 | 类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `_id` | ObjectId | 主键 | 系统自动生成 |
| `userId` | ObjectId | Index, Required | 关联的创建者 ID |
| `title` | String | Required | 任务简短标题 |
| `content` | String | Optional | 任务详细描述 |
| `status` | String | Enum | 状态枚举 (`TODO`, `IN_PROGRESS`, `DONE`) |
| `priority` | String | Enum | 优先级 (`LOW`, `MEDIUM`, `HIGH`) |
| `dueDate` | Date | Optional | 期望截止日期 |
| `createdAt` | Date | 自动生成 | 任务创建时间 |
| `updatedAt` | Date | 自动更新 | 任务最后修改时间 |

## 5. 工程质量与规范基线

* **代码质量监控：** ESLint 负责捕获潜在的逻辑错误与类型漏洞（结合 TypeScript-ESLint 解析器）。
* **格式化约束：** Prettier 接管所有代码风格（缩进、引号、尾逗号等），通过 `eslint-config-prettier` 抹平冲突。
* **提交卡口 (Git Hooks)：** 引入 Husky 与 lint-staged。开发者执行 `git commit` 时，仅对暂存区内的文件触发 ESLint 和 Prettier 的强制校验与自动修复，确保入库代码 100% 符合规范。

---