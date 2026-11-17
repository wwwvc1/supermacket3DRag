/**
 * KORA × TACTILE ARCHIVE 六幕式 3D 触感物理陈列旗舰店根组件 (App.tsx)
 * - Scene 01 (0): OPTICAL PORTAL — 21st.dev 45° 光栅色散冲击波序幕
 * - Scene 02 (1): GARMENT RAIL — 高定服饰金属悬架滑轨展厅 (productId 101..110)
 * - Scene 03 (2): TECH TABLE — 旗舰数码 WebGL2 广角畸变转盘展厅 (productId 201..205)
 * - Scene 04 (3): VITRINE GALLERY — 精品器物博物馆玻璃防尘钟罩展柜厅 (productId 301..306)
 * - Scene 05 (4): NEURAL ATELIER — Kora 液态虹彩流光噪波球体 RAG 顾问 & AI 3D 导购舱
 * - Scene 06 (5): STUDIO CONSOLE — Kora 极简商户与三大展厅实时库存调控中枢
 * - 全链路后端实时联调 + 支付宝沙箱预接入收银台
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RAIL_DEMO_ITEMS, type RailGarment } from "@/components/ui/product-rail-gallery";
import { TECH_TABLE_DEMO_ITEMS } from "@/components/ui/tech-table-gallery";
import { VITRINE_DEMO_ITEMS } from "@/components/ui/vitrine-pedestal-gallery";
import { apiClient } from "./api/client";
import { EditorialChrome, type BagEntry } from "./components/chrome/EditorialChrome";
import { MagneticCursor } from "./components/chrome/MagneticCursor";
import { NeuralAtelierScene } from "./components/scenes/NeuralAtelierScene";
import { OpticalPortalScene } from "./components/scenes/OpticalPortalScene";
import { StudioConsoleScene } from "./components/scenes/StudioConsoleScene";
import {
  TactileArchiveScene,
  type ShowroomStageMode,
} from "./components/scenes/TactileArchiveScene";
import { WebGLStage } from "./components/stage/WebGLStage";
import { Observer, useGSAP } from "./lib/gsap";
import { shouldIgnoreSceneWheel } from "./lib/observer-guard";
import {
  applyInventoryEventToCollections,
  buildAllShowroomCollections,
} from "./lib/rail-adapter";
import { safeGetStorage, safeRemoveStorage, safeSetStorage } from "./lib/storage";
import type {
  AlipayConfigStatusVO,
  AlipayPayCreateVO,
  InventoryEvent,
  OrderVO,
  RailCollection,
  RailGarmentItem,
  SupermarketScene,
} from "./types/domain";

export default function App(): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [activeScene, setActiveScene] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [collections, setCollections] = useState<RailCollection[]>(() =>
    buildAllShowroomCollections(RAIL_DEMO_ITEMS, TECH_TABLE_DEMO_ITEMS, VITRINE_DEMO_ITEMS, null)
  );
  const [activeCollectionId, setActiveCollectionId] = useState<string>("atelier-01");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // 展厅 3D 聚光灯追光状态
  const [spotlightX, setSpotlightX] = useState<number>(0);
  const [spotlightColor, setSpotlightColor] = useState<string>("#C8C3F2");
  const [detailOpen, setDetailOpen] = useState<boolean>(false);

  // 第 05 幕液态球体湍流状态
  const [oracleActive, setOracleActive] = useState<boolean>(false);

  // 购物袋、订单、支付宝沙箱收银台与认证状态
  const [bag, setBag] = useState<BagEntry[]>([]);
  const [bagOpen, setBagOpen] = useState<boolean>(false);
  const [bagTab, setBagTab] = useState<"bag" | "orders">("bag");
  const [checkingOut, setCheckingOut] = useState<boolean>(false);
  const [orders, setOrders] = useState<OrderVO[]>([]);
  const [alipayStatus, setAlipayStatus] = useState<AlipayConfigStatusVO | null>(null);
  const [activePayOrder, setActivePayOrder] = useState<AlipayPayCreateVO | null>(null);
  const [payingOrderNo, setPayingOrderNo] = useState<string | null>(null);

  const [authOpen, setAuthOpen] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);

  const transitionLockRef = useRef<number>(0);
  const hasOverlayOpen = detailOpen || bagOpen || authOpen;

  const pushNotice = useCallback((msg: string) => {
    setLiveNotice(msg);
    window.setTimeout(() => {
      setLiveNotice((curr) => (curr === msg ? null : curr));
    }, 4200);
  }, []);

  const allItems = useMemo(
    () => collections.flatMap((c) => c.items),
    [collections]
  );

  /** 从后端拉取全量 3D 展厅货架与商品实时数据 */
  const refreshScene = useCallback(async (): Promise<RailCollection[] | null> => {
    try {
      const scene: SupermarketScene = await apiClient.getScene();
      if (scene) {
        const nextCols = buildAllShowroomCollections(
          RAIL_DEMO_ITEMS,
          TECH_TABLE_DEMO_ITEMS,
          VITRINE_DEMO_ITEMS,
          scene
        );
        setCollections(nextCols);
        return nextCols;
      }
    } catch {
      // 保留当前或本地兜底展陈
    }
    return null;
  }, []);

  /** 从后端同步当前用户的持久化购物车与历史订单列表 */
  const syncUserCommerceData = useCallback(
    async (catalogItems: RailGarmentItem[]) => {
      try {
        const [cartList, orderPage] = await Promise.all([
          apiClient.listCart(),
          apiClient.listMyOrders(1, 20),
        ]);
        const mappedBag: BagEntry[] = cartList.map((ci) => {
          const matched = catalogItems.find((it) => it.productId === ci.productId);
          return {
            cartItemId: ci.id,
            quantity: ci.quantity,
            item: matched ?? {
              id: `store-product-${ci.productId}`,
              productId: ci.productId,
              name: ci.productName,
              price: Number(ci.price) || 0,
              tag: `¥${Number(ci.price).toFixed(2)}`,
            },
          };
        });
        setBag(mappedBag);
        setOrders(orderPage.records ?? []);
      } catch {
        // 若 token 失效，拦截器将抛出 401 事件
      }
    },
    []
  );

  // 1. 启动时拉取全景展厅、支付宝沙箱就绪状态，并在存在有效 JWT 时自动恢复会话
  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const syncedCols = await refreshScene();
      apiClient
        .getAlipayConfigStatus()
        .then((st) => {
          if (mounted) setAlipayStatus(st);
        })
        .catch(() => {});

      const existingToken = safeGetStorage("kora_jwt_token");
      if (existingToken) {
        try {
          const me = await apiClient.getCurrentUser();
          if (mounted && me?.username) {
            setUsername(me.username);
            const catalog = (syncedCols ??
              buildAllShowroomCollections(
                RAIL_DEMO_ITEMS,
                TECH_TABLE_DEMO_ITEMS,
                VITRINE_DEMO_ITEMS,
                null
              )
            ).flatMap((c) => c.items);
            await syncUserCommerceData(catalog);
          }
        } catch {
          safeRemoveStorage("kora_jwt_token");
        }
      }
    };

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [refreshScene, syncUserCommerceData]);

  // 1.1 监听 JWT 过期事件与支付宝沙箱回跳参数
  useEffect(() => {
    const onExpired = () => {
      setUsername(null);
      setOrders([]);
      setActivePayOrder(null);
      pushNotice("登录凭证已过期，请重新登录");
    };
    window.addEventListener("kora:auth-expired", onExpired);

    const params = new URLSearchParams(window.location.search);
    const outTradeNo = params.get("out_trade_no");
    const payStatus = params.get("pay_status");
    if (outTradeNo || payStatus === "success") {
      setBagTab("orders");
      setBagOpen(true);
      if (outTradeNo) {
        apiClient
          .queryPaymentStatus(outTradeNo)
          .then((ord) => {
            pushNotice(`支付宝沙箱回跳：订单 ${ord.orderNo} 当前状态 ${ord.status}`);
            syncUserCommerceData(allItems);
          })
          .catch(() => {});
      }
    }
    return () => window.removeEventListener("kora:auth-expired", onExpired);
  }, [allItems, pushNotice, syncUserCommerceData]);

  // 2. 建立 WebSocket (/ws/supermarket) 实时库存监听
  useEffect(() => {
    if (typeof window === "undefined" || typeof WebSocket === "undefined") return;
    if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) return;

    let ws: WebSocket | null = null;
    let reconnectTimer = 0;

    const connect = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        ws = new WebSocket(`${protocol}//${window.location.host}/ws/supermarket`);
        ws.onopen = () => setWsConnected(true);
        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimer = window.setTimeout(connect, 5000);
        };
        ws.onerror = () => ws?.close();
        ws.onmessage = (ev) => {
          try {
            const payload = JSON.parse(ev.data) as InventoryEvent;
            if (payload && payload.event === "INVENTORY_CHANGED") {
              setCollections((prev) => applyInventoryEventToCollections(prev, payload));
              pushNotice(
                `LIVE SYNC · ${payload.productName} → ${
                  payload.isOutOfStock || payload.stock <= 0 ? "SOLD OUT" : `${payload.stock} PCS`
                }`
              );
            }
          } catch {
            // 忽略非 JSON 心跳帧
          }
        };
      } catch {
        setWsConnected(false);
      }
    };

    connect();
    return () => {
      window.clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [pushNotice]);

  // 3. GSAP Observer 滚轮切幕控制（0..5 六幕）
  useGSAP(
    () => {
      if (typeof window === "undefined") return;
      const stepScene = (dir: 1 | -1, event?: Event) => {
        if (shouldIgnoreSceneWheel(event?.target ?? null, hasOverlayOpen)) return;
        const now = performance.now();
        if (now < transitionLockRef.current) return;
        transitionLockRef.current = now + 750;
        setActiveScene(
          (prev) => Math.max(0, Math.min(5, prev + dir)) as 0 | 1 | 2 | 3 | 4 | 5
        );
      };

      let obs: { kill?: () => void } | null = null;
      try {
        obs = Observer.create({
          target: window,
          type: "wheel",
          tolerance: 45,
          onDown: (self) => stepScene(1, self.event),
          onUp: (self) => stepScene(-1, self.event),
        });
      } catch {
        // 兼容受限环境
      }
      return () => obs?.kill?.();
    },
    { scope: rootRef, dependencies: [hasOverlayOpen] }
  );

  const handleActiveItemChange = useCallback(
    (item: RailGarment | null, normX: number) => {
      setSpotlightX(normX);
      if (item?.outOfStock) {
        setSpotlightColor("#FF2A54");
      } else if (item?.color && item.color.startsWith("#")) {
        setSpotlightColor(item.color);
      } else {
        setSpotlightColor("#C8C3F2");
      }
    },
    []
  );

  const handleAddToBag = useCallback(
    async (item: RailGarmentItem, quantity: number) => {
      if (username && item.productId) {
        try {
          await apiClient.addToCart(item.productId, quantity);
          await syncUserCommerceData(allItems);
          pushNotice(`已加入云端购物袋 · ${item.name} × ${quantity}`);
          return;
        } catch (err) {
          pushNotice(err instanceof Error ? err.message : "加入购物车失败");
          return;
        }
      }

      setBag((prev) => {
        const idx = prev.findIndex((b) => b.item.id === item.id);
        if (idx >= 0) {
          const next = [...prev];
          const existing = next[idx]!;
          next[idx] = { ...existing, quantity: existing.quantity + quantity };
          return next;
        }
        return [...prev, { item, quantity }];
      });
      pushNotice(`ADDED TO ARCHIVE BAG · ${item.name} × ${quantity}`);
    },
    [allItems, pushNotice, syncUserCommerceData, username]
  );

  const handleRemoveBagItem = useCallback(
    async (entry: BagEntry) => {
      if (username && entry.cartItemId) {
        try {
          await apiClient.removeFromCart(entry.cartItemId);
          await syncUserCommerceData(allItems);
          pushNotice(`已移除商品 · ${entry.item.name}`);
          return;
        } catch (err) {
          pushNotice(err instanceof Error ? err.message : "移除购物车失败");
          return;
        }
      }
      setBag((prev) => prev.filter((b) => b.item.id !== entry.item.id));
    },
    [allItems, pushNotice, syncUserCommerceData, username]
  );

  const handleStartOrderPay = useCallback(
    async (orderNo: string) => {
      try {
        const payVO = await apiClient.createAlipayOrder(orderNo);
        setActivePayOrder(payVO);
        setBagTab("orders");
        setBagOpen(true);
      } catch (err) {
        pushNotice(err instanceof Error ? err.message : "发起支付宝沙箱收银台失败");
      }
    },
    [pushNotice]
  );

  const handleConfirmSandboxPay = useCallback(
    async (orderNo: string) => {
      setPayingOrderNo(orderNo);
      try {
        const updatedOrder = await apiClient.sandboxConfirmPay(orderNo);
        setOrders((prev) => prev.map((o) => (o.orderNo === orderNo ? updatedOrder : o)));
        setActivePayOrder(null);
        await syncUserCommerceData(allItems);
        pushNotice(`支付完成 · 订单 ${updatedOrder.orderNo} (${updatedOrder.tradeNo})`);
      } catch (err) {
        pushNotice(err instanceof Error ? err.message : "沙箱确认付款失败");
      } finally {
        setPayingOrderNo(null);
      }
    },
    [allItems, pushNotice, syncUserCommerceData]
  );

  const handleCancelOrder = useCallback(
    async (orderNo: string) => {
      try {
        const cancelled = await apiClient.cancelOrder(orderNo);
        setOrders((prev) => prev.map((o) => (o.orderNo === orderNo ? cancelled : o)));
        if (activePayOrder?.orderNo === orderNo) {
          setActivePayOrder(null);
        }
        await refreshScene();
        pushNotice(`订单 ${orderNo} 已取消，Redisson 锁已释放商品库存`);
      } catch (err) {
        pushNotice(err instanceof Error ? err.message : "取消订单失败");
      }
    },
    [activePayOrder, pushNotice, refreshScene]
  );

  const handleCheckout = useCallback(async () => {
    if (bag.length === 0) return;
    if (!username) {
      setAuthOpen(true);
      pushNotice("请先登录账号，再提交订单并唤醒支付宝沙箱收银台");
      return;
    }

    setCheckingOut(true);
    try {
      const orderItems = bag.map((b, i) => ({
        productId: b.item.productId ?? 101 + i,
        quantity: b.quantity,
      }));
      const createdOrder = await apiClient.createOrder(orderItems);
      await Promise.all([syncUserCommerceData(allItems), refreshScene()]);
      pushNotice(`订单 [${createdOrder.orderNo}] 创建成功，Redisson 已锁定扣减库存`);
      await handleStartOrderPay(createdOrder.orderNo);
    } catch (err) {
      pushNotice(err instanceof Error ? err.message : "下单失败，请检查库存或登录状态");
    } finally {
      setCheckingOut(false);
    }
  }, [
    allItems,
    bag,
    handleStartOrderPay,
    pushNotice,
    refreshScene,
    syncUserCommerceData,
    username,
  ]);

  const handleAuthSubmit = useCallback(
    async (mode: "login" | "register", user: string, pass: string, phone?: string) => {
      if (mode === "register") {
        await apiClient.register(user, pass, phone);
      }
      const res = await apiClient.login(user, pass);
      safeSetStorage("kora_jwt_token", res.token);
      setUsername(res.username);

      // 若访客状态下预先加购了商品，登录后立即同步到后端持久化购物车
      if (bag.length > 0) {
        for (const entry of bag) {
          if (entry.item.productId && !entry.cartItemId) {
            try {
              await apiClient.addToCart(entry.item.productId, entry.quantity);
            } catch {
              // 忽略个别库存已满的离线项
            }
          }
        }
      }

      await syncUserCommerceData(allItems);
      setAuthOpen(false);
      pushNotice(`AUTHENTICATED · 欢迎回来 ${res.username.toUpperCase()}`);
    },
    [allItems, bag, pushNotice, syncUserCommerceData]
  );

  const handleLogout = useCallback(() => {
    safeRemoveStorage("kora_jwt_token");
    setUsername(null);
    setOrders([]);
    setBag([]);
    setActivePayOrder(null);
    pushNotice("已安全退出当前账户");
  }, [pushNotice]);

  const handleQuickJumpItem = useCallback(
    (targetItem: RailGarmentItem) => {
      const ownerCol = collections.find((c) =>
        c.items.some((i) => i.id === targetItem.id || i.productId === targetItem.productId)
      );
      setSelectedItemId(targetItem.id);
      if (ownerCol?.id === "tech-table-02") {
        setActiveScene(2);
      } else if (ownerCol?.id === "vitrine-gallery-03") {
        setActiveScene(3);
      } else {
        if (ownerCol) setActiveCollectionId(ownerCol.id);
        setActiveScene(1);
      }
    },
    [collections]
  );

  const handleJumpToProductId = useCallback(
    (productId: number) => {
      const found = allItems.find((it) => it.productId === productId);
      if (found) {
        handleQuickJumpItem(found);
      } else {
        pushNotice(`未在当前展厅目录定位商品 #${productId}`);
      }
    },
    [allItems, handleQuickJumpItem, pushNotice]
  );

  const stageMode: ShowroomStageMode =
    activeScene === 2 ? "tech" : activeScene === 3 ? "vitrine" : "rail";

  const handleStageModeChange = useCallback((mode: ShowroomStageMode) => {
    if (mode === "rail") {
      setSpotlightColor("#C8C3F2");
      setActiveScene(1);
    } else if (mode === "tech") {
      setSpotlightColor("#00F0FF");
      setActiveScene(2);
    } else {
      setSpotlightColor("#A8E6CF");
      setActiveScene(3);
    }
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative h-svh w-screen overflow-hidden bg-black font-sans text-white select-none"
    >
      {/* 底层单实例持久化 WebGL 舞台 */}
      <WebGLStage
        activeScene={activeScene}
        spotlightX={spotlightX}
        spotlightColor={spotlightColor}
        oracleActive={oracleActive}
      />

      {/* 顶部与底部 Kora 极简 Chrome（含 01–06 六幕时间轴圆点、购物袋、订单与支付宝沙箱收银台） */}
      <EditorialChrome
        activeScene={activeScene}
        onSelectScene={setActiveScene}
        bag={bag}
        bagOpen={bagOpen}
        onBagOpenChange={setBagOpen}
        bagTab={bagTab}
        onBagTabChange={setBagTab}
        onRemoveBagItem={handleRemoveBagItem}
        onCheckout={handleCheckout}
        checkingOut={checkingOut}
        orders={orders}
        activePayOrder={activePayOrder}
        alipayStatus={alipayStatus}
        payingOrderNo={payingOrderNo}
        onStartOrderPay={handleStartOrderPay}
        onConfirmSandboxPay={handleConfirmSandboxPay}
        onCancelOrder={handleCancelOrder}
        onDismissPayCashier={() => setActivePayOrder(null)}
        username={username}
        authOpen={authOpen}
        onAuthOpenChange={setAuthOpen}
        onAuthSubmit={handleAuthSubmit}
        onLogout={handleLogout}
        wsConnected={wsConnected}
        allItems={allItems}
        onQuickJumpItem={handleQuickJumpItem}
        liveNotice={liveNotice}
      />

      {/* 六幕核心视图层 */}
      <main className="relative z-10 h-full w-full">
        <OpticalPortalScene
          active={activeScene === 0}
          onExplore={() => setActiveScene(1)}
          onOpenOracle={() => setActiveScene(4)}
        />
        <TactileArchiveScene
          active={activeScene === 1 || activeScene === 2 || activeScene === 3}
          stageMode={stageMode}
          onStageModeChange={handleStageModeChange}
          collections={collections}
          activeCollectionId={activeCollectionId}
          selectedItemId={selectedItemId}
          onSelectCollection={setActiveCollectionId}
          onActiveItemChange={handleActiveItemChange}
          onDetailOpenChange={setDetailOpen}
          onAddToBag={handleAddToBag}
        />
        <NeuralAtelierScene
          active={activeScene === 4}
          onOracleBusyChange={setOracleActive}
          onJumpToProductId={handleJumpToProductId}
        />
        <StudioConsoleScene
          active={activeScene === 5}
          collections={collections}
          onLocalInventoryChange={(ev) =>
            setCollections((prev) => applyInventoryEventToCollections(prev, ev))
          }
          onRefreshScene={refreshScene}
          onNotify={pushNotice}
        />
      </main>

      {/* 顶层 60fps 磁性光标 */}
      <MagneticCursor />
    </div>
  );
}
