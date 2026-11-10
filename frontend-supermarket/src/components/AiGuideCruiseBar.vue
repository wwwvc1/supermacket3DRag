<script setup lang="ts">
/**
 * 底部 AI 导购巡航控制条 (AiGuideCruiseBar)
 * 逐站运镜平滑飞掠、显示 AI 导购语音解说词、一键加购与巡航步进控制
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Square,
  ShoppingCart,
  Bot,
  AlertCircle,
} from 'lucide-vue-next'
import type { GuideRoute, Waypoint } from '../types/api'
import { getWorld } from '../three/worldRef'
import { useCartStore } from '../stores/cart'
import { useSceneStore } from '../stores/scene'
import { voiceSynthesizer } from '../utils/voice'

const props = defineProps<{
  route: GuideRoute
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const cartStore = useCartStore()
const sceneStore = useSceneStore()

const currentIndex = ref(0)
const isPaused = ref(false)
const currentSpeech = ref('')

const currentWaypoint = computed<Waypoint | undefined>(() => props.route.waypoints[currentIndex.value])

onMounted(() => {
  startTour()
})

onUnmounted(() => {
  voiceSynthesizer.stop()
})

/** 启动巡航：首先朗读开场白，随后运镜飞向第 1 站 */
function startTour() {
  currentIndex.value = 0
  isPaused.value = false

  if (props.route.summary) {
    currentSpeech.value = props.route.summary
    voiceSynthesizer.speak(props.route.summary, () => {
      if (!isPaused.value) {
        goToStop(0)
      }
    })
  } else {
    goToStop(0)
  }
}

/** 飞跃前往指定站点 */
function goToStop(index: number) {
  if (index < 0 || index >= props.route.waypoints.length) return
  currentIndex.value = index
  const wp = props.route.waypoints[index]
  if (!wp) return

  // 设置当前选中商品
  sceneStore.selectProduct(wp.productId)

  // 1. 平滑运镜飞向该货架
  const posX = wp.positionX ?? 0
  const posY = wp.positionY ?? 0
  const posZ = wp.positionZ ?? 0

  const camPos = {
    x: wp.cameraTargetX ?? posX,
    y: wp.cameraTargetY ?? 1.5,
    z: wp.cameraTargetZ ?? (posZ + 2),
  }
  const lookAt = {
    x: posX,
    y: posY + 1.0,
    z: posZ,
  }

  currentSpeech.value = wp.guideSpeech || `我们已到达第 ${wp.step} 站：${wp.shelfName}，这里为您陈列了 ${wp.productName}。`

  getWorld()?.flyToCoords(camPos, lookAt, 1.6, () => {
    // 到达站点后播放解说词
    if (!isPaused.value && wp.guideSpeech) {
      voiceSynthesizer.speak(wp.guideSpeech, () => {
        // 自动巡航模式可在此处延时进入下一站
      })
    }
  })
}

function handlePrev() {
  if (currentIndex.value > 0) {
    voiceSynthesizer.stop()
    goToStop(currentIndex.value - 1)
  }
}

function handleNext() {
  if (currentIndex.value < props.route.waypoints.length - 1) {
    voiceSynthesizer.stop()
    goToStop(currentIndex.value + 1)
  } else {
    handleStop()
  }
}

function togglePause() {
  isPaused.value = !isPaused.value
  if (isPaused.value) {
    voiceSynthesizer.stop()
  } else {
    if (currentWaypoint.value?.guideSpeech) {
      voiceSynthesizer.speak(currentWaypoint.value.guideSpeech)
    }
  }
}

function handleStop() {
  voiceSynthesizer.stop()
  emit('close')
}

function handleAddCurrent() {
  const wp = currentWaypoint.value
  if (!wp || (wp.outOfStock || wp.isOutOfStock || wp.stock <= 0)) return
  cartStore.add(wp.productId, 1, wp.productName)
}
</script>

<template>
  <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[680px] max-w-[92vw] select-none">
    <!-- 未匹配商品浮条提示 -->
    <div
      v-if="route.unmatchedItems && route.unmatchedItems.length > 0"
      class="mb-2 px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 backdrop-blur-md text-amber-200 text-[11px] flex items-center justify-between shadow-lg"
    >
      <div class="flex items-center gap-1.5">
        <AlertCircle class="w-3.5 h-3.5 text-amber-400" />
        <span>清单中未在店内匹配到以下物品：{{ route.unmatchedItems.join('、') }}</span>
      </div>
    </div>

    <!-- 巡航主体控制卡片 -->
    <div
      class="rounded-3xl bg-slate-900/90 border border-slate-700/80 p-4 shadow-2xl backdrop-blur-2xl text-white space-y-3"
    >
      <!-- 上半部：解说词与 AI 虚拟气泡 -->
      <div class="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
        <div class="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
          <Bot class="w-5 h-5 text-cyan-400" />
        </div>
        <div class="flex-1 text-xs text-slate-200 leading-relaxed max-h-16 overflow-y-auto">
          {{ currentSpeech }}
        </div>
      </div>

      <!-- 下半部：站点指示器、当前商品与巡航控制按钮 -->
      <div class="flex items-center justify-between gap-3 pt-1">
        <!-- 站点序号与商品 -->
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
            第 {{ currentIndex + 1 }} / {{ route.totalStops }} 站
          </span>
          <span class="text-xs font-semibold text-slate-200 truncate max-w-[140px]">
            {{ currentWaypoint?.productName }}
          </span>
          <span class="text-xs font-bold text-amber-400 font-mono">
            ¥{{ Number(currentWaypoint?.price || 0).toFixed(2) }}
          </span>
        </div>

        <!-- 按钮组 -->
        <div class="flex items-center gap-2">
          <!-- 加购本站商品 -->
          <button
            class="px-3 h-8 rounded-lg font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
            :class="
              currentWaypoint && !(currentWaypoint.outOfStock || currentWaypoint.isOutOfStock || currentWaypoint.stock <= 0)
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            "
            :disabled="currentWaypoint && (currentWaypoint.outOfStock || currentWaypoint.isOutOfStock || currentWaypoint.stock <= 0)"
            @click="handleAddCurrent"
          >
            <ShoppingCart class="w-3.5 h-3.5" />
            <span>加购</span>
          </button>

          <!-- 上一站 -->
          <button
            class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 transition disabled:opacity-30"
            :disabled="currentIndex <= 0"
            title="上一站"
            @click="handlePrev"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>

          <!-- 暂停 / 播放 -->
          <button
            class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-cyan-400 transition"
            title="暂停 / 播放解说"
            @click="togglePause"
          >
            <Pause v-if="!isPaused" class="w-4 h-4" />
            <Play v-else class="w-4 h-4" />
          </button>

          <!-- 下一站 -->
          <button
            class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 transition"
            title="下一站"
            @click="handleNext"
          >
            <ChevronRight class="w-4 h-4" />
          </button>

          <!-- 退出巡航 -->
          <button
            class="w-8 h-8 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 flex items-center justify-center text-rose-300 transition"
            title="退出导购巡航"
            @click="handleStop"
          >
            <Square class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
