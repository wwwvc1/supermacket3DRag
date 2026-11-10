/**
 * WebSocket 报文解析工具
 */
import type { InventoryEvent } from '../types/api'

/** 解析服务端推送文本，仅接受 INVENTORY_CHANGED 事件，非法报文返回 null */
export function parseInventoryEvent(raw: string): InventoryEvent | null {
  try {
    const data = JSON.parse(raw)
    if (!data || data.event !== 'INVENTORY_CHANGED' || typeof data.productId !== 'number') return null
    const stock = Number(data.stock ?? 0)
    return {
      event: 'INVENTORY_CHANGED',
      productId: data.productId,
      productName: String(data.productName ?? ''),
      stock,
      isOutOfStock: typeof data.isOutOfStock === 'boolean' ? data.isOutOfStock : stock <= 0,
      shelfId: data.shelfId ?? null,
      shelfCode: String(data.shelfCode ?? 'UNASSIGNED'),
      shelfStatus: data.shelfStatus === 'OUT_OF_STOCK' ? 'OUT_OF_STOCK' : 'NORMAL',
      timestamp: Number(data.timestamp ?? Date.now()),
    }
  } catch {
    return null
  }
}

/** 根据当前页面协议与主机推导 WebSocket 地址（走 Vite 代理） */
export function resolveWsUrl(loc: { protocol: string; host: string }): string {
  return `${loc.protocol === 'https:' ? 'wss' : 'ws'}://${loc.host}/ws/supermarket`
}
