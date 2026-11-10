/**
 * 购物车、订单与用户认证接口（购物车与订单需 JWT）
 */
import { request } from './http'
import type { CartItem, LoginVO, OrderVO, Page } from '../types/api'

export const login = (username: string, password: string) =>
  request<LoginVO>({ url: '/api/auth/login', method: 'POST', data: { username, password } })

export const register = (username: string, password: string, phone?: string) =>
  request<void>({ url: '/api/auth/register', method: 'POST', data: { username, password, phone } })

export const addToCart = (productId: number, quantity: number) =>
  request<void>({ url: '/api/cart/add', method: 'POST', data: { productId, quantity } })

export const listCart = () => request<CartItem[]>({ url: '/api/cart/list', method: 'GET' })

export const removeFromCart = (id: number) => request<void>({ url: `/api/cart/${id}`, method: 'DELETE' })

/** 下单（后端 Redisson 分布式锁防超卖） */
export const createOrder = (items: { productId: number; quantity: number }[]) =>
  request<OrderVO>({ url: '/api/order/create', method: 'POST', data: { items } })

export const myOrders = (page = 1, size = 10) =>
  request<Page<OrderVO>>({ url: '/api/order/my-orders', method: 'GET', params: { page, size } })
