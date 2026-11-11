<script setup lang="ts">
/**
 * 3D 智慧超市体验端主入口 (App.vue)
 * 挂载全屏 3D WebGL 画布、初始化 SupermarketWorld、连接 WebSocket、承载全部 2D 悬浮 HUD
 */
import { onMounted, onUnmounted, ref } from 'vue'
import { SupermarketWorld } from './three/SupermarketWorld'
import type { CameraMode } from './three/CameraController'
import type { GuideRoute } from './types/api'
import { useSceneStore } from './stores/scene'
import { useWebSocketStore } from './stores/websocket'
import Navbar from './components/Navbar.vue'
import RoamingControlHelp from './components/RoamingControlHelp.vue'
import ProductCardDrawer from './components/ProductCardDrawer.vue'
import CartDrawer from './components/CartDrawer.vue'
import LoginModal from './components/LoginModal.vue'
import AiGuideModal from './components/AiGuideModal.vue'
import AiGuideCruiseBar from './components/AiGuideCruiseBar.vue'
import RagChatModal from './components/RagChatModal.vue'
import MerchantQuickDrawer from './components/MerchantQuickDrawer.vue'
import ToastHost from './components/ToastHost.vue'

const canvasContainer = ref<HTMLDivElement | null>(null)
let world: SupermarketWorld | null = null

const sceneStore = useSceneStore()
const wsStore = useWebSocketStore()

const cameraMode = ref<CameraMode>('orbit')
const fps = ref(60)

// 弹窗状态
const guideModalVisible = ref(false)
const ragModalVisible = ref(false)
const merchantDrawerVisible = ref(false)
const activeRoute = ref<GuideRoute | null>(null)

onMounted(async () => {
  if (!canvasContainer.value) return

  // 1. 初始化 3D 核心世界
  world = new SupermarketWorld({
    onProductSelected: (id) => sceneStore.selectProduct(id),
    onShopSelected: (shelfId) => {
      sceneStore.currentShopShelfId = shelfId
    },
    onModeChanged: (m) => (cameraMode.value = m),
    onFpsUpdated: (f) => (fps.value = f),
  })
  world.init(canvasContainer.value)

  // 2. 拉取全景场景树并渲染
  await sceneStore.load()
  if (sceneStore.scene) {
    world.loadSceneData(sceneStore.scene)
  }

  // 3. 建立 WebSocket 实时库存监听通道
  wsStore.connect()

  // 4. 键盘全局快捷键：按下 'G' 唤起 AI 导购
  window.addEventListener('keydown', handleGlobalKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKey)
  wsStore.disconnect()
  world?.dispose()
})

function handleGlobalKey(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  if (e.code === 'KeyG') {
    guideModalVisible.value = true
  }
}

function handleToggleMode() {
  if (cameraMode.value === 'orbit') {
    world?.setCameraMode('fps')
  } else {
    world?.setCameraMode('orbit')
  }
}

function handleStartRoute(route: GuideRoute) {
  activeRoute.value = route
}

function handleCloseRoute() {
  activeRoute.value = null
  world?.setCameraMode('orbit')
}
</script>

<template>
  <div class="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
    <!-- 3D WebGL 画布容器 -->
    <div ref="canvasContainer" class="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

    <!-- 顶部导航栏 -->
    <Navbar
      :camera-mode="cameraMode"
      :fps="fps"
      @open-guide="guideModalVisible = true"
      @open-rag="ragModalVisible = true"
      @open-merchant="merchantDrawerVisible = true"
      @toggle-mode="handleToggleMode"
    />

    <!-- 正在店内深度浏览 HUD 指示条 -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
    >
      <div
        v-if="sceneStore.currentShop"
        class="fixed top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 px-6 py-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-cyan-500/40 shadow-2xl shadow-cyan-500/15 text-white"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow text-white font-bold text-sm">
            🏬
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-xs tracking-wide text-white">正在店内浏览：{{ sceneStore.currentShop.name }}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {{ sceneStore.currentShop.zone }}
              </span>
            </div>
            <div class="text-[11px] text-slate-300 mt-0.5">
              点击展台商品可悬浮 360° 自转展示并加入购物车
            </div>
          </div>
        </div>

        <button
          @click="sceneStore.exitShop()"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-xs font-semibold text-white shadow-md shadow-sky-500/25 active:scale-95 transition"
        >
          <span>🚶</span>
          <span>走出店铺回到街区</span>
        </button>
      </div>
    </transition>

    <!-- 第一人称漫游提示 -->
    <RoamingControlHelp
      v-if="cameraMode === 'fps'"
      @exit="handleToggleMode"
    />

    <!-- 右侧商品卡片抽屉 -->
    <ProductCardDrawer />

    <!-- 购物车抽屉 -->
    <CartDrawer />

    <!-- 商家快捷管理抽屉 -->
    <MerchantQuickDrawer
      :visible="merchantDrawerVisible"
      @close="merchantDrawerVisible = false"
    />

    <!-- 登录注册弹窗 -->
    <LoginModal />

    <!-- AI 导购清单弹窗 -->
    <AiGuideModal
      v-model="guideModalVisible"
      @route-planned="handleStartRoute"
    />

    <!-- 底部 AI 导购巡航控制条 -->
    <AiGuideCruiseBar
      v-if="activeRoute"
      :route="activeRoute"
      @close="handleCloseRoute"
    />

    <!-- RAG 知识库问答浮窗 -->
    <RagChatModal v-model="ragModalVisible" />

    <!-- 全局轻提示 Toast -->
    <ToastHost />
  </div>
</template>
