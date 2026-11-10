<script setup lang="ts">
/**
 * 顶部导航栏 (Navbar)
 * - 场景空间商品搜索：输入关键词检索并支持点击直飞对应 3D 货架
 * - 相机模式切换 (Orbit 上帝视角 / FPS 第一人称)
 * - 画质切换 (高质量 Bloom / 性能模式)
 * - AI 导购与 RAG 知识库客服入口
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
    getWorld()?.flyToShelf(p.shelfId, () => {
      sceneStore.selectProduct(p.id)
    })
  } else {
    sceneStore.selectProduct(p.id)
  }
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
    class="fixed top-0 left-0 right-0 z-30 h-16 px-6 flex items-center justify-between bg-slate-950/70 backdrop-blur-md border-b border-slate-800/80 text-white select-none"
  >
    <!-- 左侧：系统名称与状态灯 -->
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Sparkles class="w-5 h-5 text-white" />
        </div>
        <div>
          <div class="font-bold text-sm tracking-wide bg-gradient-to-r from-cyan-300 via-sky-200 to-white bg-clip-text text-transparent">
            3D 数字孪生超市
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

    <!-- 中间：商品空间检索栏 -->
    <div class="relative w-80 md:w-96">
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
        class="absolute top-11 left-0 right-0 max-h-72 overflow-y-auto rounded-xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl divide-y divide-slate-800/60"
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
