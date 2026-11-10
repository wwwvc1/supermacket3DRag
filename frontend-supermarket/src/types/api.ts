/**
 * 后端接口 TypeScript 类型契约
 * 严格对齐 Java 实际 VO/DTO（坐标为扁平字段；boolean isOutOfStock 经 Jackson 序列化后为 outOfStock，
 * 而 WebSocket 报文由 Map 组装，键名为 isOutOfStock，因此两者都声明为可选）。
 */

/** 统一响应包装 Result<T> */
export interface Result<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

/** MyBatis-Plus 分页对象 */
export interface Page<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

export type ProductStatus = 'ON_SHELF' | 'OFF_SHELF'
export type ShelfStatus = 'NORMAL' | 'OUT_OF_STOCK'

/** 商品实体 Product */
export interface Product {
  id: number
  shelfId: number | null
  name: string
  category: string
  price: number
  stock: number
  status: ProductStatus
  description?: string
  createdAt?: string
  updatedAt?: string
}

/** 3D 场景单个货架 SceneShelfVO */
export interface SceneShelf {
  id: number
  shelfCode: string
  name: string
  zone: string
  positionX: number
  positionY: number
  positionZ: number
  /** 绕 Y 轴旋转角（按弧度处理） */
  rotationY: number
  cameraTargetX: number
  cameraTargetY: number
  cameraTargetZ: number
  status: ShelfStatus
  products: Product[]
}

/** 3D 超市全景 SupermarketSceneVO */
export interface SupermarketScene {
  storeName: string
  totalShelves: number
  initialCamera: {
    spawnX: number
    spawnY: number
    spawnZ: number
    lookAtX: number
    lookAtY: number
    lookAtZ: number
  }
  sceneBounds: { minX: number; maxX: number; minZ: number; maxZ: number; height: number }
  shelves: SceneShelf[]
}

/** 货架飞掠所需的空间坐标字段集合（搜索结果与航路点共用） */
export interface SpatialTarget {
  positionX: number | null
  positionY: number | null
  positionZ: number | null
  cameraTargetX: number | null
  cameraTargetY: number | null
  cameraTargetZ: number | null
}

/** 空间检索结果 ProductSpatialVO */
export interface ProductSpatial extends SpatialTarget {
  id: number
  name: string
  category: string
  price: number
  stock: number
  status: ProductStatus
  description?: string
  outOfStock?: boolean
  isOutOfStock?: boolean
  shelfId: number | null
  shelfCode: string | null
  shelfName: string | null
  zone: string | null
}

/** AI 导购航路点 WaypointVO */
export interface Waypoint extends SpatialTarget {
  step: number
  productId: number
  productName: string
  price: number
  stock: number
  outOfStock?: boolean
  isOutOfStock?: boolean
  shelfId: number
  shelfCode: string
  shelfName: string
  zone: string
  guideSpeech: string
}

/** AI 导购路线 GuideRouteResponseVO */
export interface GuideRoute {
  summary: string
  totalStops: number
  waypoints: Waypoint[]
  unmatchedItems: string[]
}

/** WebSocket 库存变动广播报文 */
export interface InventoryEvent {
  event: 'INVENTORY_CHANGED'
  productId: number
  productName: string
  stock: number
  isOutOfStock: boolean
  shelfId: number | null
  shelfCode: string
  shelfStatus: ShelfStatus
  timestamp: number
}

/** 登录响应 LoginVO */
export interface LoginVO {
  token: string
  userId: number
  username: string
}

/** 购物车项 CartItemVO */
export interface CartItem {
  id: number
  productId: number
  productName: string
  price: number
  quantity: number
  subtotal: number
}

/** 订单 OrderVO */
export interface OrderVO {
  id: number
  orderNo: string
  userId: number
  totalAmount: number
  status: string
  createdAt: string
  items: { id: number; productId: number; productName: string; price: number; quantity: number }[]
}

/** RAG 引用溯源 SourceCitationVO */
export interface SourceCitation {
  citationIndex: number
  fileName: string
  fileType: string
  pageNumber: string
  chunkId: string
  similarityScore: number
  contentSnippet: string
}

/** RAG 问答响应 ChatResponseVO */
export interface ChatResponse {
  answer: string
  sources: SourceCitation[]
}
