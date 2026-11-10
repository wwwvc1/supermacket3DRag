<script setup lang="ts">
/**
 * 购物车侧边抽屉 (CartDrawer)
 * 查看购物车清单、逐项移除、总价汇总与一键下单结算
 */
import { onMounted } from 'vue'
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-vue-next'
import { useCartStore } from '../stores/cart'
import { useUserStore } from '../stores/user'

const cartStore = useCartStore()
const userStore = useUserStore()

onMounted(() => {
  if (userStore.isLoggedIn) {
    cartStore.refresh()
  }
})

function close() {
  cartStore.drawerVisible = false
}
</script>

<template>
  <div v-if="cartStore.drawerVisible" class="fixed inset-0 z-40 select-none">
    <!-- 背景遮罩 -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" @click="close" />

    <!-- 侧边面板 -->
    <div
      class="absolute right-0 top-0 bottom-0 w-96 bg-slate-950/95 border-l border-slate-800 text-white shadow-2xl flex flex-col backdrop-blur-2xl animate-in slide-in-from-right duration-300"
    >
      <!-- 头部 -->
      <div class="p-5 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <ShoppingBag class="w-5 h-5 text-emerald-400" />
          <h2 class="text-base font-bold text-slate-100">我的购物车 ({{ cartStore.count }})</h2>
        </div>
        <button class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition" @click="close">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 商品列表 -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        <div v-if="!userStore.isLoggedIn" class="py-16 text-center text-slate-400 text-xs">
          <p class="mb-3">请先登录后查看您的购物车</p>
          <button
            class="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition"
            @click="userStore.loginVisible = true"
          >
            立即登录
          </button>
        </div>

        <div v-else-if="cartStore.items.length === 0" class="py-16 text-center text-slate-500 text-xs">
          购物车空空如也，快去 3D 超市探索加购吧！
        </div>

        <div
          v-for="item in cartStore.items"
          :key="item.id"
          class="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition"
        >
          <div class="flex-1 truncate">
            <div class="text-xs font-semibold text-slate-200 truncate">{{ item.productName }}</div>
            <div class="text-[11px] text-slate-400 mt-0.5">
              单价: ¥{{ Number(item.price).toFixed(2) }} × {{ item.quantity }}
            </div>
            <div class="text-xs font-bold text-amber-400 mt-1 font-mono">
              小计: ¥{{ Number(item.subtotal || item.price * item.quantity).toFixed(2) }}
            </div>
          </div>

          <button
            class="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            title="移除商品"
            @click="cartStore.remove(item.id)"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- 底部结算栏 -->
      <div v-if="userStore.isLoggedIn && cartStore.items.length > 0" class="p-5 border-t border-slate-800 bg-slate-900/50">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs text-slate-400">应付合计 (含税)</span>
          <span class="text-2xl font-black text-amber-400 font-mono">¥{{ cartStore.total.toFixed(2) }}</span>
        </div>

        <button
          class="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-98 disabled:opacity-50"
          :disabled="cartStore.loading"
          @click="cartStore.checkout"
        >
          <span>{{ cartStore.loading ? '正在安全扣减库存下单...' : '一键结算并下单' }}</span>
          <ArrowRight v-if="!cartStore.loading" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
