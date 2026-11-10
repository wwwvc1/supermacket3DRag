<script setup lang="ts">
/**
 * AI 智能导购清单录入对话框 (AiGuideModal)
 * 用户输入自由文本购物清单，大模型识别并结合空间算法规划最优拓扑航路点
 */
import { ref } from 'vue'
import { X, Bot, Sparkles, Send } from 'lucide-vue-next'
import { planRoute } from '../api/supermarket'
import type { GuideRoute } from '../types/api'
import { useToastStore } from '../stores/toast'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'routePlanned', route: GuideRoute): void
}>()

const toastStore = useToastStore()
const shoppingListText = ref('')
const loading = ref(false)

const presets = [
  '我想买一箱特仑苏纯牛奶，两斤红富士苹果，还要一副索尼头戴耳机',
  '我想配一套电竞装备：客制化机械键盘与 4K 电竞显示器',
  '帮我选一台苹果 iPhone 手机和一款智能手表',
]

function usePreset(text: string) {
  shoppingListText.value = text
}

async function handlePlan() {
  if (!shoppingListText.value.trim()) {
    toastStore.push('请输入您想购买的物品清单', 'warning')
    return
  }
  loading.value = true
  try {
    const route = await planRoute(shoppingListText.value.trim())
    if (!route.waypoints || route.waypoints.length === 0) {
      toastStore.push('未能匹配到店内对应商品，请换个商品词试试', 'warning')
      return
    }
    emit('routePlanned', route)
    emit('update:modelValue', false)
  } catch (err: any) {
    toastStore.push(err.message || '规划巡航路线失败', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center select-none">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="emit('update:modelValue', false)" />

    <div
      class="relative w-[520px] rounded-3xl bg-slate-900 border border-slate-700/80 p-6 text-white shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200"
    >
      <!-- 头部 -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Bot class="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-100">AI 导购机器人巡航规划</h3>
            <p class="text-[11px] text-slate-400">输入自由文本清单，AI 将为您规划空间最近邻最优巡航动线</p>
          </div>
        </div>
        <button
          class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          @click="emit('update:modelValue', false)"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 快捷样例标签 -->
      <div class="mb-3">
        <div class="text-[11px] text-slate-400 flex items-center gap-1 mb-2">
          <Sparkles class="w-3.5 h-3.5 text-amber-400" />
          <span>点击快速填入样例清单：</span>
        </div>
        <div class="space-y-1.5">
          <button
            v-for="(p, i) in presets"
            :key="i"
            type="button"
            class="w-full text-left p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/50 text-[11px] text-slate-300 transition"
            @click="usePreset(p)"
          >
            "{{ p }}"
          </button>
        </div>
      </div>

      <!-- 输入框 -->
      <div class="mt-4">
        <label class="block text-[11px] font-medium text-slate-400 mb-1">您的购物需求 / 清单：</label>
        <textarea
          v-model="shoppingListText"
          rows="3"
          class="w-full p-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition resize-none"
          placeholder="例如：我想买一箱特仑苏纯牛奶，两斤红富士苹果，还要一副索尼头戴耳机..."
        />
      </div>

      <!-- 提交按钮 -->
      <button
        class="w-full mt-4 h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition active:scale-98 disabled:opacity-50"
        :disabled="loading"
        @click="handlePlan"
      >
        <Send v-if="!loading" class="w-4 h-4" />
        <span>{{ loading ? '智能体正在解析清单并规划空间动线...' : '生成 3D 导购动线并启程巡航' }}</span>
      </button>
    </div>
  </div>
</template>
