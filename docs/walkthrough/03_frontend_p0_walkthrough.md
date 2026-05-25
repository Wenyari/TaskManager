# 前端业务（P0）Walkthrough

> 对应 TODO.md §3「前端业务」中 P0 范围的 6 项

## 完成项

- Axios 封装（请求拦截注入 JWT、响应拦截解包）
- Pinia store + pinia-plugin-persistedstate（Token 持久化）
- Login / Register 页面
- TaskBoard / TaskList 视图（含状态、优先级筛选）
- TaskCard / StatusBadge 等展示组件
- 路由守卫（无 Token 跳转登录）

## 技术选型

- **UI 框架**：Naive UI（TypeScript 原生、主题定制能力强）
- **状态持久化**：pinia-plugin-persistedstate（token / userId / username → localStorage）
- **HTTP**：Axios + 全局拦截器
- **跨域**：Vite dev server proxy（`/api` → `http://localhost:3000`）

## 启动

```bash
# 终端 1 - 后端
pnpm dev:backend

# 终端 2 - 前端
pnpm dev:frontend
```

浏览器打开 `http://localhost:5173`。

## 核心架构

### API 层（`src/api/`）

```
request.ts    ← Axios 实例 + 拦截器（注入 Bearer、解包 data、401 跳转）
auth.ts       ← login(username, password) / register(username, password)
task.ts       ← getTaskList / createTask / updateTask / deleteTask
```

**设计要点**：
- 导出 `post<T>(url, data?)` 快捷函数，所有接口统一用 POST
- 响应拦截器直接解包 `response.data.data`，业务代码拿到的就是纯业务数据
- 401 时清 localStorage + 跳登录页
- 错误通过 `window.$message` 全局提示（Naive UI MessageProvider 注入）

### Store 层（`src/stores/`）

**userStore**：
- `token` / `userId` / `username`（全部 persist）
- `login()` / `register()` / `logout()`
- 登录/注册成功后自动写入 state，Axios 拦截器从这里取 token

**taskStore**：
- `tasks[]` / `isLoading` / `filter { status?, priority? }`
- `fetchList()` / `createTask()` / `updateTask()` / `deleteTask()`
- TaskView 通过 `watch(filter)` 自动刷新列表

### 路由守卫（`src/router/index.ts`）

```typescript
router.beforeEach(to => {
  const userStore = useUserStore()
  if (!to.meta.isPublic && !userStore.token) {
    return { name: 'login' }
  }
})
```

只有 `/login` 标记了 `meta: { isPublic: true }`，其余路由无 token 即重定向。

### 全局 Message 注册（`App.vue` + `MessageProvider.vue`）

Naive UI 的 `useMessage()` 必须在 `NMessageProvider` 子树中调用。为了让 Axios 拦截器（非组件上下文）也能用，通过 `MessageProvider.vue` 组件在 setup 中把 `message` 挂到 `window.$message`。

### 组件

| 组件 | 职责 |
|---|---|
| `StatusBadge.vue` | 根据 status/priority 值映射 NTag 颜色与中文标签 |
| `TaskCard.vue` | NCard 展示任务详情，支持编辑/删除/点击状态快速流转 |
| `TaskFormModal.vue` | NModal 弹窗，新建/编辑复用同一表单，watch show 初始化字段 |

### 页面

| 页面 | 功能 |
|---|---|
| `LoginView.vue` | NTabs 切换登录/注册，NForm 提交，成功后跳任务看板 |
| `TaskView.vue` | 顶栏筛选 + NGrid 响应式卡片布局 + 空状态 + 新建/编辑弹窗 |

## Vite 代理配置

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:3000', changeOrigin: true }
  }
}
```

开发时前端 `baseURL` 写 `/api`（相对路径），Vite 转发到后端 3000 端口，避免跨域。生产环境由 nginx 处理。

## 验证结果

```bash
pnpm --filter @taskmanager/frontend build
# vue-tsc --build ✅
# vite build ✅ (664ms, 5 chunks)
```

## 涉及文件

```
apps/frontend/
├── package.json                 (新增 axios / naive-ui / pinia-plugin-persistedstate / @taskmanager/shared)
├── vite.config.ts               (加 server.proxy)
├── src/
│   ├── main.ts                  (挂载 persistedstate 插件)
│   ├── App.vue                  (NConfigProvider + NMessageProvider + RouterView)
│   ├── types/global.d.ts        (window.$message 类型声明)
│   ├── api/{request,auth,task}.ts
│   ├── stores/{user,task}.ts
│   ├── router/index.ts          (路由 + beforeEach 守卫)
│   ├── components/
│   │   ├── MessageProvider.vue
│   │   ├── StatusBadge.vue
│   │   ├── TaskCard.vue
│   │   └── TaskFormModal.vue
│   └── views/
│       ├── LoginView.vue
│       └── TaskView.vue
```

## 删除的脚手架文件

- `components/HelloWorld.vue`、`TheWelcome.vue`、`WelcomeItem.vue`
- `components/icons/*`（整个目录）
- `views/AboutView.vue`、`HomeView.vue`
- `stores/counter.ts`

---

*完成日期：2026-05-25*
