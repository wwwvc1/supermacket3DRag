/**
 * 通用纯函数工具（无 DOM / Three 依赖，便于单元测试）
 */
import type { Result } from '../types/api'

/** 兼容 outOfStock / isOutOfStock 两种字段名的售罄判断，缺省时按库存兜底 */
export function isOOS(x: { outOfStock?: boolean; isOutOfStock?: boolean; stock?: number | null }): boolean {
  if (typeof x.outOfStock === 'boolean') return x.outOfStock
  if (typeof x.isOutOfStock === 'boolean') return x.isOutOfStock
  return (x.stock ?? 0) <= 0
}

/** 解包后端统一响应：code === 200 返回 data，否则抛出带业务信息的错误 */
export function unwrapResult<T>(res: Result<T>): T {
  if (!res || typeof res.code !== 'number') throw new Error('响应格式异常')
  if (res.code !== 200) throw new Error(res.message || `请求失败 (${res.code})`)
  return res.data
}

/** WebSocket 指数退避重连间隔：1s、2s、5s、10s 封顶 */
export function backoffDelay(attempt: number): number {
  const steps = [1000, 2000, 5000, 10000]
  return steps[Math.min(Math.max(attempt, 0), steps.length - 1)]
}

/** 价格格式化 */
export function formatPrice(v: number | null | undefined): string {
  return `¥${Number(v ?? 0).toFixed(2)}`
}
