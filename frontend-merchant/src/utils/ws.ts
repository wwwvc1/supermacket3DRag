import type { InventoryEvent } from '@/types/api'

/**
 * WebSocket 纯函数工具（无副作用，便于单元测试）
 */

/** 重连退避序列（毫秒）：1s → 2s → 5s → 10s（封顶） */
export const BACKOFF_STEPS = [1000, 2000, 5000, 10000] as const

/** 根据已重试次数计算下一次重连延迟（attempt 从 0 开始） */
export function getBackoffDelay(attempt: number): number {
  if (!Number.isFinite(attempt) || attempt < 0) return BACKOFF_STEPS[0]
  const idx = Math.min(Math.floor(attempt), BACKOFF_STEPS.length - 1)
  return BACKOFF_STEPS[idx]
}

/** 根据页面协议与主机构造 WS 地址（走 Vite 代理，使用相对主机） */
export function buildWsUrl(protocol: string, host: string, path = '/ws/supermarket'): string {
  const scheme = protocol === 'https:' ? 'wss' : 'ws'
  return `${scheme}://${host}${path}`
}

/**
 * 解析服务端推送报文，仅当是合法的 INVENTORY_CHANGED 事件时返回结构化对象
 * - 兼容 isOutOfStock / outOfStock 两种布尔字段命名
 * - 非 JSON、事件类型不符、缺少 productId 时返回 null
 */
export function parseInventoryEvent(raw: unknown): InventoryEvent | null {
  if (typeof raw !== 'string') return null
  let obj: Record<string, unknown>
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    obj = parsed as Record<string, unknown>
  } catch {
    return null
  }
  if (obj.event !== 'INVENTORY_CHANGED') return null
  const productId = Number(obj.productId)
  if (!Number.isFinite(productId)) return null
  const stock = Number(obj.stock ?? 0)
  const oos = obj.isOutOfStock ?? obj.outOfStock
  return {
    event: 'INVENTORY_CHANGED',
    productId,
    productName: String(obj.productName ?? ''),
    stock: Number.isFinite(stock) ? stock : 0,
    isOutOfStock: typeof oos === 'boolean' ? oos : stock <= 0,
    shelfId: obj.shelfId == null ? null : Number(obj.shelfId),
    shelfCode: obj.shelfCode == null ? null : String(obj.shelfCode),
    shelfStatus:
      obj.shelfStatus === 'NORMAL' || obj.shelfStatus === 'OUT_OF_STOCK' ? obj.shelfStatus : null,
    timestamp: Number(obj.timestamp ?? Date.now())
  }
}
