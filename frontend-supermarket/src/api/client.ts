/**
 * 后端 REST API 统一客户端封装（全链路实时联调 + 支付宝沙箱预接入）
 */
import axios, { type AxiosError } from "axios";
import { safeGetStorage, safeRemoveStorage } from "../lib/storage";
import type {
  AlipayConfigStatusVO,
  AlipayPayCreateVO,
  CartItem,
  ChatResponse,
  EmbeddingProvider,
  GuideRouteResponseVO,
  KnowledgeDocument,
  LoginVO,
  MerchantProductSave,
  OrderVO,
  Page,
  Product,
  ProductSpatial,
  ProductStatus,
  Result,
  SceneShelf,
  SupermarketScene,
} from "../types/domain";

const http = axios.create({
  baseURL: "",
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  const token = safeGetStorage("kora_jwt_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<Result<unknown>>) => {
    const status = error.response?.status;
    if (status === 401 && typeof window !== "undefined") {
      safeRemoveStorage("kora_jwt_token");
      window.dispatchEvent(new CustomEvent("kora:auth-expired"));
    }
    const serverMessage = error.response?.data?.message;
    if (serverMessage) {
      return Promise.reject(new Error(serverMessage));
    }
    return Promise.reject(error);
  }
);

async function unwrap<T>(promise: Promise<{ data: Result<T> }>): Promise<T> {
  const res = await promise;
  if (res.data && typeof res.data.code === "number") {
    if (res.data.code === 200 || res.data.code === 0) {
      return res.data.data;
    }
    throw new Error(res.data.message || "请求失败");
  }
  return (res.data as unknown) as T;
}

export const apiClient = {
  /** 获取全景展区与商品树 */
  getScene: () => unwrap<SupermarketScene>(http.get("/api/supermarket/scene")),

  /** 关键词检索商品 */
  searchSpatial: (keyword: string) =>
    unwrap<ProductSpatial[]>(http.get("/api/supermarket/products/search", { params: { keyword } })),

  /** AI 导购清单解析与 3D 最优路径规划 */
  planGuideRoute: (shoppingListText: string) =>
    unwrap<GuideRouteResponseVO>(http.post("/api/supermarket/guide/route", { shoppingListText }, { timeout: 30000 })),

  /** RAG 知识库多轮问答 */
  ragChat: (sessionId: string, question: string) =>
    unwrap<ChatResponse>(http.post("/api/rag/chat", { sessionId, question }, { timeout: 30000 })),

  /** 上传知识库文档 */
  uploadDocument: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return unwrap<KnowledgeDocument>(http.post("/api/rag/upload", form, { timeout: 120000 }));
  },

  /** 获取已入库文档列表 */
  listDocuments: () => unwrap<KnowledgeDocument[]>(http.get("/api/rag/documents")),

  /** 切换本地/云端 Embedding 引擎 */
  switchEmbedding: (provider: EmbeddingProvider) =>
    unwrap<string>(http.post("/api/rag/embedding/switch", null, { params: { provider } })),

  /** 用户登录 */
  login: (username: string, password: string) =>
    unwrap<LoginVO>(http.post("/api/auth/login", { username, password })),

  /** 用户注册 */
  register: (username: string, password: string, phone?: string) =>
    unwrap<void>(http.post("/api/auth/register", { username, password, phone })),

  /** 校验当前 Token 并获取登录身份 */
  getCurrentUser: () =>
    unwrap<{ userId: number; username: string }>(http.get("/api/auth/me")),

  /** 加入购物袋 */
  addToCart: (productId: number, quantity: number) =>
    unwrap<void>(http.post("/api/cart/add", { productId, quantity })),

  /** 获取购物袋列表 */
  listCart: () => unwrap<CartItem[]>(http.get("/api/cart/list")),

  /** 移除购物袋项 */
  removeFromCart: (id: number) => unwrap<void>(http.delete(`/api/cart/${id}`)),

  /** 结算创建订单（Redisson 分布式锁防超卖，返回 PENDING 待支付订单） */
  createOrder: (items: { productId: number; quantity: number }[]) =>
    unwrap<OrderVO>(http.post("/api/order/create", { items })),

  /** 分页查询我的订单 */
  listMyOrders: (page = 1, size = 20) =>
    unwrap<Page<OrderVO>>(http.get("/api/order/my-orders", { params: { page, size } })),

  /** 查询单个订单详情 */
  getOrderDetail: (orderNo: string) =>
    unwrap<OrderVO>(http.get(`/api/order/${encodeURIComponent(orderNo)}`)),

  /** 取消待支付订单（Redisson 锁保护回滚库存） */
  cancelOrder: (orderNo: string) =>
    unwrap<OrderVO>(http.post(`/api/order/${encodeURIComponent(orderNo)}/cancel`)),

  /** 获取支付宝沙箱预接入配置状态 */
  getAlipayConfigStatus: () =>
    unwrap<AlipayConfigStatusVO>(http.get("/api/payment/alipay/config-status")),

  /** 发起支付宝沙箱收银台支付 */
  createAlipayOrder: (orderNo: string) =>
    unwrap<AlipayPayCreateVO>(http.post("/api/payment/alipay/create", { orderNo })),

  /** 支付宝沙箱预演一键确认支付 (PENDING -> PAID) */
  sandboxConfirmPay: (orderNo: string) =>
    unwrap<OrderVO>(http.post("/api/payment/alipay/sandbox-confirm", { orderNo })),

  /** 轮询查询订单支付状态 */
  queryPaymentStatus: (orderNo: string) =>
    unwrap<OrderVO>(http.get(`/api/payment/orders/${encodeURIComponent(orderNo)}`)),

  /** 商户端查询商品分页 */
  listMerchantProducts: (page = 1, size = 50, keyword?: string, status?: ProductStatus | "") =>
    unwrap<Page<Product>>(
      http.get("/api/merchant/products", {
        params: { page, size, keyword: keyword || undefined, status: status || undefined },
      })
    ),

  /** 商户端新建商品 */
  createMerchantProduct: (data: MerchantProductSave) =>
    unwrap<Product>(http.post("/api/merchant/products", data)),

  /** 商户端快速修改库存（自动触发全局 WebSocket 广播） */
  updateMerchantStock: (id: number, stock: number) =>
    unwrap<void>(http.put(`/api/merchant/products/${id}/stock`, null, { params: { stock } })),

  /** 商户端切换上下架 */
  updateMerchantStatus: (id: number, status: ProductStatus) =>
    unwrap<void>(http.put(`/api/merchant/products/${id}/status`, null, { params: { status } })),

  /** 商户端查询全部展区坐标 */
  listMerchantShelves: () => unwrap<SceneShelf[]>(http.get("/api/merchant/shelves")),
};
