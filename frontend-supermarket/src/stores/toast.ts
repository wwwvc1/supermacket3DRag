/**
 * 全局轻提示 Toast 状态
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'info' | 'success' | 'error' | 'warning'
export interface Toast {
  id: number
  type: ToastType
  text: string
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  let seq = 0

  /** 推送一条提示，默认 3.5 秒后自动消失 */
  function push(text: string, type: ToastType = 'info', ttl = 3500) {
    const id = ++seq
    toasts.value.push({ id, type, text })
    if (toasts.value.length > 5) toasts.value.shift()
    setTimeout(() => remove(id), ttl)
  }

  function remove(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, push, remove }
})
