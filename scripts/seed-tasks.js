#!/usr/bin/env node
/**
 * 数据库 mock 数据脚本
 *
 * 往 MongoDB 的 tasks 集合插入约 40 条任务（程序员日常主题，覆盖编码/评审/上线/会议/调研）。
 *
 * 用法：
 *   node scripts/seed-tasks.js                    # 给第一个用户插入
 *   node scripts/seed-tasks.js --user alice       # 给用户名 alice 插入
 *   node scripts/seed-tasks.js --reset            # 先清空目标用户已有任务再插入
 *   MONGODB_URI=mongodb://localhost:27017/taskmanager node scripts/seed-tasks.js
 *
 * 立场：脚本独立运行，不启动 NestJS。直接用 mongoose driver，启动快、可反复执行。
 */

const path = require('path')
const fs = require('fs')
const mongoose = require(path.resolve(__dirname, '../apps/backend/node_modules/mongoose'))

// 手写解析 backend/.env 拿 MONGODB_URI；避免引入 dotenv 依赖。命令行 / 环境变量优先。
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf-8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!(key in process.env)) process.env[key] = value
  }
}
loadEnvFile(path.resolve(__dirname, '../apps/backend/.env'))

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager'

const args = process.argv.slice(2)
const reset = args.includes('--reset')
const userIdx = args.indexOf('--user')
const targetUsername = userIdx >= 0 ? args[userIdx + 1] : null

// 与 packages/shared/enums.ts 保持一致；脚本独立，直接写字面量更直观
const TASK_STATUS = { TODO: 'TODO', IN_PROGRESS: 'IN_PROGRESS', DONE: 'DONE' }
const TASK_PRIORITY = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' }

const DAY = 24 * 60 * 60 * 1000

function daysFromNow(d) {
  return new Date(Date.now() + d * DAY)
}

// 程序员日常任务，覆盖：bug 修复 / 重构 / 调研 / 评审 / 会议 / 上线 / 文档 / 性能 / 安全
// startDate / dueDate 故意混搭：部分任务只给 dueDate（甘特图退化单日点）、个别两者全无（"未排期"）
const TASKS = [
  // ─── 高优先级 / 进行中 ───
  {
    title: '修复登录页 OAuth Google 回调 bug',
    content: 'Chrome 117+ 上回调 URL 的 state 校验失败，复现率约 30%。',
    status: TASK_STATUS.IN_PROGRESS,
    priority: TASK_PRIORITY.HIGH,
    startDate: daysFromNow(-3),
    dueDate: daysFromNow(2)
  },
  {
    title: '处理 Sentry 上的 5 条线上报错',
    content: '集中在 /task/get-list 接口，疑似 ObjectId 反序列化问题。',
    status: TASK_STATUS.IN_PROGRESS,
    priority: TASK_PRIORITY.HIGH,
    startDate: daysFromNow(-2),
    dueDate: daysFromNow(5)
  },
  {
    title: '修复甘特图日期边界 off-by-one',
    content: '跨月时偶发任务条左移一天，怀疑 timezone 处理问题。',
    status: TASK_STATUS.IN_PROGRESS,
    priority: TASK_PRIORITY.HIGH,
    startDate: daysFromNow(-1),
    dueDate: daysFromNow(1)
  },
  {
    title: '修复 Safari 17 上 NDatePicker 错位',
    content: '弹层 transform 与 -webkit-overflow-scrolling 冲突。',
    status: TASK_STATUS.IN_PROGRESS,
    priority: TASK_PRIORITY.HIGH,
    startDate: daysFromNow(0),
    dueDate: daysFromNow(3)
  },

  // ─── 高优先级 / 待办 ───
  {
    title: '优化首屏 LCP 至 2s 以内',
    content: 'Lighthouse 当前 3.4s，重点：图片懒加载、字体预加载、route-level code splitting。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.HIGH,
    startDate: daysFromNow(2),
    dueDate: daysFromNow(9)
  },
  {
    title: '梳理 MongoDB 慢查询并补索引',
    content: '近 7 天 slow log 共 12 条，集中在 tasks.find({ userId, status })。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.HIGH,
    startDate: daysFromNow(1),
    dueDate: daysFromNow(5)
  },
  {
    title: '与 DBA 复核 MongoDB 副本集配置',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.HIGH,
    startDate: daysFromNow(3),
    dueDate: daysFromNow(4)
  },
  {
    title: '与 SRE 演练数据库故障切换',
    content: '模拟主库宕机，验证自动 failover 时长。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.HIGH,
    startDate: daysFromNow(7),
    dueDate: daysFromNow(8)
  },
  {
    title: '修复 SSE 长连接超时断流',
    content: 'nginx 默认 60s 断开，需调 proxy_read_timeout 至 600s 并加 heartbeat。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.HIGH,
    // 故意只给 dueDate，甘特图会渲染为单日圆点
    dueDate: daysFromNow(12)
  },

  // ─── 高优先级 / 完成 ───
  {
    title: '修复登录后 token 续期失败',
    content: '刷新 token 时 refresh 请求漏带 Authorization 头。',
    status: TASK_STATUS.DONE,
    priority: TASK_PRIORITY.HIGH,
    startDate: daysFromNow(-14),
    dueDate: daysFromNow(-10)
  },

  // ─── 中优先级 / 进行中 ───
  {
    title: '接口契约同步到 Apifox',
    content: '把 task / auth 接口录入 Apifox 并建立 mock。',
    status: TASK_STATUS.IN_PROGRESS,
    priority: TASK_PRIORITY.MEDIUM,
    startDate: daysFromNow(-5),
    dueDate: daysFromNow(4)
  },
  {
    title: '与产品对齐任务管理 V2 PRD',
    content: '重点讨论依赖关系、子任务、循环任务的数据模型。',
    status: TASK_STATUS.IN_PROGRESS,
    priority: TASK_PRIORITY.MEDIUM,
    startDate: daysFromNow(-7),
    dueDate: daysFromNow(7)
  },
  {
    title: '整理后端 API 错误码规范',
    content: '统一 4xx / 5xx 语义，补 i18n key。',
    status: TASK_STATUS.IN_PROGRESS,
    priority: TASK_PRIORITY.MEDIUM,
    startDate: daysFromNow(-4),
    dueDate: daysFromNow(6)
  },

  // ─── 中优先级 / 待办 ───
  {
    title: '重构用户模块至领域驱动结构',
    content: '拆 entity / repository / service 三层，配合 V2 PRD。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM,
    startDate: daysFromNow(5),
    dueDate: daysFromNow(18)
  },
  {
    title: '为 TaskService 补单元测试',
    content: 'Jest，至少覆盖 update / delete 的异常分支。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM,
    startDate: daysFromNow(4),
    dueDate: daysFromNow(10)
  },
  {
    title: 'Docker 多阶段构建优化',
    content: '把最终镜像压到 150MB 以内，分离 deps / build / runtime。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM,
    startDate: daysFromNow(8),
    dueDate: daysFromNow(12)
  },
  {
    title: '集成 vue-i18n 中英双语',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM,
    startDate: daysFromNow(10),
    dueDate: daysFromNow(21)
  },
  {
    title: '配置 GitHub Actions CI',
    content: 'lint + type-check + build + test，PR 必跑。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM,
    startDate: daysFromNow(6),
    dueDate: daysFromNow(11)
  },
  {
    title: '编写 JWT 鉴权 e2e 测试',
    content: 'supertest，包含 token 过期、被踢下线场景。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM,
    startDate: daysFromNow(11),
    dueDate: daysFromNow(16)
  },
  {
    title: '接入 OpenTelemetry 链路追踪',
    content: '后端埋点 + 前端 Web Vitals 上报到 Tempo。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM,
    startDate: daysFromNow(14),
    dueDate: daysFromNow(25)
  },
  {
    title: '准备季度 OKR 述职材料',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM,
    // 故意只给 dueDate
    dueDate: daysFromNow(13)
  },
  {
    title: '处理 dependabot 周报安全告警',
    content: '本周 7 条，重点关注 lodash CVE-2024-xxxx。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM,
    startDate: daysFromNow(2),
    dueDate: daysFromNow(6)
  },
  {
    title: '优化打包体积，启用 Rollup 分包',
    content: '把 naive-ui、@vicons 拆为独立 chunk。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM,
    startDate: daysFromNow(9),
    dueDate: daysFromNow(17)
  },
  {
    title: '编写 mongo backup 脚本',
    content: '调用 mongodump，按日期归档，保留近 7 份。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM,
    startDate: daysFromNow(5),
    dueDate: daysFromNow(9)
  },
  {
    title: '完善 ESLint flat config',
    content: '补 TypeScript / Vue / React 解析规则。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM
    // 故意两个时间都不给，甘特图显示"未排期"
  },

  // ─── 中优先级 / 完成 ───
  {
    title: '升级 NestJS 11 至最新补丁版',
    content: '11.0.x → 11.1.x，回归核心接口无回退。',
    status: TASK_STATUS.DONE,
    priority: TASK_PRIORITY.MEDIUM,
    startDate: daysFromNow(-20),
    dueDate: daysFromNow(-15)
  },
  {
    title: '编写 README 部署章节',
    status: TASK_STATUS.DONE,
    priority: TASK_PRIORITY.MEDIUM,
    startDate: daysFromNow(-25),
    dueDate: daysFromNow(-22)
  },
  {
    title: '实现暗黑模式（CSS Variables）',
    content: 'data-theme 切换 + localStorage 持久化。',
    status: TASK_STATUS.DONE,
    priority: TASK_PRIORITY.MEDIUM,
    startDate: daysFromNow(-18),
    dueDate: daysFromNow(-8)
  },
  {
    title: '面试候选人：前端 P6 二面',
    content: '考察 Vue 响应式原理 + React Fiber 对比。',
    status: TASK_STATUS.DONE,
    priority: TASK_PRIORITY.MEDIUM,
    startDate: daysFromNow(-6),
    dueDate: daysFromNow(-6)
  },

  // ─── 低优先级 / 进行中 ───
  {
    title: '重构 axios 重试逻辑',
    content: '硬编码 3 次 → 指数退避，最多 5 次。',
    status: TASK_STATUS.IN_PROGRESS,
    priority: TASK_PRIORITY.LOW,
    startDate: daysFromNow(-2),
    dueDate: daysFromNow(10)
  },
  {
    title: '升级前端依赖至 Naive UI 最新版',
    status: TASK_STATUS.IN_PROGRESS,
    priority: TASK_PRIORITY.LOW,
    startDate: daysFromNow(-1),
    dueDate: daysFromNow(8)
  },
  {
    title: '与设计师对齐图标库切换',
    content: 'ionicons5 → tabler，评估视觉差异与替换工作量。',
    status: TASK_STATUS.IN_PROGRESS,
    priority: TASK_PRIORITY.LOW,
    startDate: daysFromNow(-3),
    dueDate: daysFromNow(14)
  },

  // ─── 低优先级 / 待办 ───
  {
    title: '调研 Bun 替换 Node 的可行性',
    content: '主要看 NestJS / mongoose 生态兼容性。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.LOW,
    startDate: daysFromNow(15),
    dueDate: daysFromNow(28)
  },
  {
    title: '周会技术分享：Pinia vs createInjectionState',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.LOW,
    startDate: daysFromNow(4),
    dueDate: daysFromNow(5)
  },
  {
    title: '调研 tRPC 替代 RESTful 的可行性',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.LOW,
    startDate: daysFromNow(20),
    dueDate: daysFromNow(32)
  },
  {
    title: '写技术博客《从甘特图看任务建模》',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.LOW
    // 故意两个时间都不给
  },

  // ─── 低优先级 / 完成 ───
  {
    title: '引入 lint-staged + husky',
    status: TASK_STATUS.DONE,
    priority: TASK_PRIORITY.LOW,
    startDate: daysFromNow(-28),
    dueDate: daysFromNow(-27)
  },
  {
    title: '调整 axios 拦截器错误码映射',
    content: '后端 401 时统一跳登录页。',
    status: TASK_STATUS.DONE,
    priority: TASK_PRIORITY.LOW,
    startDate: daysFromNow(-12),
    dueDate: daysFromNow(-10)
  },
  {
    title: '整理本周代码评审意见',
    status: TASK_STATUS.DONE,
    priority: TASK_PRIORITY.LOW,
    startDate: daysFromNow(-3),
    dueDate: daysFromNow(-3)
  },
  {
    title: '整理团队 OnCall 值班排期',
    content: '6 月轮值表，已发周知。',
    status: TASK_STATUS.DONE,
    priority: TASK_PRIORITY.LOW,
    startDate: daysFromNow(-16),
    dueDate: daysFromNow(-14)
  }
]

async function main() {
  console.log(`[seed] 连接 MongoDB: ${MONGODB_URI}`)
  await mongoose.connect(MONGODB_URI)

  const userColl = mongoose.connection.collection('users')
  const taskColl = mongoose.connection.collection('tasks')

  let user
  if (targetUsername) {
    user = await userColl.findOne({ username: targetUsername })
    if (!user) {
      throw new Error(`未找到用户 username="${targetUsername}"，请先在前端注册`)
    }
  } else {
    user = await userColl.findOne({}, { sort: { createdAt: 1 } })
    if (!user) {
      throw new Error('数据库里还没有任何用户，请先在前端注册一个账号再跑此脚本')
    }
  }
  console.log(`[seed] 目标用户：${user.username} (_id=${user._id})`)

  if (reset) {
    const { deletedCount } = await taskColl.deleteMany({ userId: user._id })
    console.log(`[seed] --reset：已清空 ${deletedCount} 条旧任务`)
  }

  const now = new Date()
  const docs = TASKS.map(t => ({
    userId: user._id,
    title: t.title,
    ...(t.content !== undefined && { content: t.content }),
    status: t.status,
    priority: t.priority,
    ...(t.startDate !== undefined && { startDate: t.startDate }),
    ...(t.dueDate !== undefined && { dueDate: t.dueDate }),
    createdAt: now,
    updatedAt: now
  }))

  const result = await taskColl.insertMany(docs)
  console.log(`[seed] 成功插入 ${result.insertedCount} 条任务`)
}

main()
  .catch(err => {
    console.error('[seed] 失败：', err.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
