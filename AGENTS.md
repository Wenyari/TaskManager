## 前置

必须阅读AGENTS.md文件和CLAUDE.md文件

## 前端编码指南

# 项目开发规范指南

## 1. 代码格式化 (Prettier)
项目统一使用 `.prettierrc` 配置文件，核心配置如下：
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 120,
  "trailingComma": "none",
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "bracketSameLine": false,
  "quoteProps": "as-needed",
  "proseWrap": "preserve",
  "endOfLine": "auto",
  "overrides": [
    { "files": ["*.vue"], "options": { "tabWidth": 2, "endOfLine": "crlf", "printWidth": 180 } },
    { "files": ["*.tsx", "*.jsx"], "options": { "parser": "typescript", "printWidth": 120 } },
    { "files": ["*.md"], "options": { "printWidth": 80, "proseWrap": "always" } },
    { "files": ["*.json"], "options": { "printWidth": 200, "trailingComma": "none" } }
  ]
}
```

## 2. 命名规范

### 2.1 变量与常量
- **普通变量**：小驼峰 (`camelCase`)。例如：`const userName = "张三"`。
- **常量**：全大写 + 下划线分隔 (`CONSTANT_CASE`)。例如：`const MAX_RETRY_COUNT = 3`。
- **布尔值**：必须带有语义化前缀（`is`/`has`/`should`/`can`/`will`）。例如：`isLogin`, `hasPermission`。

### 2.2 函数与方法
- **规范**：小驼峰 + 动宾结构。
- **示例**：`getUserInfo`, `validateForm`。
- **异步请求**：建议使用 `fetch` 或 `load` 开头。例如：`fetchProductList`。

### 2.3 类、构造函数与组件
- **规范**：大驼峰 (`PascalCase`)。
- **适用场景**：ES6 类、React/Vue 组件。文件名需与组件名保持一致。

### 2.4 CSS/Less/Scss
- **规范**：连字符 (`kebab-case`)。
- **推荐**：结合 BEM 命名法（`块__元素--修饰符`）。例如：`.user-card__name--active`。

## 3. 文件与目录命名

### 3.1 目录命名
- **规范**：统一使用小写连字符 (`kebab-case`)。
- **示例**：`src/components/user-card/`, `src/views/order-list/`。

### 3.2 文件命名
- **普通文件**（工具函数、API、配置、类型等）：小写连字符 (`kebab-case`)。例如：`format-time.ts`, `user-detail.ts`。
- **组件文件**（Vue/React 组件、类文件）：大驼峰 (`PascalCase`)。例如：`UserCard.vue / UserCard.tsx`, `DateHelper.ts`。
- **特殊固定文件**：遵循行业惯例（小写单单词）。例如：`package.json`, `index.ts`, `.eslintrc.js`。

## 4. Git 规范

### 4.1 提交信息 (Conventional Commits)
- **格式**：`type(scope): message`
- **示例**：
  - `feat(exam): add 'result' page`
  - `fix(workspace): remove unused style`

### 4.2 分支命名
- **规范**：包含类型和具体业务 ID/描述。
- **示例**：`feat/[feature-id]-review-list-hint`, `fix/[issue-id]-remove-review-list-hint`。

## 5. DOM 规范
- **禁止**：使用数字开头的字符串作为 `dom id`。
- **正确**：`<div id="create-item-confirm-btn"></div>`。

## 6. Vue 状态管理对比 (Pinia vs createInjectionState)

| 特性 | Pinia | VueUse createInjectionState |
| :--- | :--- | :--- |
| **核心机制** | 全局单例 | 基于 Provide/Inject (依赖组件树) |
| **生命周期** | 全局持久（需手动销毁） | 随提供者组件自动销毁 |
| **多实例** | 不支持（所有实例共享） | 支持（不同组件树独立状态） |
| **适合场景** | 用户信息、主题、语言等全局状态 | 复杂表单、多步向导、页面/业务局部状态 |
| **推荐优先级** | **全局、持久、复杂状态首选** | **页面级、临时、业务局部状态首选** |

## 7. TypeScript 最佳实践
- **优先使用类型推导**：利用 `typeof`、`ReturnType`、`Awaited` 等工具自动化同步接口类型，减少维护成本。
- **示例**：
  ```typescript
  import { getUserInfo } from './api'
  // 自动获取接口返回类型
  const res: Awaited<ReturnType<typeof getUserInfo>> = await getUserInfo(id)
  ```
## 8. React JSX 属性
- 使用 className 代替 class。

- 使用 htmlFor 代替 for。

- 事件监听采用小驼峰（onClick, onChange）。

## 9. React 状态管理对比 (Zustand vs Context)
| 特性 | Zustand | React Context + useReducer |
| :--- | :--- | :--- |
| **核心机制** | 外部 Store，订阅式更新（细粒度订阅） | 组件树注入，Provider/Consumer 模式 |
| **生命周期** | 全局单例，应用生命周期内持久 | 随 Provider 组件生命周期，组件卸载时自动销毁 |
| **多实例** | 不支持（全局单例，所有组件共享同一 store） | 支持（可在不同组件树中使用多个 Provider，各自独立状态） |
| **使用复杂度** | 简单，API 精简，学习成本低 | 中等，需理解 Provider/Consumer 模式 |
| **适合场景** | 用户信息、主题、语言等全局状态 | 复杂表单、多步向导、页面/业务局部状态 |
| **推荐优先级** | **全局、持久、复杂状态首选** | **页面级、临时、业务局部状态首选** |

---
*更新日期：2026-01-14*


## 后端编码指南

1. 普通变量（小驼峰）
```typescript
const taskName = '图像任务'
const taskname = '图像任务'
```
2. 常量（全大写下划线连接）
常量通常写在配置文件里导入

```typescript
const BASE_URL = config.embedding.url
const baseUrl = ''
```
3. 枚举
Key
- 全大写下划线连接
- 要表明含义，value与key一致或者表明一定顺序
Value
- 旧项目沿用全大写下划线连接保持统一
- 新项目使用小写下划线

```typescript
enum SPACE_ROLE {
ADMIN = 'ADMIN'
MANAGER = 'MANAGER' 
WORKER = 'WORKER'
}

```


```typescript
enum PROJECT_STATUS {
UNSTART = 0,
RUNNING = 1,
FINISHED = 2
}

```


```typescript
enum SPACE_ROLE {
    ADMIN = 'admin'
    MANAGER = 'manager' 
    WORKER = 'worker'
}
enum SPACE_ROLE {
    1 = 'ADMIN'
    2 = 'MANAGER' 
    3 = 'WORKER'
    }

enum PROJECT_STATUS {
    UNSTART = 1,
    RUNNING = 0,
    FINISHED = 2
}

enum SPACE_ROLE {
    admin = 'admin'
    manager = 'manager' 
    worker = 'worker'
}
```

4. 接口（短划线连接）
动宾短语描述接口用途，统一使用post

```typescript
@POST('get-label-statistic')

@POST('delete-item')
@GET('label-statistic/:taskId')

@DELETE(':itemId')
```

5. interface（大驼峰）
存到数据库用于schema的类以Document结尾
将可选字段排列在后面

```typescript
interface ProjectDocument{
    name: string
    clientId: Types.ObjecyId 
    supplierId: Types.ObjectId
    status: PROJECT_STATUS
    distributorId?: Types.ObjectId
    contract?: string 
    counter: SourceCounterDocument
}

interface SourceCounterDocument {
    file:

}


interface Project{}

interface ProjectDocument{
    name: string
    clientId: Types.ObjecyId
    supplierId: Types.ObjectId
    distributorId?: Types.ObjectId
    status: PROJECT_STATUS
    contract?: string 
}

```
6. class（大驼峰）
对应类型的class以对应名结尾

```typescript
class AuthController{}

class GetUserListDto{}
class authController{}

class GetUserList{}

```

7. 函数（小驼峰）
函数名同样描述清楚函数用途，规定好各入参类型（最好也能定义好出参类型）

```typescript
async getTaskList(
spaceId: Types.ObjectId
):Promise<Task[]> {
}

async taskList(){}

async GetTaskList(){}

async getTaskList(spaceId){}
可选参数排列方式
async getFilteredItem(
taskId: Types.ObjectId,
filter:{spaceId?: Types.ObjectId,
        nodeId?: Types.ObjectId,
        domainId?: string}
){}
async getFilteredItem(
taskId: Types.ObjectId,
spaceId?: Types.ObjectId,
nodeId?: Types.ObjectId,
domainId?: string
){}
```
8. 异常message
通常情况下抛出DefaultException或 Exception，根据不同项目统一

```typescript
throw new DefaultException('task is closed')
throw new Error('')
```
9. 数组方法
数组名是某名词的复数时，元素名直接用单数形式或首字母或合适的缩写，如果实在过长可以统一使用element缩写el

```typescript
labels.map((label)=>
console.log(label.count)
)

permissions.forEach((p)=>return p.role)

labels.map((a)=>return a.count)
```
10. 注释
- 双斜杠后空一格
- 单个字段注释跟在类型后面

```typescript
// 这是一个注释

interface projectDocument{
name: string // 项目名称
clientId: Types.ObjectId // 客户id
}

  /**
   * 基础统计数据
   * 累计标注条目数，累计准确率，累计标注标签数
   */
//这是一个注释

interface projectDocument{
// 项目名称
name: string 
// 客户id
clientId: Types.ObjectId 
}
```
11. ObjectId格式转换
```typescript
userId.toString()
userId + ''
```
12. 提交（类别+具体描述）
注意英文冒号后空一格，全部用英文描述
feat: add label statistic // 新增功能
fix: fix abnormal statistics and discard data // 修复问题
perf: optimize the member workload statistics performance // 代码优化
refactor: adjust the dataset module // 代码重构
chore: clean up useless export code // 杂项
fix:ok了


13. 分支
<type>[/<scope>]/<description>
- <type> - 类型
  - feature/ or feat/ – for new features
  - bugfix/ or fix/ – for bug fixes
  - hotfix/ – for urgent production fixes
  - docs/ – for documentation changes
  - refactor/ – for code restructuring
  - chore/ – for maintenance tasks (e.g., dependency updates)
- <scope> - 范围（在monorepo中，指定项目）(可选）
- <description> - 描述
全部小写
使用-作为连接符
feature/admin/password-policy
fix/remo-experts/push-notifications
chore/update-ts-config
password-policy
feature/admin/passwordPolicy
Feature/admin/Password-Policy
feature/admin/password_policy
14. 目录结构


15. 包管理器
pnpm

16. 格式化
Vscode 安装插件 ESlint 和 Prettier - Code formatter
保存代码时注意执行格式化
