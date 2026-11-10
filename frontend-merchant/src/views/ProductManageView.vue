<script setup lang="ts">
/**
 * 商品管理页
 * - 关键字 + 上下架状态筛选、分页表格
 * - 上下架开关、库存行内编辑、新增 / 编辑对话框
 * - 订阅 WS 库存事件：原地刷新对应行库存并闪烁高亮
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import type { Product, ProductStatus, Shelf } from '@/types/api'
import { listProducts, listShelves, updateStatus, updateStock } from '@/api/merchant'
import { useWebSocketStore } from '@/stores/websocket'
import StockCell from '@/components/product/StockCell.vue'
import ProductFormDialog from '@/components/product/ProductFormDialog.vue'

const query = reactive<{ keyword: string; status: ProductStatus | '' }>({ keyword: '', status: '' })
const pager = reactive({ page: 1, size: 10, total: 0 })
const rows = ref<Product[]>([])
const shelves = ref<Shelf[]>([])
const loading = ref(false)
/** 正在提交状态 / 库存的商品 ID 集合 */
const statusSaving = ref(new Set<number>())
const stockSaving = ref(new Set<number>())
/** 正在闪烁高亮的行 ID */
const flashing = ref(new Set<number>())

const dialogVisible = ref(false)
const editing = ref<Product | null>(null)

/** 货架 ID → 货架编码 映射 */
const shelfCodeMap = computed(() => {
  const m = new Map<number, string>()
  shelves.value.forEach((s) => s.id != null && m.set(s.id, s.shelfCode))
  return m
})

/** 加载商品分页 */
async function loadProducts() {
  loading.value = true
  try {
    const page = await listProducts(pager.page, pager.size, query.keyword.trim(), query.status)
    rows.value = page.records
    pager.total = page.total
  } finally {
    loading.value = false
  }
}

/** 加载货架列表（用于编码解析与下拉选择） */
async function loadShelves() {
  shelves.value = await listShelves()
}

/** 搜索：回到第一页 */
function onSearch() {
  pager.page = 1
  loadProducts()
}

/** 重置筛选条件 */
function onReset() {
  query.keyword = ''
  query.status = ''
  onSearch()
}

/** 上下架切换，失败时回滚 */
async function onToggleStatus(row: Product, val: string | number | boolean) {
  const next: ProductStatus = val ? 'ON_SHELF' : 'OFF_SHELF'
  const prev = row.status
  row.status = next
  statusSaving.value.add(row.id)
  try {
    await updateStatus(row.id, next)
    ElMessage.success(next === 'ON_SHELF' ? `「${row.name}」已上架` : `「${row.name}」已下架`)
  } catch {
    row.status = prev
  } finally {
    statusSaving.value.delete(row.id)
  }
}

/** 行内库存提交 */
async function onStockSubmit(row: Product, stock: number) {
  stockSaving.value.add(row.id)
  try {
    await updateStock(row.id, stock)
    row.stock = stock
    ElMessage.success(`「${row.name}」库存已更新为 ${stock}`)
  } finally {
    stockSaving.value.delete(row.id)
  }
}

/** 打开新增 / 编辑对话框 */
function openDialog(row: Product | null) {
  editing.value = row
  dialogVisible.value = true
}

/** 行闪烁高亮（1.6s 后移除） */
function flashRow(id: number) {
  flashing.value.delete(id)
  // 下一帧再加回，确保动画可重复触发
  requestAnimationFrame(() => {
    flashing.value.add(id)
    setTimeout(() => flashing.value.delete(id), 1600)
  })
}

/** 表格行 class：用于闪烁动画 */
function rowClassName({ row }: { row: Product }) {
  return flashing.value.has(row.id) ? 'row-flash' : ''
}

// 订阅 WS 库存变动事件
const wsStore = useWebSocketStore()
let unsubscribe: (() => void) | null = null

onMounted(() => {
  loadShelves()
  loadProducts()
  unsubscribe = wsStore.onInventory((e) => {
    const row = rows.value.find((r) => r.id === e.productId)
    if (!row) return
    row.stock = e.stock
    flashRow(row.id)
    // 同步货架状态，保持本地缓存一致
    const shelf = shelves.value.find((s) => s.id === e.shelfId)
    if (shelf && e.shelfStatus) shelf.status = e.shelfStatus
  })
})
onBeforeUnmount(() => unsubscribe?.())
</script>

<template>
  <el-card shadow="never">
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <el-input
        v-model="query.keyword"
        placeholder="搜索商品名称 / 品类"
        clearable
        class="!w-64"
        :prefix-icon="Search"
        @keyup.enter="onSearch"
        @clear="onSearch"
      />
      <el-select v-model="query.status" placeholder="全部状态" clearable class="!w-36" @change="onSearch">
        <el-option label="上架中" value="ON_SHELF" />
        <el-option label="已下架" value="OFF_SHELF" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="onSearch">查询</el-button>
      <el-button :icon="Refresh" @click="onReset">重置</el-button>
      <div class="flex-1" />
      <el-button type="primary" :icon="Plus" @click="openDialog(null)">新增商品</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" row-key="id" border stripe :row-class-name="rowClassName">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
      <el-table-column prop="category" label="品类" width="110" />
      <el-table-column label="售价" width="100" align="right">
        <template #default="{ row }">¥{{ Number(row.price).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="库存" width="160">
        <template #default="{ row }">
          <StockCell :stock="row.stock" :saving="stockSaving.has(row.id)" @submit="(v) => onStockSubmit(row, v)" />
        </template>
      </el-table-column>
      <el-table-column label="状态" width="130">
        <template #default="{ row }">
          <el-switch
            :model-value="row.status === 'ON_SHELF'"
            :loading="statusSaving.has(row.id)"
            inline-prompt
            active-text="上架"
            inactive-text="下架"
            @change="(v: string | number | boolean) => onToggleStatus(row, v)"
          />
        </template>
      </el-table-column>
      <el-table-column label="货架编码" width="110">
        <template #default="{ row }">
          <el-tag v-if="row.shelfId != null" type="info" size="small">
            {{ shelfCodeMap.get(row.shelfId) ?? `#${row.shelfId}` }}
          </el-tag>
          <span v-else class="text-gray-400">未陈列</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="flex justify-end mt-4">
      <el-pagination
        v-model:current-page="pager.page"
        v-model:page-size="pager.size"
        :total="pager.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @current-change="loadProducts"
        @size-change="onSearch"
      />
    </div>

    <ProductFormDialog v-model="dialogVisible" :product="editing" :shelves="shelves" @saved="loadProducts" />
  </el-card>
</template>
