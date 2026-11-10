<script setup lang="ts">
/**
 * 第一人称漫游控制提示浮层 (FPS Controls Overlay)
 */
defineEmits<{
  (e: 'exit'): void
}>()
</script>

<template>
  <div
    class="fixed bottom-6 left-6 z-20 p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 shadow-2xl text-white max-w-xs select-none"
  >
    <div class="flex items-center justify-between mb-2">
      <div class="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        第一人称漫游模式已启用
      </div>
      <button
        class="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 transition"
        @click="$emit('exit')"
      >
        退出漫游 (ESC)
      </button>
    </div>
    <div class="space-y-1 text-[11px] text-slate-300">
      <div class="flex items-center justify-between">
        <span class="text-slate-400">前后左右位移</span>
        <span class="font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">W / A / S / D</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-slate-400">疾跑加速</span>
        <span class="font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Shift</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-slate-400">环顾视角</span>
        <span class="font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">按住鼠标右键滑动</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-slate-400">点击商品</span>
        <span class="font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">鼠标左键直接拾取</span>
      </div>
    </div>
  </div>
</template>
