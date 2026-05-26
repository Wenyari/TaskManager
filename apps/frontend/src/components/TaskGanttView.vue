<script setup lang="ts">
import { computed } from 'vue'
import { NEmpty, NTooltip } from 'naive-ui'
import { TASK_PRIORITY } from '@taskmanager/shared'
import type { TaskItem } from '@/api/task'

const props = defineProps<{ tasks: TaskItem[] }>()
const emit = defineEmits<{ edit: [task: TaskItem] }>()

const DAY_WIDTH = 32 // 每天对应的横向像素
const ROW_HEIGHT = 36
const LABEL_WIDTH = 200

const MS_PER_DAY = 24 * 60 * 60 * 1000

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / MS_PER_DAY)
}

function priorityColor(priority: string): string {
  switch (priority) {
    case TASK_PRIORITY.HIGH:
      return 'var(--app-priority-high)'
    case TASK_PRIORITY.MEDIUM:
      return 'var(--app-priority-medium)'
    case TASK_PRIORITY.LOW:
      return 'var(--app-priority-low)'
    default:
      return 'var(--app-border)'
  }
}

// 计算时间轴范围：取所有任务的 startDate/dueDate 极值，左右各 padding 3 天；最少展示 21 天
const timeRange = computed(() => {
  const today = startOfDay(new Date())
  const allDates: Date[] = []
  props.tasks.forEach(t => {
    if (t.startDate) allDates.push(startOfDay(new Date(t.startDate)))
    if (t.dueDate) allDates.push(startOfDay(new Date(t.dueDate)))
  })
  if (allDates.length === 0) {
    return {
      start: new Date(today.getTime() - 7 * MS_PER_DAY),
      end: new Date(today.getTime() + 14 * MS_PER_DAY)
    }
  }
  const min = new Date(Math.min(...allDates.map(d => d.getTime()), today.getTime() - 3 * MS_PER_DAY))
  const max = new Date(Math.max(...allDates.map(d => d.getTime()), today.getTime() + 3 * MS_PER_DAY))
  const start = new Date(min.getTime() - 3 * MS_PER_DAY)
  const end = new Date(max.getTime() + 3 * MS_PER_DAY)
  return { start, end }
})

const totalDays = computed(() => daysBetween(timeRange.value.start, timeRange.value.end) + 1)

const dateColumns = computed(() => {
  const cols: { date: Date; isWeekend: boolean; isToday: boolean; isMonthStart: boolean }[] = []
  const today = startOfDay(new Date()).getTime()
  for (let i = 0; i < totalDays.value; i++) {
    const d = new Date(timeRange.value.start.getTime() + i * MS_PER_DAY)
    const dow = d.getDay()
    cols.push({
      date: d,
      isWeekend: dow === 0 || dow === 6,
      isToday: d.getTime() === today,
      isMonthStart: d.getDate() === 1
    })
  }
  return cols
})

// 月份分组（用于顶部表头）
const monthGroups = computed(() => {
  const groups: { label: string; span: number }[] = []
  dateColumns.value.forEach(col => {
    const label = `${col.date.getFullYear()}.${String(col.date.getMonth() + 1).padStart(2, '0')}`
    const last = groups[groups.length - 1]
    if (last && last.label === label) {
      last.span += 1
    } else {
      groups.push({ label, span: 1 })
    }
  })
  return groups
})

interface GanttBar {
  task: TaskItem
  offsetDays: number
  spanDays: number
  isPoint: boolean
  unscheduled: boolean
}

const ganttBars = computed<GanttBar[]>(() => {
  return props.tasks.map(task => {
    const hasStart = !!task.startDate
    const hasDue = !!task.dueDate
    if (!hasStart && !hasDue) {
      return { task, offsetDays: 0, spanDays: 0, isPoint: false, unscheduled: true }
    }
    const start = hasStart ? startOfDay(new Date(task.startDate as string)) : startOfDay(new Date(task.dueDate as string))
    const end = hasDue ? startOfDay(new Date(task.dueDate as string)) : startOfDay(new Date(task.startDate as string))
    const safeStart = start.getTime() <= end.getTime() ? start : end
    const safeEnd = start.getTime() <= end.getTime() ? end : start
    const offsetDays = daysBetween(timeRange.value.start, safeStart)
    const spanDays = daysBetween(safeStart, safeEnd) + 1
    return {
      task,
      offsetDays,
      spanDays,
      isPoint: !hasStart || !hasDue || daysBetween(safeStart, safeEnd) === 0,
      unscheduled: false
    }
  })
})

const timelineWidth = computed(() => totalDays.value * DAY_WIDTH)

function formatDateRange(task: TaskItem): string {
  const fmt = (s?: string) =>
    s ? new Date(s).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '—'
  return `${fmt(task.startDate)} ~ ${fmt(task.dueDate)}`
}

const isEmpty = computed(() => props.tasks.length === 0)
</script>

<template>
  <NEmpty v-if="isEmpty" description="暂无任务" />
  <div v-else class="gantt-wrapper">
    <div class="gantt-scroll">
      <div class="gantt-grid" :style="{ '--label-width': `${LABEL_WIDTH}px`, '--timeline-width': `${timelineWidth}px` }">
        <!-- 表头：月份行 -->
        <div class="gantt-header-corner">任务</div>
        <div class="gantt-header-months">
          <div
            v-for="(group, idx) in monthGroups"
            :key="idx"
            class="month-cell"
            :style="{ width: `${group.span * DAY_WIDTH}px` }"
          >
            {{ group.label }}
          </div>
        </div>

        <!-- 表头：日期行 -->
        <div class="gantt-header-corner gantt-header-corner--days"></div>
        <div class="gantt-header-days">
          <div
            v-for="(col, idx) in dateColumns"
            :key="idx"
            class="day-cell"
            :class="{ 'day-cell--weekend': col.isWeekend, 'day-cell--today': col.isToday }"
            :style="{ width: `${DAY_WIDTH}px` }"
          >
            {{ col.date.getDate() }}
          </div>
        </div>

        <!-- 任务行 -->
        <template v-for="(bar, rowIdx) in ganttBars" :key="bar.task._id">
          <div class="gantt-label" @click="emit('edit', bar.task)">
            <span class="label-title">{{ bar.task.title }}</span>
            <span class="label-date">{{ formatDateRange(bar.task) }}</span>
          </div>
          <div class="gantt-row" :style="{ height: `${ROW_HEIGHT}px` }">
            <!-- 网格背景 -->
            <div
              v-for="(col, colIdx) in dateColumns"
              :key="colIdx"
              class="row-cell"
              :class="{
                'row-cell--weekend': col.isWeekend,
                'row-cell--today': col.isToday,
                'row-cell--alt': rowIdx % 2 === 1
              }"
              :style="{ width: `${DAY_WIDTH}px` }"
            ></div>
            <!-- 任务条 -->
            <NTooltip v-if="!bar.unscheduled" placement="top">
              <template #trigger>
                <div
                  class="gantt-bar"
                  :class="{ 'gantt-bar--point': bar.isPoint }"
                  :style="{
                    left: `${bar.offsetDays * DAY_WIDTH + 2}px`,
                    width: `${Math.max(bar.spanDays * DAY_WIDTH - 4, 18)}px`,
                    background: priorityColor(bar.task.priority)
                  }"
                  @click="emit('edit', bar.task)"
                >
                  <span class="bar-title">{{ bar.task.title }}</span>
                </div>
              </template>
              {{ bar.task.title }} · {{ formatDateRange(bar.task) }}
            </NTooltip>
            <div v-else class="gantt-unscheduled">未排期</div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gantt-wrapper {
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: var(--app-bg-elevated);
  overflow: hidden;
}

.gantt-scroll {
  overflow-x: auto;
  overflow-y: visible;
}

.gantt-grid {
  display: grid;
  grid-template-columns: var(--label-width) var(--timeline-width);
  position: relative;
}

.gantt-header-corner {
  position: sticky;
  left: 0;
  z-index: 3;
  background: var(--app-bg-elevated);
  border-right: 1px solid var(--app-border);
  border-bottom: 1px solid var(--app-divider);
  padding: 8px 12px;
  font-size: 12px;
  letter-spacing: 0.1em;
  color: var(--app-text-secondary);
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', Georgia, serif;
}

.gantt-header-corner--days {
  border-bottom: 1px solid var(--app-border);
}

.gantt-header-months,
.gantt-header-days {
  display: flex;
  border-bottom: 1px solid var(--app-divider);
  background: var(--app-bg-elevated);
}

.gantt-header-days {
  border-bottom: 1px solid var(--app-border);
}

.month-cell {
  flex-shrink: 0;
  text-align: center;
  font-size: 12px;
  padding: 6px 0;
  color: var(--app-text-secondary);
  border-right: 1px solid var(--app-divider);
  letter-spacing: 0.05em;
}

.day-cell {
  flex-shrink: 0;
  text-align: center;
  font-size: 11px;
  padding: 4px 0;
  color: var(--app-text-tertiary);
  border-right: 1px solid var(--app-divider);
}

.day-cell--weekend {
  color: var(--app-text-secondary);
  background: rgba(0, 0, 0, 0.04);
}

.day-cell--today {
  color: var(--app-priority-high);
  font-weight: 700;
  background: rgba(155, 106, 47, 0.12);
}

.gantt-label {
  position: sticky;
  left: 0;
  z-index: 2;
  background: var(--app-bg-elevated);
  border-right: 1px solid var(--app-border);
  border-bottom: 1px solid var(--app-divider);
  padding: 6px 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  transition: background 0.15s ease;
  height: 36px;
  box-sizing: border-box;
}

.gantt-label:hover {
  background: var(--app-bg);
}

.label-title {
  font-size: 13px;
  color: var(--app-text-base);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', Georgia, serif;
}

.label-date {
  font-size: 10px;
  color: var(--app-text-tertiary);
  letter-spacing: 0.05em;
}

.gantt-row {
  position: relative;
  display: flex;
  border-bottom: 1px solid var(--app-divider);
}

.row-cell {
  flex-shrink: 0;
  border-right: 1px solid var(--app-divider);
}

.row-cell--alt {
  background: rgba(0, 0, 0, 0.015);
}

.row-cell--weekend {
  background: rgba(0, 0, 0, 0.04);
}

.row-cell--today {
  background: rgba(155, 106, 47, 0.1);
}

.gantt-bar {
  position: absolute;
  top: 6px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  overflow: hidden;
  z-index: 1;
}

.gantt-bar:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.22);
}

.gantt-bar--point {
  border-radius: 50%;
  width: 24px !important;
  padding: 0;
  justify-content: center;
}

.gantt-bar--point .bar-title {
  display: none;
}

.bar-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gantt-unscheduled {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: var(--app-text-tertiary);
  letter-spacing: 0.1em;
  font-style: italic;
}
</style>
