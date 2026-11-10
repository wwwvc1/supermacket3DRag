<script setup lang="ts">
/**
 * 商家快捷管理抽屉 (MerchantQuickDrawer)
 * 允许用户无需离开 3D 街区直接查看店内商品、快捷修改库存并测试货架售罄红光联动
 * 同时提供跳转到独立商户中后台 (Port 5174) 的入口
 */
import { ref, onMounted } from 'vue'
import { X, Store, ExternalLink, RefreshCw, Check } from 'lucide-vue-next'
import { request } from '../api/http'
import { useToastStore } from '../stores/toast'
import type { Product } from '../types/api'

defineProps<{
  visible: boolean
}>()

defineEmits<{
  (e: 'close'): void
}>()

const toast = useToastStore()
const loading = ref(false)
const products = ref<Product[]>([])
const editingStock = ref<Record<number, number>>({})
const savingId = ref<number | null>(null)

async function loadProducts() {
  loading.value = true
  try {
    const res = await request<{ records: Product[] }>({
      url: '/api/merchant/products',
      params: { page: 1, size: 20 },
    })
    products.value = res.records || []
    products.value.forEach((p) => {
      editingStock.value[p.id] = p.stock
    })
  } catch (e) {
    toast.push('拉取商户商品列表失败: ' + (e as Error).message, 'error')
  } finally {
    loading.value = false
  }
}

async function saveStock(p: Product) {
  const newStock = editingStock.value[p.id]
  if (newStock == null || newStock < 0) {
    toast.push('库存数量必须大于等于 0', 'error')
    return
  }

  savingId.value = p.id
  try {
    await request({
      url: `/api/merchant/products/${p.id}/stock`,
      method: 'PUT',
      params: { stock: newStock },
    })
    p.stock = newStock
    toast.push(`商品 [${p.name}] 库存已调整为 ${newStock}，已全场广播 3D 变动！`, 'success')
  } catch (e) {
    toast.push('修改库存失败: ' + (e as Error).message, 'error')
  } finally {
    savingId.value = null
  }
}

async function toggleStatus(p: Product) {
  const nextStatus = p.status === 'ON_SHELF' ? 'OFF_SHELF' : 'ON_SHELF'
  try {
    await request({
      url: `/api/merchant/products/${p.id}/status`,
      method: 'PUT',
      params: { status: nextStatus },
    })
    p.status = nextStatus
    toast.push(`商品 [${p.name}] 状态已变更为 ${nextStatus}`, 'success')
  } catch (e) {
    toast.push('切换上下架失败: ' + (e as Error).message, 'error')
  }
}

function openMerchantSite() {
  window.open('http://localhost:5174', '_blank')
}

onMounted(() => {
  loadProducts()
})
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-y-0 right-0 z-40 w-full sm:w-[540px] bg-slate-900/95 backdrop-blur-2xl border-l border-slate-700/80 shadow-2xl flex flex-col text-white transition-all duration-300 animate-in slide-in-from-right"
  >
    <!-- 抽屉头部 -->
    <div class="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <Store class="w-4 h-4" />
        </div>
        <div>
          <div class="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>商业街 · 商家中后台管理</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              单商户端
            </span>
          </div>
          <div class="text-[10px] text-slate-400">实时调控全街区商铺库存与 3D 售罄标红联动</div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="刷新列表"
          @click="loadProducts"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
        <button
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          @click="$emit('close')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 顶部独立后台跳转横幅 -->
    <div class="p-3 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border-b border-emerald-900/40 flex items-center justify-between">
      <div class="text-xs text-emerald-300 flex items-center gap-1.5">
        <Store class="w-3.5 h-3.5 text-emerald-400" />
        <span>独立完整商户后台运行于 <b>Port 5174</b></span>
      </div>
      <button
        class="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold flex items-center gap-1 text-white shadow-sm transition"
        @click="openMerchantSite"
      >
        <span>新窗口打开后台</span>
        <ExternalLink class="w-3 h-3" />
      </button>
    </div>

    <!-- 商品列表内容区域 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <div v-if="loading && products.length === 0" class="text-center py-12 text-slate-400 text-xs">
        加载商品列表中...
      </div>

      <div
        v-for="p in products"
        :key="p.id"
        class="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition flex flex-col gap-2.5"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="text-xs font-bold text-slate-100 truncate">{{ p.name }}</div>
            <div class="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span class="text-cyan-400 font-mono">{{ p.category }}</span>
              <span>•</span>
              <span class="text-amber-300 font-bold">¥{{ Number(p.price).toFixed(2) }}</span>
            </div>
          </div>

          <button
            class="px-2 py-0.5 rounded text-[10px] font-semibold border transition"
            :class="p.status === 'ON_SHELF' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'"
            @click="toggleStatus(p)"
          >
            {{ p.status === 'ON_SHELF' ? '在售中' : '已下架' }}
          </button>
        </div>

        <!-- 快捷调整库存 -->
        <div class="flex items-center justify-between pt-2 border-t border-slate-700/40">
          <div class="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>实时库存：</span>
            <input
              v-model.number="editingStock[p.id]"
              type="number"
              min="0"
              class="w-20 h-7 px-2 rounded bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
            <button
              class="px-2 h-7 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition"
              title="一键清空测试售罄标红"
              @click="editingStock[p.id] = 0"
            >
              设为0
            </button>
          </div>

          <button
            class="px-3 h-7 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold flex items-center gap-1 text-white transition active:scale-95 disabled:opacity-50"
            :disabled="savingId === p.id"
            @click="saveStock(p)"
          >
            <Check class="w-3.5 h-3.5" />
            <span>{{ savingId === p.id ? '保存中' : '保存库存' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
