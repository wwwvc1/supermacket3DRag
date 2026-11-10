/**
 * 购物车状态：加购、移除、一键结算下单
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as api from '../api/order'
import type { CartItem } from '../types/api'
import { useUserStore } from './user'
import { useToastStore } from './toast'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const drawerVisible = ref(false)
  const loading = ref(false)

  const count = computed(() => items.value.reduce((s, i) => s + i.quantity, 0))
  const total = computed(() => items.value.reduce((s, i) => s + Number(i.subtotal ?? i.price * i.quantity), 0))

  async function refresh() {
    if (!useUserStore().isLoggedIn) {
      items.value = []
      return
    }
    try {
      items.value = await api.listCart()
    } catch (e) {
      useToastStore().push((e as Error).message, 'error')
    }
  }

  /** 加入购物车（未登录时自动弹出登录框） */
  async function add(productId: number, quantity = 1, name = '商品') {
    if (!useUserStore().requireLogin()) return
    try {
      await api.addToCart(productId, quantity)
      useToastStore().push(`已将「${name}」×${quantity} 加入购物车`, 'success')
      await refresh()
    } catch (e) {
      useToastStore().push((e as Error).message, 'error')
    }
  }

  async function remove(id: number) {
    try {
      await api.removeFromCart(id)
      await refresh()
    } catch (e) {
      useToastStore().push((e as Error).message, 'error')
    }
  }

  /** 一键结算：将购物车全部商品提交为订单，成功后逐项清理购物车 */
  async function checkout() {
    if (!items.value.length || loading.value) return
    loading.value = true
    try {
      const order = await api.createOrder(items.value.map((i) => ({ productId: i.productId, quantity: i.quantity })))
      await Promise.all(items.value.map((i) => api.removeFromCart(i.id).catch(() => undefined)))
      useToastStore().push(`下单成功！订单号 ${order.orderNo}，合计 ¥${Number(order.totalAmount).toFixed(2)}`, 'success', 6000)
      await refresh()
    } catch (e) {
      useToastStore().push(`下单失败：${(e as Error).message}`, 'error', 6000)
    } finally {
      loading.value = false
    }
  }

  return { items, drawerVisible, loading, count, total, refresh, add, remove, checkout }
})
