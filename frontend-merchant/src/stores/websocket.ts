import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { InventoryEvent } from '@/types/api'
import { buildWsUrl, getBackoffDelay, parseInventoryEvent } from '@/utils/ws'

/** 连接状态：连接中 / 已连接 / 重连中 */
export type WsStatus = 'connecting' | 'connected' | 'reconnecting'

/** 库存事件订阅回调 */
type InventoryListener = (e: InventoryEvent) => void

/** 心跳间隔（毫秒）：服务端忽略 ping，仅用于保活代理连接 */
const HEARTBEAT_MS = 30000

/**
 * 全局 WebSocket 状态管理
 * - 单例连接 /ws/supermarket
 * - 30s 心跳，断线按 1s/2s/5s/10s 指数退避重连
 * - 解析 INVENTORY_CHANGED 事件并分发给订阅者
 */
export const useWebSocketStore = defineStore('websocket', () => {
  const status = ref<WsStatus>('connecting')
  const lastEvent = ref<InventoryEvent | null>(null)

  let socket: WebSocket | null = null
  let attempt = 0
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let manualClosed = false
  const listeners = new Set<InventoryListener>()

  /** 清理心跳定时器 */
  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  /** 建立连接（重复调用安全） */
  function connect() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return
    manualClosed = false
    status.value = attempt === 0 ? 'connecting' : 'reconnecting'
    const ws = new WebSocket(buildWsUrl(location.protocol, location.host))
    socket = ws

    ws.onopen = () => {
      attempt = 0
      status.value = 'connected'
      stopHeartbeat()
      heartbeatTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping')
      }, HEARTBEAT_MS)
    }

    ws.onmessage = (msg: MessageEvent) => {
      const evt = parseInventoryEvent(msg.data)
      if (!evt) return
      lastEvent.value = evt
      listeners.forEach((fn) => {
        try {
          fn(evt)
        } catch (err) {
          console.error('[WS] 订阅者处理异常', err)
        }
      })
    }

    ws.onclose = () => {
      stopHeartbeat()
      if (socket === ws) socket = null
      if (!manualClosed) scheduleReconnect()
    }

    // 出错后浏览器会紧接着触发 onclose，由 onclose 统一负责重连
    ws.onerror = () => {
      ws.close()
    }
  }

  /** 按退避策略安排下一次重连 */
  function scheduleReconnect() {
    if (reconnectTimer) return
    status.value = 'reconnecting'
    const delay = getBackoffDelay(attempt)
    attempt++
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect()
    }, delay)
  }

  /** 主动断开（不再重连） */
  function disconnect() {
    manualClosed = true
    stopHeartbeat()
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    socket?.close()
    socket = null
  }

  /** 订阅库存事件，返回取消订阅函数 */
  function onInventory(fn: InventoryListener): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }

  return { status, lastEvent, connect, disconnect, onInventory }
})
