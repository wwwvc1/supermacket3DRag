/**
 * KORA × TACTILE ARCHIVE 领域模型与后端 API 类型契约
 * 对齐 Spring Boot 后端 Result<T>、Product、SceneShelf、InventoryEvent、CartItem、ChatResponse 等结构
 */

export type GarmentKind = "tee" | "knit" | "hoodie" | "shirt" | "jacket" | "coat";

export type ProductStatus = "ON_SHELF" | "OFF_SHELF";
export type ShelfStatus = "NORMAL" | "OUT_OF_STOCK";
export type EmbeddingProvider = "local" | "online";

/** 统一 API 响应包装 Result<T> */
export interface Result<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

/** MyBatis-Plus 分页结构 */
export interface Page<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

/** 后端商品实体 */
export interface Product {
  id: number;
  shelfId: number | null;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  description?: string;
  imageUrl?: string | null;
  backImageUrl?: string | null;
  sideImageUrl?: string | null;
  showroomStage?: "STAGE_RAIL" | "STAGE_TECH" | "STAGE_VITRINE" | "STORE_GENERAL" | string | null;
  colorHex?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** 商户商品新建/编辑入参 */
export interface MerchantProductSave {
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  shelfId: number | null;
  description?: string;
  imageUrl?: string;
  backImageUrl?: string;
  sideImageUrl?: string;
  showroomStage?: string;
  colorHex?: string;
}

/** 3D 展区/货架实体 SceneShelf */
export interface SceneShelf {
  id: number;
  shelfCode: string;
  name: string;
  zone: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationY: number;
  cameraTargetX: number;
  cameraTargetY: number;
  cameraTargetZ: number;
  status: ShelfStatus;
  products: Product[];
}

/** 全景数据 SupermarketSceneVO */
export interface SupermarketScene {
  storeName: string;
  totalShelves: number;
  initialCamera: {
    spawnX: number;
    spawnY: number;
    spawnZ: number;
    lookAtX: number;
    lookAtY: number;
    lookAtZ: number;
  };
  sceneBounds: { minX: number; maxX: number; minZ: number; maxZ: number; height: number };
  shelves: SceneShelf[];
}

/** 空间商品检索结果 ProductSpatialVO */
export interface ProductSpatial {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  description?: string;
  outOfStock?: boolean;
  isOutOfStock?: boolean;
  shelfId: number | null;
  shelfCode: string | null;
  shelfName: string | null;
  zone: string | null;
  positionX: number | null;
  positionY: number | null;
  positionZ: number | null;
  cameraTargetX: number | null;
  cameraTargetY: number | null;
  cameraTargetZ: number | null;
}

/** WebSocket 实时库存广播报文 */
export interface InventoryEvent {
  event: "INVENTORY_CHANGED";
  productId: number;
  productName: string;
  stock: number;
  isOutOfStock: boolean;
  shelfId: number | null;
  shelfCode: string;
  shelfStatus: ShelfStatus;
  timestamp: number;
}

/** 登录响应 */
export interface LoginVO {
  token: string;
  userId: number;
  username: string;
}

/** 购物袋项 */
export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

/** 订单实体 */
export interface OrderVO {
  id: number;
  orderNo: string;
  userId: number;
  totalAmount: number;
  status: "PENDING" | "PAID" | "CANCELLED" | string;
  paymentMethod?: string | null;
  tradeNo?: string | null;
  paidAt?: string | null;
  paySubject?: string | null;
  createdAt: string;
  items: { id: number; productId: number; productName: string; price: number; quantity: number }[];
}

/** 支付宝沙箱配置就绪状态 */
export interface AlipayConfigStatusVO {
  enabled: boolean;
  configured: boolean;
  sandboxSimulationEnabled: boolean;
  mode: "ALIPAY_SANDBOX" | "SANDBOX_SIMULATION" | string;
  gatewayUrl: string;
  signType: string;
}

/** 支付宝沙箱收银台创建响应 */
export interface AlipayPayCreateVO {
  orderNo: string;
  subject: string;
  totalAmount: number;
  mode: "ALIPAY_SANDBOX" | "SANDBOX_SIMULATION" | string;
  configured: boolean;
  gatewayUrl: string;
  payFormHtml?: string | null;
  notifyUrl: string;
  returnUrl: string;
  message: string;
}

/** AI 导购空间航路点 */
export interface WaypointVO {
  step: number;
  productId: number;
  productName: string;
  price: number;
  stock: number;
  outOfStock: boolean;
  shelfId: number | null;
  shelfCode: string;
  shelfName: string;
  zone: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  cameraTargetX: number;
  cameraTargetY: number;
  cameraTargetZ: number;
  guideSpeech: string;
}

/** AI 导购空间巡航路线规划响应 */
export interface GuideRouteResponseVO {
  summary: string;
  totalStops: number;
  waypoints: WaypointVO[];
  unmatchedItems: string[];
}

/** RAG 知识库精准溯源引用 */
export interface SourceCitation {
  citationIndex: number;
  fileName: string;
  fileType: string;
  pageNumber: string;
  chunkId: string;
  similarityScore: number;
  contentSnippet: string;
}

/** RAG 多轮对话响应 */
export interface ChatResponse {
  answer: string;
  sources: SourceCitation[];
}

/** 知识库已上传文档 */
export interface KnowledgeDocument {
  id?: number;
  fileName: string;
  fileType: string;
  chunkCount?: number;
  createdAt?: string;
}

/** 3D 物理滑轨单品模型（兼容 ClothingRailHero 并扩展电商字段） */
export interface RailGarmentItem {
  id: string;
  /** Accessible name, caption and detail title. */
  name: string;
  description?: string;
  /** Built-in illustration, used when no image is supplied. */
  kind?: GarmentKind;
  /** Fabric colour of the illustration (any CSS colour). */
  color?: string;
  /** Trim colour for ribs, cords and buttons. */
  trim?: string;
  /** Front photo. */
  image?: string;
  /** Back photo; the front photo is reused when omitted. */
  backImage?: string;
  /** Side-on photo shown while the piece rests on the rail. */
  sideImage?: string;
  /** Short hang-tag text such as a price or a size. */
  tag?: string;
  /** Short facts listed in the detail view. */
  details?: string[];
  /** 关联后端商品 ID */
  productId?: number;
  /** 商品单价 */
  price?: number;
  /** 实时库存 */
  stock?: number;
  /** 是否已售罄 */
  outOfStock?: boolean;
  /** 所属展区编码 */
  shelfCode?: string;
  /** 所属分区名称 */
  zone?: string;
}

/** 滑轨展陈系列 */
export interface RailCollection {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  accentColor: string;
  items: RailGarmentItem[];
}
