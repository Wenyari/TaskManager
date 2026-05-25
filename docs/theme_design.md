> 版本：v1.0 ｜ 最后更新：2026-05-25
>
> 修订记录
> - v1.0 (2026-05-25)：初版。定义"图书馆/书架"主题的两套配色（午后书阁 / 夜读书房）、技术落地方式、关键决策与避坑点。

# 主题设计：图书馆 · 书架

本项目主题以**纸张材质 + 木质书架**为核心意象，避开常见 SaaS 的"中性灰 + 蓝"配色，让任务卡片读起来像翻一本书。

## 目录

1. [设计目标与基调](#1-设计目标与基调)
2. [两套配色](#2-两套配色)
3. [实现架构](#3-实现架构)
4. [视觉细节](#4-视觉细节)
5. [关键决策](#5-关键决策)
6. [扩展指引](#6-扩展指引)

---

## 1. 设计目标与基调

**核心意象**：午后/深夜的私人书房，木质书架、羊皮纸笔记、烫金书脊、烛光黄铜灯。

**设计原则**：
- **避开中性灰**：所有"灰色"用墨棕/烟熏木代替，背景偏暖
- **强调材质感**：背景有书架横纹，卡片左侧有"书脊"色带
- **优先级即装帧色**：高=深红绒、中=铜黄、低=森林绿。这三色既是图书馆装饰常见三原色，又有明确语义对比
- **字体衬线优先**：Noto Serif SC / Songti SC，强化"读书"质感；现代无衬线作 fallback
- **动效克制**：切换主题用 `transition` 平滑过渡，鼠标悬停书脊用 `translateY(-2px)`，避免抢眼

**反例（不做的事）**：
- 不使用纯黑 `#000` / 纯白 `#FFF`
- 不引入复杂图片纹理（用 CSS `repeating-linear-gradient` 代替）
- 不在主题中混入第二种主色（如蓝色 + 棕色），保持单色调

---

## 2. 两套配色

### 2.1 浅色主题「午后书阁」

羊皮纸 + 胡桃木 + 黄铜烫金。整体暖、柔、明亮。

| 用途 | 色值 | 备注 |
|---|---|---|
| 主背景 `bg` | `#F5EDDC` | 羊皮纸 |
| 卡片背景 `bgElevated` | `#FBF6E9` | 翻开的书页 |
| 输入框背景 | `#FFFAF0` | 米白纸 |
| 主文本 | `#3B2E20` | 墨棕（替代纯黑） |
| 次文本 | `#6B5B47` | 浅墨 |
| 三级文本 | `#8B7B65` | 灰墨 |
| 边框 | `#D9C9A8` | 米色书页纸边 |
| 主色 `primary` | `#9B6A2F` | 烫金书脊 |
| 优先级·高 | `#8B2E2E` | 深红绒 |
| 优先级·中 | `#B8884F` | 铜黄 |
| 优先级·低 | `#4A6B5C` | 森林绿 |
| 书架横纹 | `rgba(123, 85, 36, 0.18)` | 半透明胡桃木 |

### 2.2 深色主题「夜读书房」

烟熏胡桃木 + 烛光纸黄 + 绿绒。整体暖、低饱和、不刺眼。

| 用途 | 色值 | 备注 |
|---|---|---|
| 主背景 `bg` | `#1F1812` | 深胡桃木 |
| 卡片背景 `bgElevated` | `#2A2018` | 烟熏木 |
| 输入框背景 | `#1A1410` | 深木凹 |
| 主文本 | `#E8DCC4` | 烛光纸 |
| 次文本 | `#A89478` | 米黄 |
| 三级文本 | `#7C6A52` | 暗米黄 |
| 边框 | `#3D3026` | 深木边 |
| 主色 `primary` | `#D4A65A` | 黄铜烛灯 |
| 优先级·高 | `#C97373` | 暗红绒 |
| 优先级·中 | `#D4A65A` | 黄铜 |
| 优先级·低 | `#7FA690` | 哑绿 |
| 书架横纹 | `rgba(212, 166, 90, 0.22)` | 半透明黄铜 |

**对比度自检**：
- 浅色主文本 `#3B2E20` on `#F5EDDC` → ~10.5:1，远超 WCAG AAA 7:1
- 深色主文本 `#E8DCC4` on `#1F1812` → ~12:1，远超 WCAG AAA

---

## 3. 实现架构

### 3.1 模块划分

```
apps/frontend/src/
├── themes/
│   └── index.ts                ← 两套调色板 + naive-ui themeOverrides
├── stores/
│   └── theme.ts                ← pinia store（mode + persist）
├── App.vue                     ← NConfigProvider + watchEffect 注入 CSS 变量
└── assets/base.css             ← 仅 reset，不再定义颜色
```

### 3.2 调色板与 naive-ui 桥接

[themes/index.ts](apps/frontend/src/themes/index.ts) 导出两个对象：

- `LIGHT_PALETTE` / `DARK_PALETTE`：项目自定义语义色（priority、shelfStripe 等）
- `lightThemeOverrides` / `darkThemeOverrides`：传给 naive-ui `NConfigProvider` 的覆盖配置

naive-ui 的 `themeOverrides` 走 `common.*` 字段（primaryColor、bodyColor、textColorBase 等），这部分覆盖会自动级联到所有 naive-ui 组件，**不需要逐个组件重写**。

### 3.3 状态管理

[stores/theme.ts](apps/frontend/src/stores/theme.ts) 用 pinia + `persist: true`，持久化 key 是 store 名 `theme`，结构 `{ mode: 'light' | 'dark' }`。

### 3.4 动态生效机制

[App.vue](apps/frontend/src/App.vue) 做两件事：

1. `NConfigProvider :theme="naiveTheme" :theme-overrides="themeOverrides"` —— naive-ui 组件的颜色
2. `watchEffect` 把当前 palette 写入 `:root` 的 CSS 自定义属性 `--app-bg` / `--app-text-base` / `--app-priority-high` 等 —— 业务自写样式可直接 `var(--app-xxx)` 引用，无需手动响应式

**为什么不只用 naive-ui 主题**：业务侧很多自定义样式（书架横纹、书脊色、登录卡片标题）不在 naive-ui 体系内，必须有一组项目级 CSS 变量。两层共享同一份调色板就是协调点。

### 3.5 持久化与首屏

mode 走 pinia-plugin-persistedstate，刷新页面立即恢复用户上次选择，无 FOUC（因为 store 在 main.ts 里 `app.use(pinia)` 后就会同步读取 localStorage，App.vue 的 watchEffect 在首次渲染前就跑了）。

---

## 4. 视觉细节

### 4.1 书架横纹（body 背景）

[App.vue](apps/frontend/src/App.vue) 的 `body::before` 用 `repeating-linear-gradient` 画 39px 一道的横线，给整个 viewport 一种"层叠书页"的暗示。`opacity: 0.55`、`pointer-events: none` 保证不干扰交互。

### 4.2 书脊（任务卡片）

[TaskCard.vue](apps/frontend/src/components/TaskCard.vue) 给 NCard 加 `border-left: 4px solid var(--spine-color)`，spine-color 由 priority 计算。任务卡片排成网格时，整体看起来像**书架上一排排立着的书**，每本书的书脊颜色暗示重要性。

### 4.3 登录页"藏书阁"标题

[LoginView.vue](apps/frontend/src/views/LoginView.vue) 用衬线字体 + 0.4em 字距，把标题"藏书阁"做成藏书票质感。右上角 `theme-toggle` 圆形按钮，hover 时 `rotate(20deg)` —— 暗示"翻页"。

### 4.4 任务页"卷宗"语境

[TaskView.vue](apps/frontend/src/views/TaskView.vue) `NPageHeader` 标题改成"卷宗 · {username}"，副标题是装饰横线 `——— 馆内待阅 ———`。空状态文案改成"书架空空，点击「新建任务」添置第一卷"。

---

## 5. 关键决策

### D-T01 用 CSS 变量而非 SCSS 变量
**立场：CSS 变量。** SCSS 变量编译期固定，没法响应 store.mode 变化。CSS 自定义属性是浏览器原生响应式，在 `:root` 上一次设值，全局组件实时切换。代价是兼容性需要 IE11+，本项目目标浏览器是现代浏览器，零代价。

### D-T02 主题状态走 pinia 而非 useDark/useColorMode 这类 composable
**立场：pinia store。** 项目已有 user/task 两个 pinia store + persist 插件，再起一个 theme store 心智成本低，跟现有持久化机制一致。`@vueuse/core` 的 `useDark` 也能用，但要再引一个 hook + 它自己的 storage 实现，不值得。

### D-T03 naive-ui themeOverrides + 项目 CSS 变量双轨制
**立场：双轨。** naive-ui 内部组件由 `themeOverrides` 控制（已经覆盖到几乎所有视觉元素），业务自定义样式（书架横纹、书脊、标题字体）由 `--app-*` CSS 变量控制。这两套在 [themes/index.ts](apps/frontend/src/themes/index.ts) 共享同一份 PALETTE 常量，单一数据源。否则要么放弃 naive-ui 的覆盖能力（自己重写所有组件样式，工程量爆炸），要么放弃自定义视觉（主题就只是"换 naive-ui 默认色"，做不出图书馆质感）。

### D-T04 不使用 prefers-color-scheme 自动跟随系统
**立场：手动切换为主，不自动跟随。** 用户登录后是来读任务的，不是来看主题的，"系统切深色我应用突然变深"是反预期的。当前提供右上角按钮显式切换，状态走 persist 跟用户绑定。未来若要加自动跟随，再在 store 里加 `auto` 第三种 mode + 监听 `matchMedia`。

### D-T05 不引入图片纹理资源
**立场：纯 CSS gradient。** 图书馆质感容易被联想成"做一张木纹背景图加上去"，但图片资源会增加首屏体积、不响应主题、缩放走样。`repeating-linear-gradient` + 半透明色完美解决——切换主题时横纹颜色自动跟随，零额外资源。

---

## 6. 扩展指引

### 新增第三种主题（如"羊皮纸 sepia"）
1. 在 [themes/index.ts](apps/frontend/src/themes/index.ts) 加 `SEPIA_PALETTE` + `sepiaThemeOverrides`
2. 把 `ThemeMode` 改为 `'light' | 'dark' | 'sepia'`
3. [App.vue](apps/frontend/src/App.vue) 的 `naiveTheme` / `themeOverrides` / `getPalette` 三个分支扩展
4. theme store 的 `toggle()` 改为循环

### 调整某个色值
**永远改 `themes/index.ts` 的 PALETTE 常量**，不要在组件里写死颜色。所有组件都通过 `var(--app-xxx)` 或 naive-ui 主题间接引用。

### 添加业务侧 CSS 变量
1. 在 PALETTE 加字段（如 `taskShadow: '...'`）
2. [App.vue](apps/frontend/src/App.vue) `watchEffect` 加一行 `setProperty`
3. 组件里 `var(--app-task-shadow)` 引用

### naive-ui 组件颜色不对
先看 [naive-ui 官方主题文档](https://www.naiveui.com/zh-CN/light/docs/customize-theme) 找到对应的 `XxxThemeOverrides` 类型，加到 themes/index.ts 的对应 themeOverrides 里。**不要**给组件加自定义 class 覆盖样式——那会让主题切换不生效。
