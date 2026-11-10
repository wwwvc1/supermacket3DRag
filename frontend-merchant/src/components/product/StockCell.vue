<script setup lang="ts">
/**
 * 库存行内编辑单元格
 * - 点击进入编辑态（el-input-number）
 * - 回车或失焦提交，Esc 取消
 * - 库存为 0 时红色显示并带“售罄”标签
 */
import { nextTick, ref } from 'vue'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps<{ stock: number; saving?: boolean }>()
const emit = defineEmits<{ (e: 'submit', value: number): void }>()

const editing = ref(false)
const draft = ref<number>(0)
const inputRef = ref<{ focus: () => void } | null>(null)
/** 防止 Enter 提交后 blur 再次触发提交 / Esc 取消后 blur 误提交 */
let settled = false

/** 进入编辑态并自动聚焦 */
async function startEdit() {
  if (props.saving) return
  draft.value = props.stock
  settled = false
  editing.value = true
  await nextTick()
  inputRef.value?.focus()
}

/** 提交修改（值未变化时直接退出） */
function commit() {
  if (settled) return
  settled = true
  editing.value = false
  const v = Math.max(0, Math.floor(Number(draft.value ?? 0)))
  if (v !== props.stock) emit('submit', v)
}

/** 取消编辑 */
function cancel() {
  settled = true
  editing.value = false
}
</script>

<template>
  <div v-if="editing" @keydown.enter.prevent="commit" @keydown.esc.prevent="cancel">
    <el-input-number
      ref="inputRef"
      v-model="draft"
      :min="0"
      :step="1"
      :precision="0"
      size="small"
      controls-position="right"
      class="!w-28"
      @blur="commit"
    />
  </div>
  <div v-else class="cursor-pointer inline-flex items-center gap-1.5" title="点击修改库存" @click="startEdit">
    <span :class="stock <= 0 ? 'text-red-500 font-semibold' : 'text-gray-700'">{{ stock }}</span>
    <el-tag v-if="stock <= 0" type="danger" size="small" effect="dark">售罄</el-tag>
    <el-icon v-if="saving" class="is-loading text-gray-400"><Loading /></el-icon>
  </div>
</template>
