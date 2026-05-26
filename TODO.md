# 项目 TODO 清单 (V1.1)

> 维护规则：
> - 完成项用 ✅ + **保留**在文档中（不删除），便于回溯"什么时候做完的"。
> - 已开始未完成用 🚧。
> - 未开始用 ⬜。
> - 已废弃 / 不做了用 ❌ 并附原因。
> - 状态变更时在条目末尾加日期。
> - 新增大类时迭代版本号。

---

## 索引

| 阶段 | 进度 |
|---|---|
| [1. 工程脚手架](#1-工程脚手架) | 6/7 ✅ |
| [2. 后端业务](#2-后端业务) | 7/7 ✅ |
| [3. 前端业务](#3-前端业务) | 8/10 ✅ |
| [4. 数据契约](#4-数据契约) | 3/4 ✅ |
| [5. 工程化质量](#5-工程化质量) | 1/5 🚧 |
| [6. 容器化与部署](#6-容器化与部署) | 0/4 ⬜ |
| [7. 数据容灾](#7-数据容灾) | 0/2 ⬜ |
| [8. 测试体系](#8-测试体系) | 0/3 ⬜ |
| [9. 文档](#9-文档) | 5/5 ✅ |

---

## 1. 工程脚手架

- ✅ Monorepo 结构（pnpm workspaces） — 2026-05-25
- ✅ Node.js v20.10.0 锁定（.nvmrc） — 2026-05-25
- ✅ 根级 Prettier 配置 — 2026-05-25
- ✅ pnpm-workspace.yaml + allowBuilds（bcrypt / @nestjs/core） — 2026-05-25
- ✅ shared 包独立 build 出 dist — 2026-05-25
- ✅ root scripts 编排 build 顺序（build:shared → build:backend） — 2026-05-25
- 🚧 根级 ESLint flat config —— 目前 `eslint.config.js` 是 placeholder，
  需补 TypeScript-ESLint 解析器 + Vue / React 规则

## 2. 后端业务

- ✅ NestJS 11 + Mongoose 8 基础脚手架 — 2026-05-25
- ✅ 全局组件链（JwtAuthGuard / ResponseInterceptor / HttpExceptionFilter） — 2026-05-25
- ✅ ConfigModule + 三段 config（app / database / jwt） — 2026-05-25
- ✅ User 模块（Schema + Service） — 2026-05-25
- ✅ Auth 模块（register / login + JwtStrategy） — 2026-05-25
- ✅ Task 模块（get-list / create / update / delete） — 2026-05-25
- ✅ DefaultException + class-validator DTO 校验 — 2026-05-25

## 3. 前端业务

> UI 框架：Naive UI。

- ✅ Axios 封装（请求拦截注入 JWT、响应拦截解包 `{ code, data, message }`） — 2026-05-25
- ✅ Pinia store + `pinia-plugin-persistedstate`（Token 持久化） — 2026-05-25
- ✅ Login / Register 页面 — 2026-05-25
- ✅ TaskBoard / TaskList 视图（含状态、优先级筛选） — 2026-05-25
- ✅ TaskCard / StatusBadge 等展示组件 — 2026-05-25
- ⬜ 主题切换（CSS Variables + `data-theme` 切换）
- ⬜ 多语言（vue-i18n，中英双语字典）
- ✅ 路由守卫（无 Token 跳转登录） — 2026-05-25
- ✅ 视图模式切换 bar（5 种：网格 / 紧凑 / 优先级分组 / 状态分组 / 甘特图） — 2026-05-26
- ✅ 甘特图（日粒度，自研，移除原筛选下拉） — 2026-05-26

## 4. 数据契约

- ✅ packages/shared 基础结构（enums + types） — 2026-05-25
- ✅ shared 补全 UserDocument + TaskDocument（加 userId） — 2026-05-25
- ✅ TaskDocument 新增 `startDate`（甘特图所需） — 2026-05-26
- ⬜ Apifox 接口契约同步 —— PRD 要求 Apifox 为唯一契约平台，
  需把当前接口录入并约定「先文档后代码」流程

## 5. 工程化质量

- ✅ Prettier 全局配置 — 2026-05-25
- 🚧 ESLint flat config（同 §1） —— 占位文件已存在
- ⬜ TypeScript-ESLint 解析器集成
- ⬜ Husky 安装 + Git Hook 注入
- ⬜ lint-staged 配置（仅暂存区文件触发 lint + format）

## 6. 容器化与部署

> 现状：`docker/docker-compose.yml` 引用了 `backend.Dockerfile`、`frontend.Dockerfile`，但这两个文件**不存在**，直接跑 `docker compose up` 会失败。

- ⬜ `docker/backend.Dockerfile`（多阶段构建：deps → build → runtime）
- ⬜ `docker/frontend.Dockerfile`（多阶段构建 + nginx 静态托管）
- ⬜ `.dockerignore`（避免把 node_modules、dist 复制进镜像层）
- ⬜ 容器化联调验证 + 文档（README 部署章节）

## 7. 数据容灾

> 现状：`scripts/backup.js`、`scripts/restore.js` 只有 4 行骨架，含 TODO 注释。

- ⬜ `backup.js` 实现：调用 `mongodump`，按日期归档到 `backups/{YYYY-MM-DD}/`，并保留近 N 份
- ⬜ `restore.js` 实现：调用 `mongorestore`，接受 `--file <path>` 参数

## 8. 测试体系

- ⬜ 后端单测（Jest）—— 至少覆盖 AuthService、TaskService 核心分支
- ⬜ 后端 e2e（supertest）—— 覆盖鉴权流转、Task CRUD 接口
- ⬜ 前端组件测试（Vitest + Vue Test Utils）

## 9. 文档

- ✅ `requirements_analysis.md` PRD — 2026-05-25 之前
- ✅ `project_design.md` V1.1 总体设计 — 2026-05-25
- ✅ `backend_scaffold.md` V1.0 后端详设 — 2026-05-25
- ✅ `decisions.md` V1.0 ADR + 修复记录 — 2026-05-25
- ✅ 根 `README.md`：项目简介、技术栈、目录、环境要求、快速启动、命令、文档索引 — 2026-05-25

---

## 优先级建议（个人项目视角）

1. **P0**：~~前端 Axios 封装 + Login 页面 + TaskBoard~~ —— 已完成（2026-05-25）。
2. **P1**：~~根 `README.md`~~ —— 已完成（2026-05-25）。
3. **P1**：`docker/{backend,frontend}.Dockerfile` —— PRD 明确要求容器化部署。
4. **P2**：Husky + lint-staged —— 个人项目可以晚一点上，但越拖越乱。
5. **P2**：备份恢复脚本 —— 个人数据量小，可以先用手动 mongodump 顶着。
6. **P3**：测试体系 —— 个人项目老实说优先级不高，但 AuthService 这种安全相关的至少要补单测。
7. **P3**：Apifox 同步 —— 视团队规模决定，单人开发可缓。

---

*创建日期：2026-05-25*  
*版本：V1.1*  
*V1.1（2026-05-26）：新增视图模式切换 + 甘特图 + `startDate` 字段，移除筛选下拉*
