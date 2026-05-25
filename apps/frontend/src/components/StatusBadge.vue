<script setup lang="ts">
import { NTag } from 'naive-ui'
import { TASK_STATUS, TASK_PRIORITY } from '@taskmanager/shared'
import { computed } from 'vue'

const props = defineProps<{
  value: string
  type: 'status' | 'priority'
}>()

const tagType = computed(() => {
  if (props.type === 'status') {
    switch (props.value) {
      case TASK_STATUS.TODO:
        return 'default'
      case TASK_STATUS.IN_PROGRESS:
        return 'warning'
      case TASK_STATUS.DONE:
        return 'success'
      default:
        return 'default'
    }
  }
  switch (props.value) {
    case TASK_PRIORITY.HIGH:
      return 'error'
    case TASK_PRIORITY.MEDIUM:
      return 'warning'
    case TASK_PRIORITY.LOW:
      return 'info'
    default:
      return 'default'
  }
})

const label = computed(() => {
  if (props.type === 'status') {
    switch (props.value) {
      case TASK_STATUS.TODO:
        return '待办'
      case TASK_STATUS.IN_PROGRESS:
        return '进行中'
      case TASK_STATUS.DONE:
        return '已完成'
      default:
        return props.value
    }
  }
  switch (props.value) {
    case TASK_PRIORITY.HIGH:
      return '高'
    case TASK_PRIORITY.MEDIUM:
      return '中'
    case TASK_PRIORITY.LOW:
      return '低'
    default:
      return props.value
  }
})
</script>

<template>
  <NTag :type="tagType" size="small" round>{{ label }}</NTag>
</template>
