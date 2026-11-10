import { describe, expect, it } from 'vitest'
import { backoffDelay, isOOS, unwrapResult } from './common'
import { parseInventoryEvent, resolveWsUrl } from './ws'

describe('isOOS 售罄判断', () => {
  it('优先使用 outOfStock（Jackson 序列化字段）', () => {
    expect(isOOS({ outOfStock: true, stock: 10 })).toBe(true)
  })
  it('兼容 isOutOfStock（WebSocket 报文字段）', () => {
    expect(isOOS({ isOutOfStock: false, stock: 0 })).toBe(false)
  })
  it('缺省时按库存兜底', () => {
    expect(isOOS({ stock: 0 })).toBe(true)
    expect(isOOS({ stock: 3 })).toBe(false)
  })
})

describe('unwrapResult 统一响应解包', () => {
  it('200 返回 data', () => {
    expect(unwrapResult({ code: 200, message: 'ok', data: 1, timestamp: 0 })).toBe(1)
  })
  it('非 200 抛出业务信息', () => {
    expect(() => unwrapResult({ code: 500, message: '库存不足', data: null, timestamp: 0 })).toThrow('库存不足')
  })
})

describe('backoffDelay 退避', () => {
  it('1/2/5/10 秒封顶', () => {
    expect([0, 1, 2, 3, 9].map(backoffDelay)).toEqual([1000, 2000, 5000, 10000, 10000])
  })
})

describe('parseInventoryEvent 报文解析', () => {
  it('解析后端真实报文', () => {
    const e = parseInventoryEvent(
      JSON.stringify({
        event: 'INVENTORY_CHANGED', productId: 2, productName: '耳机', stock: 0, isOutOfStock: true,
        shelfId: 2, shelfCode: 'B01', shelfStatus: 'OUT_OF_STOCK', timestamp: 1,
      }),
    )
    expect(e?.shelfStatus).toBe('OUT_OF_STOCK')
    expect(e?.isOutOfStock).toBe(true)
  })
  it('非法报文返回 null', () => {
    expect(parseInventoryEvent('pong')).toBeNull()
    expect(parseInventoryEvent(JSON.stringify({ event: 'OTHER' }))).toBeNull()
  })
  it('推导 ws 地址', () => {
    expect(resolveWsUrl({ protocol: 'http:', host: 'localhost:5173' })).toBe('ws://localhost:5173/ws/supermarket')
  })
})
