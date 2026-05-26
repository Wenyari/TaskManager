<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { NModal, NForm, NFormItem, NInput, NSelect, NDatePicker, NButton, NSpace } from 'naive-ui'
import { TASK_STATUS, TASK_PRIORITY } from '@taskmanager/shared'
import type { TaskItem, CreateTaskPayload } from '@/api/task'

const props = defineProps<{
  show: boolean
  editingTask?: TaskItem | null
}>()

const emit = defineEmits<{
  'update:show': [val: boolean]
  submit: [payload: CreateTaskPayload & { taskId?: string }]
}>()

const title = ref('')
const content = ref('')
const status = ref<TASK_STATUS>(TASK_STATUS.TODO)
const priority = ref<TASK_PRIORITY>(TASK_PRIORITY.MEDIUM)
const startDate = ref<number | null>(null)
const dueDate = ref<number | null>(null)

const isEdit = computed(() => !!props.editingTask)
const modalTitle = computed(() => (isEdit.value ? '编辑任务' : '新建任务'))

const dateRangeWarning = computed(() => {
  if (startDate.value && dueDate.value && startDate.value > dueDate.value) {
    return '开始日期晚于截止日期'
  }
  return ''
})

watch(
  () => props.show,
  val => {
    if (val && props.editingTask) {
      title.value = props.editingTask.title
      content.value = props.editingTask.content || ''
      status.value = props.editingTask.status
      priority.value = props.editingTask.priority
      startDate.value = props.editingTask.startDate ? new Date(props.editingTask.startDate).getTime() : null
      dueDate.value = props.editingTask.dueDate ? new Date(props.editingTask.dueDate).getTime() : null
    } else if (val) {
      title.value = ''
      content.value = ''
      status.value = TASK_STATUS.TODO
      priority.value = TASK_PRIORITY.MEDIUM
      startDate.value = null
      dueDate.value = null
    }
  }
)

const statusOptions = [
  { label: '待办', value: TASK_STATUS.TODO },
  { label: '进行中', value: TASK_STATUS.IN_PROGRESS },
  { label: '已完成', value: TASK_STATUS.DONE }
]

const priorityOptions = [
  { label: '低', value: TASK_PRIORITY.LOW },
  { label: '中', value: TASK_PRIORITY.MEDIUM },
  { label: '高', value: TASK_PRIORITY.HIGH }
]

function handleSubmit() {
  if (!title.value.trim()) {
    window.$message?.warning('请输入任务标题')
    return
  }
  if (dateRangeWarning.value) {
    window.$message?.warning(dateRangeWarning.value)
    return
  }
  const payload: CreateTaskPayload & { taskId?: string } = {
    title: title.value.trim(),
    content: content.value.trim() || undefined,
    status: status.value,
    priority: priority.value,
    startDate: startDate.value ? new Date(startDate.value).toISOString() : undefined,
    dueDate: dueDate.value ? new Date(dueDate.value).toISOString() : undefined
  }
  if (props.editingTask) {
    payload.taskId = props.editingTask._id
  }
  emit('submit', payload)
  emit('update:show', false)
}
</script>

<template>
  <NModal :show="show" preset="card" :title="modalTitle" style="width: 480px" @update:show="emit('update:show', $event)">
    <NForm label-placement="left" label-width="70">
      <NFormItem label="标题" required>
        <NInput v-model:value="title" placeholder="输入任务标题" maxlength="120" />
      </NFormItem>
      <NFormItem label="描述">
        <NInput v-model:value="content" type="textarea" placeholder="任务详细描述（可选）" :rows="3" />
      </NFormItem>
      <NFormItem label="状态">
        <NSelect v-model:value="status" :options="statusOptions" />
      </NFormItem>
      <NFormItem label="优先级">
        <NSelect v-model:value="priority" :options="priorityOptions" />
      </NFormItem>
      <NFormItem label="开始日期">
        <NDatePicker v-model:value="startDate" type="date" clearable style="width: 100%" />
      </NFormItem>
      <NFormItem label="截止日期" :feedback="dateRangeWarning" :validation-status="dateRangeWarning ? 'warning' : undefined">
        <NDatePicker v-model:value="dueDate" type="date" clearable style="width: 100%" />
      </NFormItem>
    </NForm>
    <template #action>
      <NSpace justify="end">
        <NButton @click="emit('update:show', false)">取消</NButton>
        <NButton type="primary" @click="handleSubmit">{{ isEdit ? '保存' : '创建' }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
