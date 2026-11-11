<script setup lang="ts">
/**
 * 顶部导航栏 (Navbar)
 * - 场景空间商品搜索：输入关键词检索并支持点击直飞对应 3D 货架
 * - 街区探店菜单：直接浏览全场 7 座独立商铺并点击开门直飞店内
 * - 相机模式切换 (Orbit 上帝视角 / FPS 第一人称)
 * - 画质切换 (高质量 Bloom / 性能模式)
 * - AI 导购与 RAG 知识库客服入口
 * - 商家后台快速抽屉入口
 * - 购物车与登录状态管理
 * - WebSocket 实时在线心跳指示灯
 */
import { ref } from 'vue'
import {
  Search,
  ShoppingCart,
  User,
  Bot,
  MessageSquare,
  Sparkles,
  Volume2,
  VolumeX,
  Compass,
  Eye,
  Store,
  ChevronDown,
} from 'lucide-vue-next'
import { searchSpatial } from '../api/supermarket'
import type { ProductSpatial } from '../types/api'
import { useUserStore } from '../stores/user'
import { useCartStore } from '../stores/cart'
import { useWebSocketStore } from '../stores/websocket'
import { useSceneStore } from '../stores/scene'
import { getWorld } from '../three/worldRef'
import { voiceSynthesizer } from '../utils/voice'

defineProps<{
  cameraMode: 'orbit' | 'fps' | 'flight'
  fps: number
}>()

const emit = defineEmits<{
  (e: 'openGuide'): void
  (e: 'openRag'): void
  (e: 'openMerchant'): void
  (e: 'toggleMode'): void
}>()

const userStore = useUserStore()
const cartStore = useCartStore()
const wsStore = useWebSocketStore()
const sceneStore = useSceneStore()

// 搜索栏状态
const keyword = ref('')
const searchLoading = ref(false)
const searchResults = ref<ProductSpatial[]>([])
const searchOpen = ref(false)

// 街区探店下拉菜单
const shopsDropdownOpen = ref(false)

// 画质与静音
const isHighQuality = ref(true)
const isMuted = ref(false)

async function handleSearch() {
  if (!keyword.value.trim()) {
    searchResults.value = []
    searchOpen.value = false
    return
  }
  searchLoading.value = true
  try {
    searchResults.value = await searchSpatial(keyword.value.trim())
    searchOpen.value = true
  } finally {
    searchLoading.value = false
  }
}

/** 点击搜索结果：直接运镜直飞到货架特写机位并打开商品详情 */
function selectSpatialProduct(p: ProductSpatial) {
  searchOpen.value = false
  keyword.value = p.name

  if (p.shelfId != null) {
    sceneStore.enterShop(p.shelfId)
    setTimeout(() => {
      sceneStore.selectProduct(p.id)
    }, 800)
  } else {
    sceneStore.selectProduct(p.id)
  }
}

function handleSelectShop(shelfId: number) {
  shopsDropdownOpen.value = false
  sceneStore.enterShop(shelfId)
}

function handleExitToStreet() {
  shopsDropdownOpen.value = false
  sceneStore.exitShop()
}

function toggleQuality() {
  isHighQuality.value = !isHighQuality.value
  getWorld()?.setQuality(isHighQuality.value)
}

function toggleMute() {
  isMuted.value = voiceSynthesizer.toggleMute()
}
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-30 h-16 px-6 flex items-center justify-between bg-slate-950/75 backdrop-blur-md border-b border-slate-800/80 text-white select-none"
  >
    <!-- 左侧：系统名称与状态灯 -->
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Sparkles class="w-5 h-5 text-white" />
        </div>
        <div>
          <div class="font-bold text-sm tracking-wide bg-gradient-to-r from-cyan-300 via-sky-200 to-white bg-clip-text text-transparent">
            3D 智慧商业街
          </div>
          <div class="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
            <span>{{ fps }} FPS</span>
            <span>•</span>
            <span class="flex items-center gap-1">
              <span
                class="w-1.5 h-1.5 rounded-full"
                :class="{
                  'bg-emerald-400 shadow-[0_0_8px_#34d399]': wsStore.state === 'connected',
                  'bg-amber-400 animate-pulse': wsStore.state === 'reconnecting' || wsStore.state === 'connecting',
                  'bg-rose-500': wsStore.state === 'idle',
                }"
              />
              {{ wsStore.state === 'connected' ? '实时同步' : wsStore.state === 'reconnecting' ? '重连中' : '离线' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 中间：商品空间检索栏与探店快捷直达 -->
    <div class="flex items-center gap-3">
      <!-- 搜索栏 -->
      <div class="relative w-72 md:w-88">
        <div class="relative flex items-center">
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索全场商品，直飞空间货架..."
            class="w-full h-9 pl-9 pr-4 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
            @input="handleSearch"
            @focus="handleSearch"
          />
          <Search class="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        </div>

        <!-- 搜索下拉结果浮层 -->
        <div
          v-if="searchOpen && searchResults.length > 0"
          class="absolute top-11 left-0 right-0 max-h-72 overflow-y-auto rounded-xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl divide-y divide-slate-800/60 z-50"
        >
          <div
            v-for="item in searchResults"
            :key="item.id"
            class="p-2.5 hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition"
            @click="selectSpatialProduct(item)"
          >
            <div class="truncate mr-2">
              <div class="text-xs font-medium text-slate-200 truncate">{{ item.name }}</div>
              <div class="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span class="text-cyan-400">{{ item.shelfCode || '未分配' }}</span>
                <span>{{ item.zone || '全场' }}</span>
                <span>库存: {{ item.stock }}</span>
              </div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-xs font-bold text-amber-400">¥{{ Number(item.price).toFixed(2) }}</div>
              <div v-if="item.outOfStock || item.isOutOfStock || item.stock <= 0" class="text-[9px] text-rose-400 font-semibold">
                售罄
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 街区探店下拉菜单 -->
      <div class="relative">
        <button
          class="px-3 h-9 rounded-full bg-sky-950/70 hover:bg-sky-900/80 border border-sky-600/50 text-xs font-medium flex items-center gap-1.5 transition text-sky-200 active:scale-95"
          title="查看商业街所有特色门店"
          @click="shopsDropdownOpen = !shopsDropdownOpen"
        >
          <Store class="w-3.5 h-3.5 text-sky-400" />
          <span>街区探店</span>
          <ChevronDown class="w-3 h-3 text-sky-400" />
        </button>

        <!-- 店铺下拉菜单 -->
        <div
          v-if="shopsDropdownOpen"
          class="absolute top-11 right-0 w-72 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-xl p-2 z-50 divide-y divide-slate-800"
        >
          <div class="text-[11px] font-semibold text-slate-400 px-2 py-1.5 flex items-center justify-between">
            <span>商业步行街 7 座独立商铺</span>
            <button @click="shopsDropdownOpen = false" class="text-slate-500 hover:text-white text-xs">✕</button>
          </div>
          <div class="py-1 max-h-80 overflow-y-auto space-y-1">
            <div
              v-for="s in sceneStore.shelves"
              :key="s.id"
              class="px-2.5 py-2 rounded-lg hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition group"
              :class="{ 'bg-cyan-950/60 border border-cyan-500/30': sceneStore.currentShopShelfId === s.id }"
              @click="handleSelectShop(s.id)"
            >
              <div>
                <div class="text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition">
                  {{ s.name }}
                </div>
                <div class="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span class="text-cyan-400 font-mono">{{ s.shelfCode }}</span>
                  <span>{{ s.zone }}</span>
                  <span>在售 {{ s.products?.length || 0 }} 款</span>
                </div>
              </div>
              <span class="text-xs text-slate-500 group-hover:text-cyan-400 font-bold">进店 ➔</span>
            </div>
          </div>
          <div class="pt-2 px-1">
            <button
              v-if="sceneStore.currentShopShelfId"
              @click="handleExitToStreet"
              class="w-full py-1.5 text-center text-xs font-semibold text-sky-300 bg-sky-950/80 hover:bg-sky-900 rounded-lg border border-sky-700/50 transition"
            >
              🚶 走出店铺回到街区
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧：功能按钮矩阵 -->
    <div class="flex items-center gap-2">
      <!-- 相机模式切换 -->
      <button
        class="px-3 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium flex items-center gap-1.5 transition text-slate-300"
        title="切换全景/第一人称漫游"
        @click="emit('toggleMode')"
      >
        <Compass class="w-3.5 h-3.5 text-cyan-400" />
        <span>{{ cameraMode === 'fps' ? '第一人称' : '全景视角' }}</span>
      </button>

      <!-- 画质切换 -->
      <button
        class="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 flex items-center justify-center text-xs transition"
        :class="isHighQuality ? 'text-cyan-400 border-cyan-500/40' : 'text-slate-400'"
        title="画质切换 (Bloom光影)"
        @click="toggleQuality"
      >
        <Eye class="w-4 h-4" />
      </button>

      <!-- 语音静音开关 -->
      <button
        class="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 flex items-center justify-center text-xs transition"
        :class="!isMuted ? 'text-cyan-400' : 'text-slate-500'"
        title="导购语音播报开关"
        @click="toggleMute"
      >
        <Volume2 v-if="!isMuted" class="w-4 h-4" />
        <VolumeX v-else class="w-4 h-4" />
      </button>

      <!-- AI 导购机器人 -->
      <button
        class="px-3 h-8 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition active:scale-95"
        @click="emit('openGuide')"
      >
        <Bot class="w-4 h-4" />
        <span>AI 导购</span>
      </button>

      <!-- RAG 客服问答 -->
      <button
        class="px-3 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium flex items-center gap-1.5 transition text-slate-300"
        @click="emit('openRag')"
      >
        <MessageSquare class="w-3.5 h-3.5 text-amber-400" />
        <span>知识库客服</span>
      </button>

      <!-- 商家管理后台入口 -->
      <button
        class="px-2.5 h-8 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-500/60 text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95 text-white"
        title="打开商家后台管理 (调库存/上下架/查看点位)"
        @click="emit('openMerchant')"
      >
        <Store class="w-3.5 h-3.5" />
        <span>商家后台</span>
      </button>

      <!-- 购物车 -->
      <button
        class="relative w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 flex items-center justify-center text-slate-300 transition"
        @click="cartStore.drawerVisible = true"
      >
        <ShoppingCart class="w-4 h-4 text-emerald-400" />
        <span
          v-if="cartStore.count > 0"
          class="absolute -top-1.5 -right-1.5 bg-rose-500 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow"
        >
          {{ cartStore.count > 99 ? '99+' : cartStore.count }}
        </span>
      </button>

      <!-- 用户登录态 -->
      <button
        class="px-2.5 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium flex items-center gap-1.5 transition text-slate-300"
        @click="userStore.isLoggedIn ? userStore.logout() : (userStore.loginVisible = true)"
      >
        <User class="w-3.5 h-3.5 text-slate-400" />
        <span>{{ userStore.isLoggedIn ? userStore.username : '登录' }}</span>
      </button>
    </div>
  </header>
</template>
