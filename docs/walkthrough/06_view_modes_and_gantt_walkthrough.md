# 视图模式 + 甘特图 Walkthrough

> 版本：V1.0  
> 创建日期：2026-05-26  
> 对应 TODO.md §3「前端业务」新增项：视图模式切换、甘特图、移除筛选；以及 §4「数据契约」新增项：`startDate` 字段。

## 目录

- [背景](#背景)
- [数据契约变更](#数据契约变更)
- [视图模式架构](#视图模式架构)
- [甘特图实现细节](#甘特图实现细节)
- [移除筛选的影响面](#移除筛选的影响面)
- [文件清单](#文件清单)
- [未来迭代点](#未来迭代点)

## 背景

原 [TaskView.vue](../../apps/frontend/src/views/TaskView.vue) 仅支持单一网格视图 + 状态/优先级两个下拉筛选。本次迭代目标：

1. **删除两个筛选下拉**，让顶栏更紧凑
2. 在「新建任务」按钮左侧新增 **视图模式切换 bar**（5 个 icon 互斥按钮）
3. 支持 5 种视图变体：网格 / 紧凑 / 优先级分组 / 状态分组 / 甘特图
4. 为甘特图补齐数据库字段 `startDate`

## 数据契约变更

### 为什么必须新增 `startDate`

甘特图的核心语义是「计划起止区间」，必须有两个独立的时间字段：

| 字段 | 用途 | 是否新增 |
|---|---|---|
| `startDate` | 计划开始日 | ✅ 新增 |
| `dueDate` | 计划结束日 | 沿用 |
| `createdAt` | 元数据，**不可**充当开始时间 | 沿用 |

**为什么不复用 `createdAt`**：`createdAt` 是录入系统时间，与「任务计划开始时间」语义错配。例如周一录入下周才开工的任务，用 `createdAt` 画出来的甘特条会把空闲周纳入，整张图直接失真；且 `createdAt` 由 `timestamps: true` 自动维护，前端无法修正。

### 改动范围（5 处）

1. [packages/shared/types.ts](../../packages/shared/types.ts)：`TaskDocument` 加 `startDate?: Date`
2. [task.schema.ts](../../apps/backend/src/modules/task/schemas/task.schema.ts)：加 `@Prop({ type: Date }) startDate?: Date`
3. [create-task.dto.ts](../../apps/backend/src/modules/task/dto/create-task.dto.ts) / [update-task.dto.ts](../../apps/backend/src/modules/task/dto/update-task.dto.ts)：加 `@IsOptional() @Type(()=>Date) @IsDate() startDate?: Date`
4. [api/task.ts](../../apps/frontend/src/api/task.ts)：`TaskItem` / `CreateTaskPayload` 加 `startDate?: string`
5. [TaskFormModal.vue](../../apps/frontend/src/components/TaskFormModal.vue)：表单加「开始日期」`NDatePicker`，并对 `startDate > dueDate` 做前端 warning 提示

字段全部为可选，老数据可继续读写，甘特图对没排期的任务降级处理。

## 视图模式架构

### 状态机

`useTaskStore.viewMode: 'grid' | 'compact' | 'priority-group' | 'status-group' | 'gantt'`，默认 `'grid'`，通过 `pinia-plugin-persistedstate` 的 `pick: ['viewMode']` 持久化到 localStorage（不持久化 `tasks` / `isLoading` 这种瞬态状态）。

### UI 入口

[TaskView.vue](../../apps/frontend/src/views/TaskView.vue) 在 `<NPageHeader>` 的 `#extra` 内放一个 `.view-bar` 容器，内含 5 个 `NTooltip + NButton` 互斥单选：

| Icon（@vicons/ionicons5） | 模式 | 渲染组件 |
|---|---|---|
| `GridOutline` | `grid` | 原 NGrid + TaskCard |
| `ReorderFourOutline` | `compact` | [TaskCompactView.vue](../../apps/frontend/src/components/TaskCompactView.vue) |
| `FlameOutline` | `priority-group` | [TaskGroupView.vue](../../apps/frontend/src/components/TaskGroupView.vue) `groupBy="priority"` |
| `LayersOutline` | `status-group` | TaskGroupView.vue `groupBy="status"` |
| `BarChartOutline` | `gantt` | [TaskGanttView.vue](../../apps/frontend/src/components/TaskGanttView.vue) |

### 组件拆分思路

- **TaskCompactView**：单列「书脊条 + 标题」紧凑列表，CSS Grid 自适应列宽（min 220px），用于一屏看尽所有任务
- **TaskGroupView**：通用分组容器，接受 `groupBy` props 决定分组维度，内部按既定顺序数组渲染 3 个 section
- **TaskGanttView**：完全自研，详见下节

为什么 priority-group 和 status-group 复用同一个组件：分组容器结构完全一致（标题 + 计数 + 卡片网格），唯一差异是分组维度和顺序，用 props 切换比拆两个组件更省代码。

## 甘特图实现细节

[TaskGanttView.vue](../../apps/frontend/src/components/TaskGanttView.vue) 采用纯 CSS Grid + 绝对定位实现，**没有引入** `dhtmlx-gantt` / `vue-ganttastic` 等第三方库。

### 为什么不引第三方库

- 个人项目数据量小（< 100 条任务），用不到第三方库的虚拟滚动、依赖关系、关键路径等高级特性
- `dhtmlx-gantt` 商用许可不友好；`vue-ganttastic` 维护活跃度一般
- 自研一份约 250 行，主题色和现有「午后书阁」配色无缝衔接

### 时间轴范围计算

```
range.start = min(所有 startDate/dueDate, today - 3d) - 3d
range.end   = max(所有 startDate/dueDate, today + 3d) + 3d
```

留 3 天 padding 让任务条不贴边；若所有任务都没排期，默认显示 [today-7d, today+14d]。

### 日粒度刻度

- 每天 1 列 = 32px（`DAY_WIDTH` 常量）
- 双层表头：月份合并行 + 日期单格行
- 周末灰背景、今日金色高亮（用 `--app-priority-high` 复用主题色）

### 任务条规则

| 情况 | 表现 |
|---|---|
| 有 `startDate` 且有 `dueDate` | 完整矩形条 |
| 只有其中一个 | 单日圆点（`gantt-bar--point`） |
| 两者皆无 | 左侧标题仍显示，时间轴区域显示「未排期」斜体 |
| `startDate > dueDate`（异常） | 自动对调，不报错（容错） |

颜色按优先级映射（`--app-priority-high/medium/low`），与卡片书脊色保持视觉一致。

### 交互

- 左侧标题列 sticky，水平滚动时常驻
- 任务条 hover 展示 `NTooltip`，包含「标题 + 起止日期」
- 任务条/标题列点击触发 `@edit`，复用现有编辑弹窗

## 移除筛选的影响面

旧实现：[TaskView.vue](../../apps/frontend/src/views/TaskView.vue) 顶栏两个 `NSelect` + `watch` + store `filter` reactive + `getTaskList(filter)`。

新实现彻底拆除：

1. 删除 `useTaskStore.filter`（reactive 字段）
2. 删除 `watch(() => [...filter.status, filter.priority], fetchList)`
3. `getTaskList()` 不再接受参数（后端 query DTO 暂保留，无副作用）
4. 视图层不再有「筛选下拉」，分组视图天然就是分类展示，比筛选更直观

后端 `query-task.dto.ts` 暂未删除，保持接口契约稳定；如未来确认无消费者，可再清理。

## 文件清单

### 新增

- [TaskCompactView.vue](../../apps/frontend/src/components/TaskCompactView.vue)
- [TaskGroupView.vue](../../apps/frontend/src/components/TaskGroupView.vue)
- [TaskGanttView.vue](../../apps/frontend/src/components/TaskGanttView.vue)

### 修改

- [packages/shared/types.ts](../../packages/shared/types.ts) — 加 `startDate`
- [apps/backend/src/modules/task/schemas/task.schema.ts](../../apps/backend/src/modules/task/schemas/task.schema.ts) — 加 `startDate`
- [apps/backend/src/modules/task/dto/create-task.dto.ts](../../apps/backend/src/modules/task/dto/create-task.dto.ts) — 加 `startDate`
- [apps/backend/src/modules/task/dto/update-task.dto.ts](../../apps/backend/src/modules/task/dto/update-task.dto.ts) — 加 `startDate`
- [apps/frontend/src/api/task.ts](../../apps/frontend/src/api/task.ts) — 加 `startDate`，移除 `filter` 参数
- [apps/frontend/src/stores/task.ts](../../apps/frontend/src/stores/task.ts) — 删 `filter`、加 `viewMode` + 持久化
- [apps/frontend/src/views/TaskView.vue](../../apps/frontend/src/views/TaskView.vue) — 删筛选、加 view-bar、加视图路由
- [apps/frontend/src/components/TaskFormModal.vue](../../apps/frontend/src/components/TaskFormModal.vue) — 加开始日期 + 跨字段 warning

### 依赖

- `apps/frontend` 新增 `@vicons/ionicons5`（Naive UI 官方推荐 icon 集）

## 未来迭代点

- 甘特图横向缩放（日/周/月切换）
- 任务条拖拽改时间（直接更新 `startDate` / `dueDate`）
- 分组视图内拖拽变更分组（跨组拖拽切状态/优先级）
- 紧凑视图加内联编辑（双击标题改名）
- 时间轴范围加「跳转到今天」按钮
