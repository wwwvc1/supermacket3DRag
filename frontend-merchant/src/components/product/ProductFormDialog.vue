<script setup lang="ts">
/**
 * 商品新增 / 编辑对话框（含表单校验）
 */
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { MerchantProductSave, Product, Shelf } from '@/types/api'
import { createProduct, updateProduct } from '@/api/merchant'

const props = defineProps<{ modelValue: boolean; product: Product | null; shelves: Shelf[] }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'saved', p: Product): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})
const isEdit = computed(() => !!props.product)
const formRef = ref<FormInstance>()
const saving = ref(false)

/** 生成空表单 */
function emptyForm(): MerchantProductSave {
  return { name: '', category: '', price: 0, stock: 0, status: 'ON_SHELF', shelfId: null, description: '' }
}
const form = reactive<MerchantProductSave>(emptyForm())

/** 表单校验规则 */
const rules: FormRules<MerchantProductSave> = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { max: 64, message: '名称不超过 64 个字符', trigger: 'blur' }
  ],
  category: [{ required: true, message: '请输入品类', trigger: 'blur' }],
  price: [
    { required: true, message: '请输入售价', trigger: 'change' },
    { type: 'number', min: 0.01, message: '售价必须大于 0', trigger: 'change' }
  ],
  stock: [
    { required: true, message: '请输入库存', trigger: 'change' },
    { type: 'number', min: 0, message: '库存不能为负数', trigger: 'change' }
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  shelfId: [{ required: true, message: '请选择陈列货架', trigger: 'change' }]
}

// 打开对话框时回填 / 重置表单
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    const p = props.product
    Object.assign(
      form,
      p
        ? {
            name: p.name,
            category: p.category,
            price: Number(p.price),
            stock: p.stock,
            status: p.status,
            shelfId: p.shelfId,
            description: p.description ?? ''
          }
        : emptyForm()
    )
    formRef.value?.clearValidate()
  }
)

/** 校验通过后提交 */
async function submit() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return
  saving.value = true
  try {
    const payload: MerchantProductSave = { ...form }
    const saved = props.product ? await updateProduct(props.product.id, payload) : await createProduct(payload)
    ElMessage.success(isEdit.value ? '商品已更新' : '商品已创建')
    emit('saved', saved)
    visible.value = false
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <el-dialog v-model="visible" :title="isEdit ? '编辑商品' : '新增商品'" width="560px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
      <el-form-item label="商品名称" prop="name">
        <el-input v-model="form.name" placeholder="如：纯牛奶 250ml" />
      </el-form-item>
      <el-form-item label="品类" prop="category">
        <el-input v-model="form.category" placeholder="如：乳制品" />
      </el-form-item>
      <el-form-item label="售价(元)" prop="price">
        <el-input-number v-model="form.price" :min="0" :step="0.5" :precision="2" class="!w-48" />
      </el-form-item>
      <el-form-item label="库存" prop="stock">
        <el-input-number v-model="form.stock" :min="0" :step="1" :precision="0" class="!w-48" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio value="ON_SHELF">上架</el-radio>
          <el-radio value="OFF_SHELF">下架</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="陈列货架" prop="shelfId">
        <el-select v-model="form.shelfId" placeholder="选择货架" filterable class="!w-full">
          <el-option
            v-for="s in shelves"
            :key="s.id"
            :value="s.id!"
            :label="`${s.shelfCode} · ${s.name}（${s.zone}）`"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="form.description" type="textarea" :rows="3" maxlength="500" show-word-limit />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>
