<script setup lang="ts">
/**
 * RAG 知识库问答智能体浮窗 (RagChatModal)
 * 支持多轮问答对话追踪，展示带引用标注的回答及精准来源溯源抽屉 (文件名、页码、匹配分、原文片段)
 */
import { ref } from 'vue'
import { X, Send, Bot, User, FileText, ChevronDown, ChevronUp, Sparkles } from 'lucide-vue-next'
import { ragChat } from '../api/supermarket'
import type { ChatResponse, SourceCitation } from '../types/api'
import { useToastStore } from '../stores/toast'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const toastStore = useToastStore()
const sessionId = ref(`session_${Date.now()}`)
const inputQuestion = ref('')
const loading = ref(false)

interface MessageItem {
  id: number
  role: 'user' | 'assistant'
  content: string
  sources?: SourceCitation[]
  expandedSource?: boolean
}

const messages = ref<MessageItem[]>([
  {
    id: 1,
    role: 'assistant',
    content: '您好！我是超市 AI 智能知识库顾问。您可以向我咨询关于商品售后政策、退换货规则、生鲜保鲜标准以及店内优惠活动！',
  },
])

async function handleSend() {
  const q = inputQuestion.value.trim()
  if (!q || loading.value) return

  messages.value.push({ id: Date.now(), role: 'user', content: q })
  inputQuestion.value = ''
  loading.value = true

  try {
    const res: ChatResponse = await ragChat(sessionId.value, q)
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      content: res.answer,
      sources: res.sources,
      expandedSource: false,
    })
  } catch (err: any) {
    toastStore.push(err.message || '问答生成失败', 'error')
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      content: `抱歉，暂时未能检索到对应知识库内容：${err.message || '请重试'}`,
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center select-none">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="emit('update:modelValue', false)" />

    <div
      class="relative w-[580px] h-[640px] max-w-[94vw] max-h-[90vh] rounded-3xl bg-slate-900 border border-slate-700/80 text-white shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
    >
      <!-- 头部 -->
      <div class="p-4 px-6 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Sparkles class="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-100">AI 知识库智能客服 (RAG)</h3>
            <p class="text-[10px] text-slate-400 font-mono">会话 ID: {{ sessionId.slice(0, 18) }}...</p>
          </div>
        </div>
        <button
          class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          @click="emit('update:modelValue', false)"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 消息列表 -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="flex gap-3"
          :class="msg.role === 'user' ? 'flex-row-reverse' : ''"
        >
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs"
            :class="msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'"
          >
            <User v-if="msg.role === 'user'" class="w-4 h-4" />
            <Bot v-else class="w-4 h-4" />
          </div>

          <div
            class="max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed"
            :class="
              msg.role === 'user'
                ? 'bg-cyan-600 text-white rounded-tr-none'
                : 'bg-slate-800/90 border border-slate-700/60 text-slate-200 rounded-tl-none'
            "
          >
            <div class="whitespace-pre-wrap">{{ msg.content }}</div>

            <!-- 来源精准溯源卡片折叠 -->
            <div v-if="msg.sources && msg.sources.length > 0" class="mt-3 pt-2 border-t border-slate-700/60">
              <button
                class="flex items-center justify-between w-full text-[11px] text-amber-300 hover:text-amber-200 transition font-medium"
                @click="msg.expandedSource = !msg.expandedSource"
              >
                <span class="flex items-center gap-1">
                  <FileText class="w-3.5 h-3.5" />
                  <span>知识库溯源引用 ({{ msg.sources.length }} 处)</span>
                </span>
                <ChevronUp v-if="msg.expandedSource" class="w-3.5 h-3.5" />
                <ChevronDown v-else class="w-3.5 h-3.5" />
              </button>

              <div v-if="msg.expandedSource" class="mt-2 space-y-2">
                <div
                  v-for="s in msg.sources"
                  :key="s.citationIndex"
                  class="p-2 rounded-xl bg-slate-900/90 border border-slate-700 text-[10px] text-slate-300 space-y-1"
                >
                  <div class="flex items-center justify-between text-slate-400">
                    <span class="font-bold text-amber-400">[引用 {{ s.citationIndex }}] {{ s.fileName }}</span>
                    <span>相似度: {{ (s.similarityScore * 100).toFixed(1) }}%</span>
                  </div>
                  <div class="text-slate-400 text-[9px]">位置: 第 {{ s.pageNumber }} 页/段落</div>
                  <div class="p-1.5 rounded bg-slate-950/80 text-slate-300 font-mono text-[9px] line-clamp-3">
                    {{ s.contentSnippet }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="flex gap-3">
          <div class="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
            <Bot class="w-4 h-4 animate-spin" />
          </div>
          <div class="bg-slate-800/90 border border-slate-700/60 text-slate-400 text-xs rounded-2xl rounded-tl-none p-3">
            智能体正在检索私有知识库并生成精准引用回答...
          </div>
        </div>
      </div>

      <!-- 底部输入框 -->
      <div class="p-3 border-t border-slate-800 bg-slate-900/60">
        <form class="flex items-center gap-2" @submit.prevent="handleSend">
          <input
            v-model="inputQuestion"
            type="text"
            class="flex-1 h-10 px-4 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition"
            placeholder="输入您关于商品政策、退换货或规格的疑问..."
          />
          <button
            type="submit"
            class="h-10 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
            :disabled="loading || !inputQuestion.trim()"
          >
            <Send class="w-3.5 h-3.5" />
            <span>发送</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
