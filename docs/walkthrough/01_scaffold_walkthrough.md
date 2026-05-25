# 工程脚手架 Walkthrough

> 对应 TODO.md §1「工程脚手架」

## 完成项

- Monorepo 结构（pnpm workspaces）
- Node.js v20.10.0 锁定
- 根级 Prettier 配置
- pnpm-workspace.yaml + allowBuilds
- shared 包独立 build 出 dist
- root scripts 编排 build 顺序

## 关键操作步骤

### 1. 初始化 Monorepo

根目录 `pnpm-workspace.yaml` 声明 workspace 范围：

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 2. 锁定 Node 版本

`.nvmrc` 写入 `v20.10.0`，所有协作者通过 `nvm use` 对齐。

### 3. allowBuilds 放行原生构建

pnpm 11 默认阻止 install 阶段的 build script。需要在 `pnpm-workspace.yaml` 显式放行：

```yaml
allowBuilds:
  '@nestjs/core': true
  bcrypt: true
```

不加这个配置会导致 bcrypt 无法下载原生二进制，运行时 crash。

### 4. shared 包产物策略

`packages/shared` 通过自己的 `tsc` 产出 `dist/`：

```bash
pnpm --filter @taskmanager/shared build
```

`package.json` 的 `main` / `types` 指向 `dist/index.js` / `dist/index.d.ts`。

**为什么不让 backend 一起编译 shared 源码？**

如果 backend 的 tsconfig include 了 shared 源码，tsc 会自动提升 `rootDir`，导致 `outDir` 结构变成 `dist/apps/backend/src/main.js`，破坏部署入口。详见 `docs/decisions.md` D-004、F-002。

### 5. 构建顺序编排

root `package.json` 脚本保证顺序：

```json
{
  "build:shared": "pnpm --filter @taskmanager/shared build",
  "dev:backend": "pnpm run build:shared && pnpm --filter backend start:dev",
  "build:backend": "pnpm run build:shared && pnpm --filter backend build"
}
```

## 涉及文件

- `/pnpm-workspace.yaml`
- `/package.json`（root scripts）
- `/.nvmrc`
- `/.prettierrc`
- `/eslint.config.js`
- `/packages/shared/package.json`
- `/packages/shared/tsconfig.json`

---

*完成日期：2026-05-25*
