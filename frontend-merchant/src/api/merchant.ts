import { request } from './http'
import type { MerchantProductSave, Page, Product, ProductStatus, Shelf } from '@/types/api'

/** 商户端商品分页查询（支持关键字与上下架状态筛选） */
export function listProducts(page: number, size: number, keyword?: string, status?: ProductStatus | '') {
  return request<Page<Product>>({
    url: '/api/merchant/products',
    method: 'get',
    params: {
      page,
      size,
      keyword: keyword || undefined,
      status: status || undefined
    }
  })
}

/** 新增商品 */
export function createProduct(data: MerchantProductSave) {
  return request<Product>({ url: '/api/merchant/products', method: 'post', data })
}

/** 编辑商品 */
export function updateProduct(id: number, data: MerchantProductSave) {
  return request<Product>({ url: `/api/merchant/products/${id}`, method: 'put', data })
}

/** 切换上下架状态（注意：status 为 query 参数） */
export function updateStatus(id: number, status: ProductStatus) {
  return request<void>({ url: `/api/merchant/products/${id}/status`, method: 'put', params: { status } })
}

/** 快速修改库存（注意：stock 为 query 参数），后端会广播 WS 事件 */
export function updateStock(id: number, stock: number) {
  return request<void>({ url: `/api/merchant/products/${id}/stock`, method: 'put', params: { stock } })
}

/** 查询全部货架点位 */
export function listShelves() {
  return request<Shelf[]>({ url: '/api/merchant/shelves', method: 'get' })
}

/** 保存货架（携带 id 为更新，否则新增） */
export function saveShelf(data: Shelf) {
  return request<Shelf>({ url: '/api/merchant/shelves', method: 'post', data })
}
