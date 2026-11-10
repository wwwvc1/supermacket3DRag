/**
 * WebSocket 实时库存通道：状态机 + 30s 心跳 + 指数退避重连
 * 收到 INVENTORY_CHANGED 后联动 scene store（3D 标红）与 Toast 提示
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { backoffDelay } from '../utils/common'
import { parseInventoryEvent, resolveWsUrl } from '../utils/ws'
import type { InventoryEvent } from '../types/api'
import { useSceneStore } from './scene'
import { useToastStore } from './toast'

export type WsState = 'idle' | 'connecting' | 'connected' | 'reconnecting'

export const useWebSocketStore = defineStore('websocket', () => {
  const state = ref<WsState>('idle')
  const lastEvent = ref<InventoryEvent | null>(null)
  let socket: WebSocket | null = null
  let attempt = 0
  let heartbeat: number | undefined
  let reconnectTimer: number | undefined
  let manualClose = false

  function connect() {
    manualClose = false
    state.value = attempt === 0 ? 'connecting' : 'reconnecting'
    socket = new WebSocket(resolveWsUrl(location))

    socket.onopen = () => {
      state.value = 'connected'
      attempt = 0
      // 心跳：服务端会静默忽略 ping，仅用于保持链路活跃
      heartbeat = window.setInterval(() => socket?.readyState === WebSocket.OPEN && socket.send('ping'), 30000)
    }
    socket.onmessage = (ev) => {
      const e = parseInventoryEvent(String(ev.data))
      if (e) handleEvent(e)
    }
    socket.onclose = () => {
      window.clearInterval(heartbeat)
      if (manualClose) {
        state.value = 'idle'
        return
      }
      state.value = 'reconnecting'
      reconnectTimer = window.setTimeout(connect, backoffDelay(attempt++))
    }
    socket.onerror = () => socket?.close()
  }

  /** 处理库存变动：更新库存、货架状态，并提示用户 */
  function handleEvent(e: InventoryEvent) {
    lastEvent.value = e
    const sceneStore = useSceneStore()
    sceneStore.updateProductStock(e.productId, e.stock)
    sceneStore.updateShelfStatus(e.shelfId, e.shelfStatus)
    const toast = useToastStore()
    if (e.shelfStatus === 'OUT_OF_STOCK') {
      toast.push(`⚠️ 货架 ${e.shelfCode} 已全部售罄（${e.productName}）`, 'error', 5000)
    } else {
      toast.push(`商品 [${e.productName}] 实时库存变动：当前剩余 ${e.stock} 件`, e.isOutOfStock ? 'warning' : 'info')
    }
  }

  function disconnect() {
    manualClose = true
    window.clearTimeout(reconnectTimer)
    socket?.close()
  }

  return { state, lastEvent, connect, disconnect }
})
