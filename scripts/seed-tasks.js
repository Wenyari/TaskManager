#!/usr/bin/env node
/**
 * 数据库 mock 数据脚本
 *
 * 往 MongoDB 的 tasks 集合插入约 20 条任务（图书馆主题，贴合前端书架风格）。
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

const TASKS = [
  {
    title: '校对《百年孤独》新版翻译稿',
    content: '重点比对第三章马孔多家族谱系的术语统一性，标注与旧版差异。',
    status: TASK_STATUS.IN_PROGRESS,
    priority: TASK_PRIORITY.HIGH,
    dueDate: daysFromNow(2)
  },
  {
    title: '整理本月新到馆书目',
    content: '约 240 册，按文学/历史/科学三档分上架。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM,
    dueDate: daysFromNow(5)
  },
  {
    title: '修补古籍《永乐大典》残页',
    content: '与修复师约下周二上午开始，需提前准备宣纸与浆糊。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.HIGH,
    dueDate: daysFromNow(7)
  },
  {
    title: '撰写读者推荐书单——夏季篇',
    content: '主题：消暑随笔、山林游记。约 15 本，含简介。',
    status: TASK_STATUS.IN_PROGRESS,
    priority: TASK_PRIORITY.MEDIUM,
    dueDate: daysFromNow(10)
  },
  {
    title: '更新借阅卡过期名单',
    status: TASK_STATUS.DONE,
    priority: TASK_PRIORITY.LOW
  },
  {
    title: '与王教授确认讲座流程',
    content: '主题《<诗经>中的植物意象》，定于本月 28 日下午。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.HIGH,
    dueDate: daysFromNow(14)
  },
  {
    title: '盘点善本室温湿度记录',
    content: '近 30 天日志导出，确认温湿度未越界。',
    status: TASK_STATUS.DONE,
    priority: TASK_PRIORITY.MEDIUM
  },
  {
    title: '回函澳大利亚国家图书馆交换协议',
    content: '答复对方关于明清地方志副本交换的提案。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM,
    dueDate: daysFromNow(4)
  },
  {
    title: '采购第二批镇纸与书签',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.LOW,
    dueDate: daysFromNow(12)
  },
  {
    title: '编订儿童阅读区主题日海报',
    content: '本月主题"会说话的动物"，需绘制 3 张 A2 海报。',
    status: TASK_STATUS.IN_PROGRESS,
    priority: TASK_PRIORITY.LOW,
    dueDate: daysFromNow(6)
  },
  {
    title: '复核年度采购预算表',
    content: '与财务对账，确认外文书与古籍专项额度。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.HIGH,
    dueDate: daysFromNow(3)
  },
  {
    title: '为小学三年级团体导览备讲稿',
    content: '40 分钟，重点放在装帧演变与活字印刷。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM,
    dueDate: daysFromNow(8)
  },
  {
    title: '整理读者反馈意见汇总',
    status: TASK_STATUS.DONE,
    priority: TASK_PRIORITY.LOW
  },
  {
    title: '调试期刊检索系统的搜索权重',
    content: '近期反馈搜索"民国"召回率偏低，需调整 BM25 字段权重。',
    status: TASK_STATUS.IN_PROGRESS,
    priority: TASK_PRIORITY.HIGH,
    dueDate: daysFromNow(1)
  },
  {
    title: '撰写《数字人文季报》卷首语',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM,
    dueDate: daysFromNow(20)
  },
  {
    title: '与志愿者团队复盘上月活动',
    content: '"夜读马孔多"读书会，约 35 人参加。',
    status: TASK_STATUS.DONE,
    priority: TASK_PRIORITY.MEDIUM
  },
  {
    title: '清查地下书库防潮设备',
    content: '六台除湿机轮检，记录运行小时数。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.HIGH,
    dueDate: daysFromNow(9)
  },
  {
    title: '为《唐诗三百首》新译版撰写推介词',
    status: TASK_STATUS.IN_PROGRESS,
    priority: TASK_PRIORITY.LOW,
    dueDate: daysFromNow(15)
  },
  {
    title: '替换二楼阅览室破损书架',
    content: '老榆木的两组，与木工师傅约下周三上门。',
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.MEDIUM,
    dueDate: daysFromNow(11)
  },
  {
    title: '归档闭馆日清洁记录',
    status: TASK_STATUS.DONE,
    priority: TASK_PRIORITY.LOW
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
