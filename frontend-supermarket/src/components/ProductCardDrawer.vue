<script setup lang="ts">
/**
 * 2D 玻璃拟态商品卡片抽屉 (ProductCardDrawer)
 * 展示选中商品的详情、所属货架编码、实时库存、加购与数量调控
 */
import { ref, watch } from 'vue'
import { X, ShoppingCart, LocateFixed, Package } from 'lucide-vue-next'
import { useSceneStore } from '../stores/scene'
import { useCartStore } from '../stores/cart'
import { getWorld } from '../three/worldRef'

const sceneStore = useSceneStore()
const cartStore = useCartStore()

const quantity = ref(1)

watch(
  () => sceneStore.selectedProductId,
  () => {
    quantity.value = 1
  }
)

function close() {
  sceneStore.selectProduct(null)
}

function handleAddToCart() {
  const p = sceneStore.selectedProduct
  if (!p || p.stock <= 0) return
  cartStore.add(p.id, quantity.value, p.name)
}

function flyToShelf() {
  const p = sceneStore.selectedProduct
  if (p?.shelfId != null) {
    getWorld()?.flyToShelf(p.shelfId)
  }
}
</script>

<template>
  <div
    v-if="sceneStore.selectedProduct"
    class="fixed right-6 bottom-6 z-20 w-96 rounded-3xl bg-slate-900/85 backdrop-blur-2xl border border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-white overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-6"
  >
    <!-- 卡片顶图装饰条 -->
    <div class="h-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

    <div class="p-5">
      <!-- 头部：商品名称与关闭 -->
      <div class="flex items-start justify-between gap-3 mb-2">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {{ sceneStore.selectedProduct.category }}
            </span>
            <span
              v-if="sceneStore.selectedProduct.stock <= 0"
              class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30"
            >
              已售罄 ⚠️
            </span>
          </div>
          <h3 class="text-base font-bold text-slate-100 leading-snug">
            {{ sceneStore.selectedProduct.name }}
          </h3>
        </div>
        <button
          class="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          @click="close"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 货架空间信息条 -->
      <div class="my-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs">
        <div class="flex items-center gap-2">
          <Package class="w-4 h-4 text-cyan-400" />
          <span class="text-slate-300 font-mono">{{ sceneStore.selectedShelf?.shelfCode || '货架点位' }}</span>
          <span class="text-slate-400">• {{ sceneStore.selectedShelf?.name || '展示位' }}</span>
        </div>
        <button
          class="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition"
          @click="flyToShelf"
        >
          <LocateFixed class="w-3.5 h-3.5" />
          <span>飞掠特写</span>
        </button>
      </div>

      <!-- 商品描述 -->
      <p class="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
        {{ sceneStore.selectedProduct.description || '暂无商品详细描述。' }}
      </p>

      <!-- 价格与数量加减 -->
      <div class="flex items-center justify-between pt-2 border-t border-slate-800/80">
        <div>
          <div class="text-[10px] text-slate-400">商品售价</div>
          <div class="text-2xl font-black text-amber-400 font-mono">
            ¥{{ Number(sceneStore.selectedProduct.price).toFixed(2) }}
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="text-[11px] text-slate-400 mr-1">
            剩余 <span class="font-bold text-slate-200">{{ sceneStore.selectedProduct.stock }}</span> 件
          </div>
          <div
            v-if="sceneStore.selectedProduct.stock > 0"
            class="flex items-center border border-slate-700 rounded-lg bg-slate-800/80"
          >
            <button
              class="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white text-sm"
              :disabled="quantity <= 1"
              @click="quantity > 1 && quantity--"
            >
              -
            </button>
            <span class="w-7 text-center text-xs font-bold text-white">{{ quantity }}</span>
            <button
              class="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white text-sm"
              :disabled="quantity >= sceneStore.selectedProduct.stock"
              @click="quantity < sceneStore.selectedProduct.stock && quantity++"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <!-- 加入购物车按钮 -->
      <button
        class="w-full mt-4 h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-98"
        :class="
          sceneStore.selectedProduct.stock > 0
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
        "
        :disabled="sceneStore.selectedProduct.stock <= 0"
        @click="handleAddToCart"
      >
        <ShoppingCart class="w-4 h-4" />
        <span>{{ sceneStore.selectedProduct.stock > 0 ? '加入购物车' : '该商品全场已售罄' }}</span>
      </button>
    </div>
  </div>
</template>
