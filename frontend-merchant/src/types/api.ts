/**
 * 后端接口数据类型定义（与 Java 实体 / DTO / VO 严格对齐）
 */

/** 统一响应包装 Result<T> */
export interface Result<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

/** MyBatis-Plus 分页结果 */
export interface Page<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

/** 商品上下架状态 */
export type ProductStatus = 'ON_SHELF' | 'OFF_SHELF'

/** 货架状态：正常 / 售罄标红 */
export type ShelfStatus = 'NORMAL' | 'OUT_OF_STOCK'

/** 商品实体 */
export interface Product {
  id: number
  shelfId: number | null
  name: string
  category: string
  price: number
  stock: number
  status: ProductStatus
  description: string | null
  createdAt: string
  updatedAt: string
}

/** 货架实体（三维坐标扁平存储，单位：米；rotationY 为弧度） */
export interface Shelf {
  id?: number
  shelfCode: string
  name: string
  zone: string
  positionX: number
  positionY: number
  positionZ: number
  rotationY: number
  cameraTargetX: number
  cameraTargetY: number
  cameraTargetZ: number
  status: ShelfStatus
  createdAt?: string
  updatedAt?: string
}

/** 商户新增 / 编辑商品入参（MerchantProductSaveDTO） */
export interface MerchantProductSave {
  name: string
  shelfId: number | null
  category: string
  price: number
  stock: number
  status: ProductStatus
  description: string
}

/** 知识库文档元数据 */
export interface KnowledgeDocument {
  id: number
  fileName: string
  fileType: string
  fileSize: number
  chunkCount: number
  status: string
  createdAt: string
}

/** WebSocket 库存变动广播事件 */
export interface InventoryEvent {
  event: 'INVENTORY_CHANGED'
  productId: number
  productName: string
  stock: number
  isOutOfStock: boolean
  shelfId: number | null
  shelfCode: string | null
  shelfStatus: ShelfStatus | null
  timestamp: number
}
