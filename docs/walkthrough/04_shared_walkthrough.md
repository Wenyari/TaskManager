# 数据契约（shared 包）Walkthrough

> 对应 TODO.md §4「数据契约」

## 完成项

- packages/shared 基础结构（enums + types）
- shared 补全 UserDocument + TaskDocument（加 userId）

## 设计原则

`packages/shared` 是前后端共享类型的**唯一来源**。目标：

1. 前端导入枚举值做条件判断
2. 后端 Schema 类 implements 共享 interface，保证字段一致
3. 改一处类型定义，两端同时报错

## 文件结构

```
packages/shared/
├── index.ts          # 统一导出入口
├── enums.ts          # TASK_STATUS / TASK_PRIORITY
├── types.ts          # UserDocument / TaskDocument interface
├── tsconfig.json     # CJS 输出到 dist/
├── package.json      # main → dist/index.js, types → dist/index.d.ts
└── .gitignore        # 忽略 dist/
```

## 枚举定义（遵循 AGENTS.md 第 3 条）

```typescript
// KEY 全大写下划线，Value 与 KEY 一致
export enum TASK_STATUS {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export enum TASK_PRIORITY {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}
```

## 类型定义（遵循 AGENTS.md 第 5 条）

- interface 名大驼峰
- 数据库 schema 用的类以 Document 结尾
- 必选字段在前，可选字段在后

```typescript
export interface UserDocument {
  username: string
  password: string
  createdAt: Date
  updatedAt: Date
}

export interface TaskDocument {
  userId: string       // 在共享契约层统一为 string
  title: string
  status: TASK_STATUS
  priority: TASK_PRIORITY
  createdAt: Date
  updatedAt: Date
  content?: string
  dueDate?: Date
}
```

**注意**：`userId` 在 shared 中为 `string`（JSON 传输形式），在后端 Mongoose Schema 中为 `Types.ObjectId`，Service 层负责转换。

## 构建与消费

```bash
pnpm --filter @taskmanager/shared build   # tsc → dist/
```

- **后端**：`@taskmanager/shared` 在 `package.json` 中用 `workspace:*`，CJS 直接 require
- **前端**：同样 `workspace:*`，Vite 通过 esbuild 预打包 CJS → ESM

## 涉及文件

- `/packages/shared/*`
- `/apps/backend/package.json`（`@taskmanager/shared: workspace:*`）
- `/apps/frontend/package.json`（`@taskmanager/shared: workspace:*`）

---

*完成日期：2026-05-25*
