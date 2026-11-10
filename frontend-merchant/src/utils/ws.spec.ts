import { describe, expect, it } from 'vitest'
import { buildWsUrl, getBackoffDelay, parseInventoryEvent } from './ws'

describe('getBackoffDelay 退避策略', () => {
  it('按 1s/2s/5s/10s 递增并封顶', () => {
    expect(getBackoffDelay(0)).toBe(1000)
    expect(getBackoffDelay(1)).toBe(2000)
    expect(getBackoffDelay(2)).toBe(5000)
    expect(getBackoffDelay(3)).toBe(10000)
    expect(getBackoffDelay(10)).toBe(10000)
  })
  it('非法输入回退到首档', () => {
    expect(getBackoffDelay(-1)).toBe(1000)
    expect(getBackoffDelay(Number.NaN)).toBe(1000)
  })
})

describe('buildWsUrl 地址构造', () => {
  it('http 使用 ws，https 使用 wss', () => {
    expect(buildWsUrl('http:', 'localhost:5174')).toBe('ws://localhost:5174/ws/supermarket')
    expect(buildWsUrl('https:', 'shop.example.com')).toBe('wss://shop.example.com/ws/supermarket')
  })
})

describe('parseInventoryEvent 报文解析', () => {
  it('解析合法库存事件', () => {
    const e = parseInventoryEvent(
      JSON.stringify({
        event: 'INVENTORY_CHANGED',
        productId: 1,
        productName: '纯牛奶',
        shelfId: 2,
        shelfCode: 'A02',
        shelfStatus: 'OUT_OF_STOCK',
        stock: 0,
        isOutOfStock: true,
        timestamp: 123
      })
    )
    expect(e).toEqual({
      event: 'INVENTORY_CHANGED',
      productId: 1,
      productName: '纯牛奶',
      shelfId: 2,
      shelfCode: 'A02',
      shelfStatus: 'OUT_OF_STOCK',
      stock: 0,
      isOutOfStock: true,
      timestamp: 123
    })
  })
  it('兼容 outOfStock 字段，缺省时按库存推断', () => {
    expect(parseInventoryEvent('{"event":"INVENTORY_CHANGED","productId":3,"stock":5,"outOfStock":true}')?.isOutOfStock).toBe(true)
    expect(parseInventoryEvent('{"event":"INVENTORY_CHANGED","productId":3,"stock":0}')?.isOutOfStock).toBe(true)
    expect(parseInventoryEvent('{"event":"INVENTORY_CHANGED","productId":3,"stock":4}')?.isOutOfStock).toBe(false)
  })
  it('非法报文返回 null', () => {
    expect(parseInventoryEvent('pong')).toBeNull()
    expect(parseInventoryEvent('null')).toBeNull()
    expect(parseInventoryEvent('{"event":"OTHER","productId":1}')).toBeNull()
    expect(parseInventoryEvent('{"event":"INVENTORY_CHANGED"}')).toBeNull()
    expect(parseInventoryEvent(42)).toBeNull()
  })
})
