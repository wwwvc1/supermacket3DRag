<script setup lang="ts">
/**
 * 全局浮动轻提示宿主 (ToastHost)
 */
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-vue-next'
import { useToastStore } from '../stores/toast'

const toastStore = useToastStore()
</script>

<template>
  <div class="fixed top-20 right-6 z-50 space-y-2 pointer-events-none select-none max-w-sm w-full">
    <transition-group
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-4"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-for="t in toastStore.toasts"
        :key="t.id"
        class="pointer-events-auto p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center justify-between gap-3 text-xs"
        :class="{
          'bg-slate-900/95 border-emerald-500/50 text-emerald-200': t.type === 'success',
          'bg-slate-900/95 border-rose-500/50 text-rose-200': t.type === 'error',
          'bg-slate-900/95 border-amber-500/50 text-amber-200': t.type === 'warning',
          'bg-slate-900/95 border-cyan-500/50 text-cyan-200': t.type === 'info',
        }"
      >
        <div class="flex items-center gap-2.5">
          <CheckCircle2 v-if="t.type === 'success'" class="w-4 h-4 text-emerald-400 shrink-0" />
          <AlertCircle v-else-if="t.type === 'error'" class="w-4 h-4 text-rose-400 shrink-0" />
          <AlertTriangle v-else-if="t.type === 'warning'" class="w-4 h-4 text-amber-400 shrink-0" />
          <Info v-else class="w-4 h-4 text-cyan-400 shrink-0" />
          <span class="font-medium leading-relaxed">{{ t.text }}</span>
        </div>
        <button
          class="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
          @click="toastStore.remove(t.id)"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </transition-group>
  </div>
</template>
