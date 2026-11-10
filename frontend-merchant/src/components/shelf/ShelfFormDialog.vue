<script setup lang="ts">
/**
 * 货架新增 / 编辑对话框
 * - 坐标与相机注视点数值输入（步长 0.1 米）
 * - 右侧俯视小地图实时预览正在编辑的货架
 */
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { Shelf } from '@/types/api'
import { saveShelf } from '@/api/merchant'
import { radToDeg } from '@/utils/format'
import ShelfMiniMap from './ShelfMiniMap.vue'

const props = defineProps<{ modelValue: boolean; shelf: Shelf | null; shelves: Shelf[] }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'saved', s: Shelf): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})
const isEdit = computed(() => !!props.shelf?.id)
const formRef = ref<FormInstance>()
const saving = ref(false)

/** 生成空白货架（默认相机注视点位于货架前方 2 米、1.5 米高） */
function emptyShelf(): Shelf {
  return {
    shelfCode: '',
    name: '',
    zone: '',
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    rotationY: 0,
    cameraTargetX: 0,
    cameraTargetY: 1.5,
    cameraTargetZ: 2,
    status: 'NORMAL'
  }
}
const form = reactive<Shelf>(emptyShelf())

const rules: FormRules<Shelf> = {
  shelfCode: [{ required: true, message: '请输入货架编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入货架名称', trigger: 'blur' }],
  zone: [{ required: true, message: '请输入所属区域', trigger: 'blur' }]
}

/** 数值字段定义：用于循环渲染输入框 */
const posFields: { key: keyof Shelf; label: string }[] = [
  { key: 'positionX', label: '位置 X' },
  { key: 'positionY', label: '位置 Y' },
  { key: 'positionZ', label: '位置 Z' }
]
const camFields: { key: keyof Shelf; label: string }[] = [
  { key: 'cameraTargetX', label: '注视 X' },
  { key: 'cameraTargetY', label: '注视 Y' },
  { key: 'cameraTargetZ', label: '注视 Z' }
]

// 打开时回填或重置
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    Object.assign(form, emptyShelf(), { id: undefined }, props.shelf ? { ...props.shelf } : {})
    formRef.value?.clearValidate()
  }
)

/** 相机注视点一键对齐：放在货架朝向前方 2 米、高 1.5 米处 */
function autoCameraTarget() {
  const rot = Number(form.rotationY) || 0
  const round = (n: number) => Math.round(n * 100) / 100
  form.cameraTargetX = round(Number(form.positionX) + 2 * Math.sin(rot))
  form.cameraTargetY = 1.5
  form.cameraTargetZ = round(Number(form.positionZ) + 2 * Math.cos(rot))
}

/** 提交保存（携带 id 即为更新） */
async function submit() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return
  saving.value = true
  try {
    const { createdAt: _c, updatedAt: _u, ...payload } = form
    const saved = await saveShelf(payload as Shelf)
    ElMessage.success(isEdit.value ? '货架已更新' : '货架已创建')
    emit('saved', saved)
    visible.value = false
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <el-dialog v-model="visible" :title="isEdit ? '编辑货架' : '新增货架'" width="900px" destroy-on-close>
    <div class="flex gap-6">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" class="flex-1">
        <el-form-item label="货架编码" prop="shelfCode">
          <el-input v-model="form.shelfCode" placeholder="如：A01" />
        </el-form-item>
        <el-form-item label="货架名称" prop="name">
          <el-input v-model="form.name" placeholder="如：生鲜果蔬货架" />
        </el-form-item>
        <el-form-item label="所属区域" prop="zone">
          <el-input v-model="form.zone" placeholder="如：生鲜区" />
        </el-form-item>
        <el-form-item v-for="f in posFields" :key="f.key" :label="f.label">
          <el-input-number v-model="(form[f.key] as number)" :step="0.1" :precision="2" class="!w-40" />
          <span class="ml-2 text-xs text-gray-400">米</span>
        </el-form-item>
        <el-form-item label="朝向 Y">
          <el-input-number v-model="form.rotationY" :step="0.1" :precision="3" class="!w-40" />
          <span class="ml-2 text-xs text-gray-400">弧度 ≈ {{ radToDeg(form.rotationY) }}°</span>
        </el-form-item>
        <el-form-item v-for="f in camFields" :key="f.key" :label="f.label">
          <el-input-number v-model="(form[f.key] as number)" :step="0.1" :precision="2" class="!w-40" />
        </el-form-item>
        <el-form-item>
          <el-button size="small" @click="autoCameraTarget">按朝向自动计算注视点</el-button>
        </el-form-item>
      </el-form>
      <div>
        <div class="text-sm text-gray-500 mb-2">俯视预览（实时）</div>
        <ShelfMiniMap :shelves="shelves" :highlight="form" :size="380" />
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>
