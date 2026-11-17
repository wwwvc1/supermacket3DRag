/**
 * Kora 全局极简编辑风 Chrome (EditorialChrome)
 * - 顶部：居中 kora 字标 + 空间快搜 + [ACCOUNT / LOGOUT] + [BAG (N)]
 * - 底部：左侧 01–06 六幕时间轴圆点 + 右侧 WebSocket 实时状态微标
 * - 侧边抽屉：真实购物车 / 订单中心 / 支付宝沙箱预接入收银台
 * - 认证弹窗：支持真实后端登录与新用户注册 (/api/auth/login & /api/auth/register)
 */
import React, { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2, CreditCard, LogOut, ReceiptText, Search, ShieldCheck, Trash2, X, Zap } from "lucide-react";
import GlassButton from "@/components/ui/glass-button";
import type {
  AlipayConfigStatusVO,
  AlipayPayCreateVO,
  OrderVO,
  RailGarmentItem,
} from "../../types/domain";

export interface BagEntry {
  cartItemId?: number;
  item: RailGarmentItem;
  quantity: number;
}

export interface EditorialChromeProps {
  activeScene: 0 | 1 | 2 | 3 | 4 | 5;
  onSelectScene: (scene: 0 | 1 | 2 | 3 | 4 | 5) => void;
  bag: BagEntry[];
  bagOpen: boolean;
  onBagOpenChange: (open: boolean) => void;
  bagTab: "bag" | "orders";
  onBagTabChange: (tab: "bag" | "orders") => void;
  onRemoveBagItem: (entry: BagEntry) => void;
  onCheckout: () => Promise<void> | void;
  checkingOut: boolean;
  orders: OrderVO[];
  activePayOrder: AlipayPayCreateVO | null;
  alipayStatus: AlipayConfigStatusVO | null;
  payingOrderNo: string | null;
  onStartOrderPay: (orderNo: string) => Promise<void>;
  onConfirmSandboxPay: (orderNo: string) => Promise<void>;
  onCancelOrder: (orderNo: string) => Promise<void>;
  onDismissPayCashier: () => void;
  username: string | null;
  authOpen: boolean;
  onAuthOpenChange: (open: boolean) => void;
  onAuthSubmit: (mode: "login" | "register", username: string, password: string, phone?: string) => Promise<void>;
  onLogout: () => void;
  wsConnected: boolean;
  allItems: RailGarmentItem[];
  onQuickJumpItem: (item: RailGarmentItem) => void;
  liveNotice: string | null;
}

const SCENE_TABS: { index: 0 | 1 | 2 | 3 | 4 | 5; code: string; label: string }[] = [
  { index: 0, code: "01", label: "Optical portal" },
  { index: 1, code: "02", label: "Garment rail" },
  { index: 2, code: "03", label: "Tech table" },
  { index: 3, code: "04", label: "Vitrine gallery" },
  { index: 4, code: "05", label: "Neural atelier" },
  { index: 5, code: "06", label: "Studio console" },
];

export function EditorialChrome({
  activeScene,
  onSelectScene,
  bag,
  bagOpen,
  onBagOpenChange,
  bagTab,
  onBagTabChange,
  onRemoveBagItem,
  onCheckout,
  checkingOut,
  orders,
  activePayOrder,
  alipayStatus,
  payingOrderNo,
  onStartOrderPay,
  onConfirmSandboxPay,
  onCancelOrder,
  onDismissPayCashier,
  username,
  authOpen,
  onAuthOpenChange,
  onAuthSubmit,
  onLogout,
  wsConnected,
  allItems,
  onQuickJumpItem,
  liveNotice,
}: EditorialChromeProps): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loginUser, setLoginUser] = useState("testuser");
  const [loginPass, setLoginPass] = useState("123456");
  const [loginPhone, setLoginPhone] = useState("13800138000");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (authOpen) {
      setAuthError(null);
    }
  }, [authOpen, authMode]);

  const totalCount = bag.reduce((sum, b) => sum + b.quantity, 0);
  const totalAmount = bag.reduce((sum, b) => {
    const unit = b.item.price ?? (Number(String(b.item.tag ?? "").replace(/[^0-9.]/g, "")) || 68);
    return sum + unit * b.quantity;
  }, 0);

  const pendingOrdersCount = orders.filter((o) => o.status === "PENDING").length;

  const filtered = query.trim()
    ? allItems
        .filter((it) => it.name.toLowerCase().includes(query.trim().toLowerCase()))
        .slice(0, 6)
    : [];

  return (
    <>
      {/* 顶部 Kora 极简导航栏 */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between px-6 sm:px-10">
        {/* 左侧：空间快搜 */}
        <div className="relative flex items-center gap-3">
          <div className="relative flex items-center border-b border-white/25 pb-1">
            <Search className="mr-2 size-3.5 text-white/50" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH ARCHIVE..."
              className="w-36 bg-transparent font-mono text-[11px] uppercase tracking-[0.2em] text-white placeholder-white/35 outline-none focus:w-48 sm:w-44"
            />
          </div>

          {filtered.length > 0 && (
            <div
              data-scrollable="true"
              className="absolute left-0 top-9 z-50 w-72 divide-y divide-white/10 rounded-xl border border-white/20 bg-black p-2 shadow-2xl"
            >
              {filtered.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => {
                    setQuery("");
                    onQuickJumpItem(it);
                  }}
                  className="flex w-full items-center justify-between px-2 py-2 text-left text-xs text-white/80 transition hover:text-[#C8C3F2]"
                >
                  <span className="truncate pr-2">{it.name}</span>
                  <span className="font-mono text-[10px] text-[#C8C3F2]">{it.tag}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 中央：Kora 标志性粗体负字距小写字标 */}
        <button
          type="button"
          onClick={() => onSelectScene(0)}
          className="group flex flex-col items-center outline-none"
        >
          <span className="text-3xl font-bold leading-none tracking-[-0.08em] text-white transition group-hover:text-[#C8C3F2]">
            kora
          </span>
          <span className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.34em] text-white/50">
            INDEPENDENT TACTILE STUDIO
          </span>
        </button>

        {/* 右侧：账户状态与购物袋/订单触发器 */}
        <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.22em]">
          {username ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onBagTabChange("orders");
                  onBagOpenChange(true);
                }}
                className="text-[#A8E6CF] transition hover:text-white"
                title="查看我的订单与支付宝沙箱结算"
              >
                ID · {username}
              </button>
              <button
                type="button"
                aria-label="Logout"
                onClick={onLogout}
                className="text-white/40 transition hover:text-[#FF2A54]"
                title="退出登录"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAuthOpenChange(true)}
              className="text-white/70 transition hover:text-[#C8C3F2]"
            >
              ACCOUNT
            </button>
          )}

          <GlassButton
            size="sm"
            onClick={() => {
              onBagTabChange("bag");
              onBagOpenChange(true);
            }}
            contentClassName="font-mono text-[11px] uppercase tracking-[0.22em]"
          >
            <span>
              BAG ({totalCount})
              {pendingOrdersCount > 0 ? ` · PAY (${pendingOrdersCount})` : ""}
            </span>
          </GlassButton>
        </div>
      </header>

      {/* 右上角实时通知胶囊 */}
      {liveNotice && (
        <div className="pointer-events-none fixed right-6 top-20 z-50 max-w-md rounded-full border border-[#C8C3F2]/50 bg-black/95 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#C8C3F2] shadow-2xl">
          {liveNotice}
        </div>
      )}

      {/* 底部 Kora 六幕时间轴圆点与遥测状态栏 */}
      <footer className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-center justify-between px-6 sm:px-10">
        <nav aria-label="Scene timeline" className="flex items-center gap-4">
          {SCENE_TABS.map((tab) => {
            const isCurrent = activeScene === tab.index;
            return (
              <button
                key={tab.code}
                type="button"
                aria-label={tab.label}
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => onSelectScene(tab.index)}
                className="group flex items-center gap-2 py-2 outline-none"
              >
                <span
                  className={`block size-2.5 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? "scale-125 bg-[#C8C3F2] shadow-[0_0_12px_#C8C3F2]"
                      : "scale-75 bg-white/35 group-hover:scale-100 group-hover:bg-white/70"
                  }`}
                />
                <span
                  className={`hidden font-mono text-[10px] uppercase tracking-[0.24em] transition sm:inline ${
                    isCurrent ? "text-white" : "text-white/40 group-hover:text-white/75"
                  }`}
                >
                  {tab.code} · {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.26em] text-white/45">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`size-1.5 rounded-full ${
                wsConnected ? "bg-[#00FF66] shadow-[0_0_8px_#00FF66]" : "bg-[#C8C3F2]"
              }`}
            />
            <span>{wsConnected ? "WS LIVE SYNC" : "LOCAL ARCHIVE MODE"}</span>
          </span>
          <span className="hidden md:inline">© KORA 2026. DISTINCTIVE WORK.</span>
        </div>
      </footer>

      {/* 极简黑曜石购物袋、订单与支付宝沙箱预接入抽屉 */}
      {bagOpen && (
        <div role="dialog" aria-label="Shopping Bag" className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => onBagOpenChange(false)} />
          <div className="relative z-10 flex h-full w-full max-w-md flex-col justify-between border-l border-white/15 bg-black p-7 text-white">
            <div>
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em]">
                  <button
                    type="button"
                    onClick={() => {
                      onDismissPayCashier();
                      onBagTabChange("bag");
                    }}
                    className={`rounded-full px-3 py-1 transition ${
                      bagTab === "bag"
                        ? "bg-[#C8C3F2] font-semibold text-black"
                        : "text-white/55 hover:text-white"
                    }`}
                  >
                    BAG ({totalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => onBagTabChange("orders")}
                    className={`rounded-full px-3 py-1 transition ${
                      bagTab === "orders"
                        ? "bg-[#A8E6CF] font-semibold text-black"
                        : "text-white/55 hover:text-white"
                    }`}
                  >
                    ORDERS ({orders.length})
                  </button>
                </div>
                <button
                  type="button"
                  aria-label="Close bag"
                  onClick={() => onBagOpenChange(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {bagTab === "bag" ? (
              <>
                <div data-scrollable="true" className="my-5 flex-1 divide-y divide-white/10 overflow-y-auto pr-1">
                  {bag.length === 0 ? (
                    <div className="py-16 text-center">
                      <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/40">
                        YOUR ARCHIVE BAG IS EMPTY.
                      </p>
                      {orders.length > 0 && (
                        <button
                          type="button"
                          onClick={() => onBagTabChange("orders")}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#A8E6CF]/40 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#A8E6CF] hover:bg-[#A8E6CF]/10"
                        >
                          <ReceiptText className="size-3.5" />
                          <span>查看我的订单 ({orders.length})</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    bag.map((entry) => (
                      <div key={`${entry.item.id}-${entry.cartItemId ?? "local"}`} className="flex items-center justify-between py-4">
                        <div className="min-w-0 pr-3">
                          <p className="truncate text-sm font-medium text-white">{entry.item.name}</p>
                          <p className="mt-1 font-mono text-[11px] text-white/50">
                            QTY {entry.quantity} · {entry.item.tag}
                            {entry.cartItemId ? " · DB SYNCED" : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${entry.item.name}`}
                          onClick={() => onRemoveBagItem(entry)}
                          className="text-white/40 transition hover:text-[#FF2A54]"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-white/15 pt-5">
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/50">
                      TOTAL VALUATION
                    </span>
                    <span className="font-mono text-2xl font-semibold text-[#C8C3F2]">
                      ¥{totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                    {alipayStatus?.configured
                      ? "● ALIPAY SANDBOX GATEWAY READY"
                      : "● ALIPAY SANDBOX PRE-INTEGRATION · REDISSON LOCK"}
                  </p>
                  <GlassButton
                    size="default"
                    disabled={bag.length === 0 || checkingOut}
                    onClick={() => onCheckout()}
                    wrapClassName="w-full"
                    className="w-full"
                    contentClassName="w-full font-mono text-xs uppercase tracking-[0.22em]"
                  >
                    <span>
                      {checkingOut
                        ? "LOCKING INVENTORY..."
                        : username
                        ? "CREATE ORDER & SANDBOX PAY"
                        : "SIGN IN TO CHECKOUT"}
                    </span>
                    <Zap className="size-4 text-[#C8C3F2]" />
                  </GlassButton>
                </div>
              </>
            ) : (
              <div data-scrollable="true" className="my-5 flex-1 space-y-4 overflow-y-auto pr-1">
                {/* 支付宝沙箱收银台面板（选中待支付订单点击付款后显示） */}
                {activePayOrder && (
                  <div
                    data-testid="alipay-sandbox-cashier"
                    className="space-y-3 rounded-2xl border border-[#00F0FF]/45 bg-gradient-to-b from-[#041824] to-black p-4 shadow-[0_0_28px_rgba(0,240,255,0.14)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#00F0FF]">
                        <CreditCard className="size-3.5" />
                        <span>
                          {activePayOrder.configured
                            ? "ALIPAY SANDBOX · RSA2 READY"
                            : "ALIPAY SANDBOX · SIMULATION"}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={onDismissPayCashier}
                        className="font-mono text-[10px] text-white/50 hover:text-white"
                      >
                        收起
                      </button>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-white">{activePayOrder.subject}</p>
                      <p className="mt-1 font-mono text-[10px] text-white/55">
                        ORD · {activePayOrder.orderNo}
                      </p>
                      <p className="mt-2 font-mono text-2xl font-semibold text-[#A8E6CF]">
                        ¥{Number(activePayOrder.totalAmount).toFixed(2)}
                      </p>
                    </div>

                    <p className="rounded-lg border border-white/10 bg-black/50 p-2.5 text-[11px] leading-relaxed text-white/65">
                      {activePayOrder.message}
                    </p>

                    {activePayOrder.configured && activePayOrder.payFormHtml ? (
                      <button
                        type="button"
                        onClick={() => {
                          const container = document.createElement("div");
                          container.innerHTML = activePayOrder.payFormHtml ?? "";
                          document.body.appendChild(container);
                          const form = container.querySelector("form");
                          form?.submit();
                        }}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#00F0FF] font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-[#70F8FF]"
                      >
                        <span>前往支付宝沙箱收银台付款</span>
                        <ArrowUpRight className="size-3.5" />
                      </button>
                    ) : (
                      <GlassButton
                        size="default"
                        disabled={payingOrderNo === activePayOrder.orderNo}
                        onClick={() => onConfirmSandboxPay(activePayOrder.orderNo)}
                        wrapClassName="w-full"
                        className="w-full"
                        contentClassName="w-full font-mono text-[11px] uppercase tracking-[0.2em]"
                      >
                        <ShieldCheck className="size-4 text-[#00FF66]" />
                        <span>
                          {payingOrderNo === activePayOrder.orderNo
                            ? "CONFIRMING PAYMENT..."
                            : "模拟支付宝沙箱付款成功 (PAID)"}
                        </span>
                      </GlassButton>
                    )}
                  </div>
                )}

                {!username ? (
                  <div className="py-16 text-center">
                    <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/45">
                      SIGN IN TO VIEW ORDERS & SANDBOX CHECKOUT
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onBagOpenChange(false);
                        onAuthOpenChange(true);
                      }}
                      className="mt-4 rounded-full bg-[#C8C3F2] px-5 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-black"
                    >
                      OPEN SIGN IN
                    </button>
                  </div>
                ) : orders.length === 0 ? (
                  <p className="py-16 text-center font-mono text-xs uppercase tracking-[0.24em] text-white/40">
                    NO ORDERS FOUND YET.
                  </p>
                ) : (
                  orders.map((ord) => {
                    const isPending = ord.status === "PENDING";
                    const isPaid = ord.status === "PAID";
                    return (
                      <div
                        key={ord.orderNo}
                        className="space-y-2.5 rounded-xl border border-white/15 bg-white/[0.03] p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-mono text-[10px] text-white/65">
                            {ord.orderNo}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] ${
                              isPaid
                                ? "bg-[#00FF66]/15 text-[#00FF66]"
                                : isPending
                                ? "bg-[#DE9C31]/20 text-[#DE9C31]"
                                : "bg-[#FF2A54]/15 text-[#FF2A54]"
                            }`}
                          >
                            {isPaid && <CheckCircle2 className="size-3" />}
                            <span>{ord.status}</span>
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-white/80">
                          {(ord.items ?? []).map((it) => (
                            <div key={it.id} className="flex justify-between gap-2">
                              <span className="truncate">{it.productName} × {it.quantity}</span>
                              <span className="shrink-0 font-mono text-white/60">¥{Number(it.price).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between border-t border-white/10 pt-2">
                          <span className="font-mono text-xs font-semibold text-[#C8C3F2]">
                            合计 ¥{Number(ord.totalAmount).toFixed(2)}
                          </span>
                          {ord.tradeNo && (
                            <span className="truncate font-mono text-[9px] text-white/45">
                              {ord.tradeNo}
                            </span>
                          )}
                        </div>

                        {isPending && (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => onStartOrderPay(ord.orderNo)}
                              className="flex-1 rounded-full bg-[#00F0FF] py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#70F8FF]"
                            >
                              支付宝沙箱付款
                            </button>
                            <button
                              type="button"
                              onClick={() => onCancelOrder(ord.orderNo)}
                              className="rounded-full border border-[#FF2A54]/45 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#FF2A54] transition hover:bg-[#FF2A54] hover:text-black"
                            >
                              取消订单
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kora 底边线身份认证抽屉（支持真实 JWT 登录 & 新用户注册） */}
      {authOpen && (
        <div role="dialog" aria-label="Identity Authentication" className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => onAuthOpenChange(false)} />
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setAuthError(null);
              setAuthSubmitting(true);
              try {
                await onAuthSubmit(authMode, loginUser, loginPass, loginPhone);
              } catch (err) {
                setAuthError(err instanceof Error ? err.message : "认证失败，请检查账号密码或后端连接");
              } finally {
                setAuthSubmitting(false);
              }
            }}
            className="relative z-10 w-full max-w-md space-y-5 rounded-2xl border border-white/20 bg-black p-8"
          >
            <div className="flex items-center justify-between">
              <div className="inline-flex gap-2 font-mono text-[10px] uppercase tracking-[0.24em]">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`rounded-full px-3 py-1 transition ${
                    authMode === "login"
                      ? "bg-[#C8C3F2] font-semibold text-black"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  SIGN IN
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className={`rounded-full px-3 py-1 transition ${
                    authMode === "register"
                      ? "bg-[#A8E6CF] font-semibold text-black"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  REGISTER
                </button>
              </div>
              <button
                type="button"
                onClick={() => onAuthOpenChange(false)}
                className="text-white/50 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <h3 className="text-3xl font-semibold tracking-tight text-white">
              {authMode === "login" ? "Enter the " : "Join the "}
              <span className="kora-serif-italic font-normal text-[#C8C3F2]">atelier.</span>
            </h3>

            {authError && (
              <div
                role="alert"
                className="rounded-lg border border-[#FF2A54]/50 bg-[#FF2A54]/10 px-3 py-2 font-mono text-[11px] text-[#FF2A54]"
              >
                {authError}
              </div>
            )}

            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/50">
                USERNAME
              </span>
              <input
                type="text"
                required
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="mt-1 w-full border-0 border-b border-white/25 bg-transparent pb-2 text-sm text-white outline-none focus:border-[#C8C3F2]"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/50">
                PASSKEY
              </span>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="mt-1 w-full border-0 border-b border-white/25 bg-transparent pb-2 text-sm text-white outline-none focus:border-[#C8C3F2]"
              />
            </label>
            {authMode === "register" && (
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/50">
                  PHONE (OPTIONAL)
                </span>
                <input
                  type="text"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  className="mt-1 w-full border-0 border-b border-white/25 bg-transparent pb-2 text-sm text-white outline-none focus:border-[#C8C3F2]"
                />
              </label>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#C8C3F2] font-mono text-xs font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-[#DDD9FB] disabled:opacity-50"
            >
              <span>
                {authSubmitting
                  ? "AUTHENTICATING..."
                  : authMode === "login"
                  ? "AUTHENTICATE"
                  : "CREATE ARCHIVE ID"}
              </span>
              <ArrowUpRight className="size-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
