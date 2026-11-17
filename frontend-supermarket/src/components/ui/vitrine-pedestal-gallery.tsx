"use client";

/**
 * 第 04 幕核心组件 · VITRINE GALLERY（珍品名酒与典藏器物 · 水波纹玻璃展柜厅）
 * - 全部采用真实高清商品实拍图（飞天茅台 500ml、五粮液 52度水晶纪念礼盒、Beringer 贝灵哲赤霞珠干红、大师级石楠木烟斗等）
 * - 集成 21st.dev @rahil1202/components/water-ripple-image 液态水波纹与焦散折射 Shader
 * - 悬停时透明玻璃防尘钟罩物理向上升起 (Glass Bell Lift)，点击时触发原位 FLIP 提拉动画进入半透明毛玻璃背景 (bg-black/80 backdrop-blur-2xl) 的 360° 博物馆转盘检视台
 * - 打开详情弹窗时自动隐藏并锁定底层 6 座玻璃展柜，同时将弹窗状态完全隔离在子组件中，彻底消除底层展品重绘与穿透闪烁
 */
import * as React from "react";
import { createPortal } from "react-dom";
import { gsap, useGSAP } from "../../lib/gsap";
import { ElegantDarkPatternLayers } from "./elegant-dark-pattern";
import WaterRippleImage from "./water-ripple-image";
import type { RailGarmentItem } from "../../types/domain";

export interface VitrineGalleryHeroProps {
  items: RailGarmentItem[];
  eyebrow?: string;
  heading?: string;
  caption?: string;
  selectedItemId?: string | null;
  onActiveItemChange?: (item: RailGarmentItem | null, normalizedX: number) => void;
  onOpenChange?: (index: number | null) => void;
  renderDetailActions?: (item: RailGarmentItem) => React.ReactNode;
}

export const VITRINE_DEMO_ITEMS: RailGarmentItem[] = [
  {
    id: "vitrine-moutai-feitian",
    productId: 301,
    name: "贵州茅台酒 · 飞天典藏 500ml",
    description: "核心产区坤沙大曲酱香工艺，五年陶坛陈酿勾调，乳白避光瓷瓶配经典飞天飘带礼盒。",
    color: "#A8E6CF",
    image: "/products/moutai-feitian.jpg",
    backImage: "/products/moutai-feitian.jpg",
    price: 2799,
    stock: 10,
    outOfStock: false,
    tag: "¥2799",
    details: ["53%vol 酱香型", "500ml 典藏装", "防伪溯源认证"],
    shelfCode: "V01",
    zone: "名酒与典藏展柜",
  },
  {
    id: "vitrine-wuliangye-crystal",
    productId: 302,
    name: "五粮液 · 52度水晶礼盒纪念酒",
    description: "五种粮食古法包包曲酿造，高透多面切割亚克力水晶防尘礼盒封装，窖香浓郁回甘。",
    color: "#C8C3F2",
    image: "/products/wuliangye-crystal.jpg",
    backImage: "/products/wuliangye-crystal.jpg",
    price: 1399,
    stock: 8,
    outOfStock: false,
    tag: "¥1399",
    details: ["52%vol 浓香型", "水晶透明礼盒", "古法五粮酿造"],
    shelfCode: "V02",
    zone: "名酒与典藏展柜",
  },
  {
    id: "vitrine-beringer-wine",
    productId: 303,
    name: "Beringer · 贝灵哲私家珍藏赤霞珠干红",
    description: "纳帕谷百年名庄私家珍藏（Private Reserve），法国全新橡木桶陈酿 20 个月，深邃黑醋栗与雪松单宁。",
    color: "#DDD9FB",
    image: "/products/beringer-reserve.jpg",
    backImage: "/products/beringer-reserve.jpg",
    price: 1680,
    stock: 6,
    outOfStock: false,
    tag: "¥1680",
    details: ["Napa Valley", "Cabernet Sauvignon", "橡木桶陈酿"],
    shelfCode: "V03",
    zone: "名酒与典藏展柜",
  },
  {
    id: "vitrine-briar-pipe",
    productId: 304,
    name: "Briar Artisan · 石楠木手工弯式烟斗",
    description: "地中海百年老根石楠木火焰纹手工打磨，纯银戒圈配手工硫化硬胶咬嘴与真皮礼盒。",
    color: "#DE9C31",
    image: "/products/briar-pipe.jpg",
    backImage: "/products/briar-pipe.jpg",
    price: 3280,
    stock: 5,
    outOfStock: false,
    tag: "¥3280",
    details: ["火焰纹石楠木", "925 纯银戒圈", "手工定制礼盒"],
    shelfCode: "V04",
    zone: "名酒与典藏展柜",
  },
  {
    id: "vitrine-dji-mavic-collector",
    productId: 305,
    name: "Mavic 3 Enterprise · 航测典藏套装",
    description: "配备 RTK 厘米级高精度定位模块与哈苏 4/3 CMOS 广角镜头，博物馆级独立恒温防尘柜陈列。",
    color: "#00F0FF",
    image: "/products/dji-mavic-3.png",
    backImage: "/products/dji-mavic-3.png",
    price: 25999,
    stock: 4,
    outOfStock: false,
    tag: "¥25999",
    details: ["RTK 厘米级模块", "哈苏 4/3 CMOS", "56× 混合变焦"],
    shelfCode: "V05",
    zone: "名酒与典藏展柜",
  },
  {
    id: "vitrine-mate-rs-collector",
    productId: 306,
    name: "Porsche Design · 徕卡三摄限量典藏版",
    description: "保时捷设计工作室联名流线超跑八曲面机身，航空级微胶囊散热与徕卡三摄光学模组。",
    color: "#00FF66",
    image: "/products/huawei-mate-rs.jpg",
    backImage: "/products/huawei-mate-rs.jpg",
    price: 12999,
    stock: 3,
    outOfStock: false,
    tag: "¥12999",
    details: ["保时捷限量联名", "512GB 典藏版", "真皮定制保护套"],
    shelfCode: "V06",
    zone: "名酒与典藏展柜",
  },
];

export function VitrineGalleryHero({
  items,
  eyebrow = "STAGE III · LIQUID RIPPLE VITRINE GALLERY",
  heading = "Collector spirits & rare pieces under glass bells.",
  caption = "Hover to lift the refractive glass bell & trigger liquid caustics; click to unseal on the 360° turntable.",
  selectedItemId,
  onActiveItemChange,
  onOpenChange,
  renderDetailActions,
}: VitrineGalleryHeroProps): React.JSX.Element {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const pedestalRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const sourceRectRef = React.useRef<DOMRect | null>(null);

  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  // 专属入场动效：石材展柱与玻璃防尘钟罩依次升起（不覆写钟罩内联 translate3d 物理提拉矩阵）
  useGSAP(
    () => {
      if (!rootRef.current) return;
      gsap.fromTo(
        ".vitrine-plinth",
        { y: 32, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, stagger: 0.06, ease: "power3.out" }
      );
    },
    { scope: rootRef, dependencies: [items.length] }
  );

  React.useEffect(() => {
    if (!selectedItemId) return;
    const idx = items.findIndex((it) => it.id === selectedItemId);
    if (idx >= 0) {
      setHoveredIndex(idx);
    }
  }, [selectedItemId, items]);

  const handleFocusPedestal = React.useCallback(
    (idx: number) => {
      setHoveredIndex(idx);
      const item = items[idx] ?? null;
      const normX = items.length > 1 ? (idx / (items.length - 1)) * 2 - 1 : 0;
      onActiveItemChange?.(item, normX);
    },
    [items, onActiveItemChange]
  );

  const handleOpenVitrine = React.useCallback(
    (idx: number) => {
      handleFocusPedestal(idx);
      sourceRectRef.current = pedestalRefs.current[idx]?.getBoundingClientRect() ?? null;
      setOpenIndex(idx);
      onOpenChange?.(idx);
    },
    [handleFocusPedestal, onOpenChange]
  );

  const handleCloseVitrine = React.useCallback(() => {
    setOpenIndex(null);
    onOpenChange?.(null);
  }, [onOpenChange]);

  const activeItem = hoveredIndex !== null ? items[hoveredIndex] : items[0];
  const modalItem = openIndex !== null ? items[openIndex] : null;
  const isModalOpen = openIndex !== null;

  return (
    <section
      ref={rootRef}
      data-slot="vitrine-gallery-hero"
      className="relative isolate flex w-full flex-col items-center justify-center overflow-hidden px-4 py-3 text-white"
    >
      {/* 展厅主舞台容器：当详情弹窗打开时完全隐藏并锁定指针，彻底杜绝底层 6 座玻璃展柜穿透与重绘闪烁 */}
      <div
        data-testid="vitrine-showroom-stage"
        data-modal-dimmed={isModalOpen ? "true" : "false"}
        aria-hidden={isModalOpen ? "true" : undefined}
        className={`flex w-full flex-col items-center transition-opacity duration-200 ${
          isModalOpen ? "pointer-events-none invisible opacity-0" : "visible opacity-100"
        }`}
      >
        <header className="relative z-10 flex flex-col items-center gap-1 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#A8E6CF]">
            {eyebrow}
          </p>
          <h2 className="text-balance text-2xl font-medium tracking-tight sm:text-3xl">
            {heading}
          </h2>
        </header>

        {/* 6 座高透玻璃防尘钟罩 + 真实高清商品摄影展柜矩阵 */}
        <div className="relative z-10 mt-6 grid w-full max-w-6xl grid-cols-2 gap-5 px-4 sm:grid-cols-3 md:grid-cols-6">
          {items.slice(0, 6).map((item, idx) => {
            const isLifted = hoveredIndex === idx;
            const accent = item.outOfStock ? "#FF2A54" : item.color ?? "#A8E6CF";

            return (
              <button
                key={item.id}
                ref={(el) => {
                  pedestalRefs.current[idx] = el;
                }}
                type="button"
                aria-label={item.name}
                onPointerEnter={() => handleFocusPedestal(idx)}
                onPointerLeave={() => setHoveredIndex(null)}
                onFocus={() => handleFocusPedestal(idx)}
                onClick={() => handleOpenVitrine(idx)}
                className="vitrine-plinth group relative flex flex-col items-center pt-5 outline-none"
              >
                {/* 顶部锥形聚光灯束 */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-4 h-40 w-32 rounded-full blur-xl transition-opacity duration-500"
                  style={{
                    opacity: isLifted ? 0.65 : 0.2,
                    background: `radial-gradient(ellipse at top, ${accent}, transparent 72%)`,
                  }}
                />

                {/* 展柜主体容器 */}
                <div className="relative flex h-60 w-full max-w-[162px] flex-col items-center justify-end">
                  {/* 透明折射玻璃防尘钟罩 (悬停时物理向上升起 42px) */}
                  <div
                    data-glass-hood
                    data-lifted={isLifted ? "true" : "false"}
                    className="vitrine-hood-anim pointer-events-none absolute inset-x-1 top-0 bottom-9 z-20 rounded-t-full border border-white/30 bg-gradient-to-b from-white/[0.16] via-white/[0.03] to-white/[0.08] shadow-[inset_0_2px_18px_rgba(255,255,255,0.25)] transition-transform duration-500 ease-out"
                    style={{
                      transform: isLifted ? "translate3d(0, -42px, 0)" : "translate3d(0, 0px, 0)",
                      borderColor: isLifted ? accent : "rgba(255,255,255,0.28)",
                    }}
                  >
                    <span
                      className="absolute -top-2.5 left-1/2 size-4 -translate-x-1/2 rounded-full border-2 bg-black"
                      style={{ borderColor: accent }}
                    />
                  </div>

                  {/* 钟罩内部：真实高清藏品摄影图 */}
                  <div
                    className="relative z-10 mb-2 flex h-44 w-36 items-center justify-center overflow-hidden rounded-t-full p-2.5 transition-transform duration-500 ease-out"
                    style={{
                      transform: isLifted
                        ? "translate3d(0, -10px, 0) scale(1.06)"
                        : "translate3d(0, 0px, 0) scale(1)",
                    }}
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        draggable={false}
                        className="max-h-36 w-auto rounded-xl select-none object-contain drop-shadow-[0_14px_24px_rgba(0,0,0,0.85)]"
                      />
                    )}
                  </div>

                  {/* 黑曜石大理石与拉丝黄铜底座 (Plinth Base) */}
                  <div className="relative z-30 flex h-9 w-full items-center justify-between rounded-md border border-white/25 bg-gradient-to-b from-[#1A1B24] to-[#07080C] px-2.5 shadow-2xl">
                    <span className="font-mono text-[9px] text-white/45">
                      0{idx + 1}
                    </span>
                    <span
                      className={`font-mono text-[9px] font-semibold tracking-wider ${
                        item.outOfStock ? "text-[#FF2A54]" : "text-[#A8E6CF]"
                      }`}
                    >
                      {item.outOfStock ? "SOLD OUT" : item.tag}
                    </span>
                  </div>
                </div>

                <span className="mt-2 max-w-[16ch] truncate font-mono text-[10px] uppercase tracking-[0.14em] text-white/85 group-hover:text-[#A8E6CF]">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* 底部当前展柜说明 */}
        <div className="relative z-10 mt-3 flex flex-col items-center text-center">
          <p className="text-sm font-medium text-white">
            {activeItem ? activeItem.name : caption}
          </p>
          <p className="mt-1 max-w-xl text-xs text-white/55">
            {activeItem?.description ?? caption}
          </p>
        </div>
      </div>

      {/* 独立详情弹窗子组件：内部转盘自转与水波纹状态完全隔离，不触发底层 6 座玻璃展柜重渲染 */}
      {modalItem && openIndex !== null && (
        <VitrineDetailModal
          item={modalItem}
          index={openIndex}
          total={items.length}
          sourceRect={sourceRectRef.current}
          onClose={handleCloseVitrine}
          renderDetailActions={renderDetailActions}
        />
      )}
    </section>
  );
}

/**
 * 独立隔离的展柜 360° 详情检视弹窗
 * - 采用 bg-black/80 backdrop-blur-2xl 呈现稳定深邃毛玻璃背景（透出底层 WebGL Shader 光晕，绝不透出背后 6 座展柜）
 * - 内部 32ms 自转计时器与水波纹状态完全隔离在子组件内，绝不引起底层展柜重绘闪烁
 */
function VitrineDetailModal({
  item,
  index,
  total,
  sourceRect,
  onClose,
  renderDetailActions,
}: {
  item: RailGarmentItem;
  index: number;
  total: number;
  sourceRect: DOMRect | null;
  onClose: () => void;
  renderDetailActions?: (item: RailGarmentItem) => React.ReactNode;
}): React.JSX.Element {
  const [shown, setShown] = React.useState<boolean>(false);
  const [turntableMode, setTurntableMode] = React.useState<"obverse" | "inscription" | "autospin">(
    "obverse"
  );
  const [rotationY, setRotationY] = React.useState<number>(0);
  const figureRef = React.useRef<HTMLDivElement | null>(null);

  // 博物馆自动恒速环绕转盘模式 (TURNTABLE AUTO-SPIN)
  React.useEffect(() => {
    if (turntableMode !== "autospin") return;
    const timer = window.setInterval(() => {
      setRotationY((r) => (r + 2) % 360);
    }, 32);
    return () => window.clearInterval(timer);
  }, [turntableMode]);

  // 点击展柜后原位提拉升空 FLIP 动画
  React.useLayoutEffect(() => {
    const figure = figureRef.current;
    const from = sourceRect;
    if (figure && from && from.width > 0 && typeof figure.animate === "function") {
      const to = figure.getBoundingClientRect();
      const scale = from.height / Math.max(1, to.height);
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top - to.top;
      figure.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
          {
            transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 50}px) scale(${((scale + 1) / 2) * 1.05})`,
            offset: 0.5,
          },
          { transform: "none" },
        ],
        { duration: 660, easing: "cubic-bezier(.22,.85,.3,1)" }
      );
    }
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, [sourceRect]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-6 text-foreground"
    >
      {/* 21st.dev @jatin-yadav05/components/elegant-dark-pattern 动态青色斜射光束 + 20px 星点矩阵 + 毛玻璃遮罩 */}
      <div
        data-modal-backdrop
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 transition-opacity duration-300 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      >
        <ElegantDarkPatternLayers translucent />
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-white/80 backdrop-blur-md transition hover:border-[#A8E6CF] hover:text-[#A8E6CF]"
      >
        SEAL VITRINE BELL ✕
      </button>

      <div className="relative z-10 grid w-full max-w-5xl items-center gap-10 pt-8 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        {/* 左侧：已升空开启的玻璃钟罩 + 21st.dev WaterRippleImage 水波纹折射 360° 旋转展盘 */}
        <div
          ref={figureRef}
          className="relative mx-auto flex h-[min(62vh,520px)] w-full max-w-md flex-col items-center justify-center"
          style={{ perspective: "1400px" }}
        >
          {/* 顶部已升空退场的半透明玻璃钟罩檐口 */}
          <div
            aria-hidden="true"
            className="pointer-events-none mb-3 h-8 w-56 rounded-b-full border-b border-x border-white/25 bg-gradient-to-t from-white/10 to-transparent"
          />

          {/* 旋转器物本体：内置 WaterRippleImage 液态水波纹折射动效 + 正反面 [backface-visibility:hidden] */}
          <div
            data-testid="vitrine-turntable-stage"
            data-autospin={turntableMode === "autospin" ? "true" : "false"}
            className="relative h-80 w-72 transition-transform duration-300 ease-out [transform-style:preserve-3d]"
            style={{
              transform: `rotateY(${rotationY}deg)`,
            }}
          >
            {/* 正面：WaterRippleImage 水波纹液态焦散实拍图 */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-white/[0.04] p-4 shadow-2xl [backface-visibility:hidden]">
              {item.image && (
                <WaterRippleImage
                  src={item.image}
                  alt={item.name}
                  blueish={0.4}
                  scale={7}
                  illumination={0.15}
                  surfaceDistortion={0.03}
                  waterDistortion={0.02}
                  className="size-full rounded-2xl"
                />
              )}
            </div>

            {/* 背面：180° 翻转背标视图，带 [backface-visibility:hidden] */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-black/80 p-6 shadow-2xl [backface-visibility:hidden]"
              style={{ transform: "rotateY(180deg)" }}
            >
              {item.image && (
                <img
                  src={item.backImage ?? item.image}
                  alt={`${item.name} reverse`}
                  draggable={false}
                  className="max-h-56 w-auto -scale-x-100 rounded-xl select-none object-contain opacity-90"
                />
              )}
              <span className="mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[#A8E6CF]">
                AUTHENTICATED ARCHIVE SEAL · {item.shelfCode ?? "V01"}
              </span>
            </div>
          </div>

          {/* 底部 360° 精密刻度博物馆旋转展盘底座 */}
          <div className="mt-3 flex h-11 w-64 flex-col items-center justify-center rounded-full border border-[#A8E6CF]/40 bg-gradient-to-b from-[#171922] to-black shadow-[0_0_40px_rgba(168,230,207,0.18)]">
            <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#A8E6CF]">
              LIQUID RIPPLE TURNTABLE · {Math.round(rotationY)}°
            </span>
          </div>
        </div>

        {/* 右侧：藏品档案与三态转盘控制 */}
        <div className="flex flex-col gap-4 text-left">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#A8E6CF]">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} · WATER RIPPLE VITRINE
          </p>
          <h3 className="text-2xl font-medium tracking-tight text-white sm:text-3xl">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          )}

          {item.details && item.details.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {item.details.map((d) => (
                <li
                  key={d}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                >
                  {d}
                </li>
              ))}
            </ul>
          )}

          {/* 博物馆展柜专属三态鉴赏开关 */}
          <div className="mt-2 flex flex-wrap gap-2 border-t border-white/15 pt-4">
            {(
              [
                { id: "obverse", label: "OBVERSE · WATER RIPPLE", deg: 0 },
                { id: "inscription", label: "INSCRIPTION · 180°", deg: 180 },
                { id: "autospin", label: "TURNTABLE AUTO-SPIN", deg: rotationY },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setTurntableMode(m.id);
                  setRotationY(m.deg);
                }}
                className={`rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition ${
                  turntableMode === m.id
                    ? "bg-[#A8E6CF] font-semibold text-black"
                    : "border border-white/20 text-white/70 hover:border-[#A8E6CF] hover:text-[#A8E6CF]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {renderDetailActions && (
            <div className="mt-2 border-t border-white/15 pt-4">
              {renderDetailActions(item)}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default VitrineGalleryHero;
