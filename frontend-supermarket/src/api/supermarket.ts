/**
 * 3D 超市场景、空间检索与 AI 导购接口
 */
import { request } from './http'
import type { ChatResponse, GuideRoute, ProductSpatial, SupermarketScene } from '../types/api'

/** 获取 3D 超市全景场景树 */
export const getScene = () => request<SupermarketScene>({ url: '/api/supermarket/scene', method: 'GET' })

/** 空间定位搜索：返回商品与货架飞掠坐标 */
export const searchSpatial = (keyword: string) =>
  request<ProductSpatial[]>({ url: '/api/supermarket/products/search', method: 'GET', params: { keyword } })

/** AI 导购：解析自由文本清单并规划 3D 巡航航路点 */
export const planRoute = (shoppingListText: string) =>
  request<GuideRoute>({ url: '/api/supermarket/guide/route', method: 'POST', data: { shoppingListText } })

/** RAG 知识库多轮问答（带引用溯源） */
export const ragChat = (sessionId: string, question: string) =>
  request<ChatResponse>({ url: '/api/rag/chat', method: 'POST', data: { sessionId, question } })
