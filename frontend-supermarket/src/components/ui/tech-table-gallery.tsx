"use client";

/**
 * 第 03 幕 · HORIZON TECH TABLE / WARP CAROUSEL（旗舰数码真实视觉广角畸变转盘展厅）
 * - 使用 21st.dev @louisstudios/components/warp-carousel 3D 柱面鱼眼畸变与色散光晕转盘
 * - 全部采用真实高清数码实拍图（三星 Galaxy S22 Ultra、华为 Mate RS 保时捷设计、Apple iPhone 12 薄荷绿、大疆 Mavic 3 行业无人机、大疆 Osmo 云台）
 * - 点击中心卡片时触发与服饰厅同款的原位提拉 FLIP 动画，进入半透明模糊背景 (bg-background/85 backdrop-blur-xl) 的 1400px 3D 检视台
 * - 检视台支持 360° 真实商品正反面旋转（带严格 [backface-visibility:hidden]，绝无重叠）与 @rahil1202/water-ripple-image 水波纹折射检视模式
 */
import * as React from "react";
import { createPortal } from "react-dom";
import ElegantDarkPatternLayers_Default, { ElegantDarkPatternLayers } from "./elegant-dark-pattern";
import WarpCarousel from "./warp-carousel";
import WaterRippleImage from "./water-ripple-image";
import type { RailGarmentItem } from "../../types/domain";
void ElegantDarkPatternLayers_Default;

export interface TechTableHeroProps {
  items: RailGarmentItem[];
  eyebrow?: string;
  heading?: string;
  caption?: string;
  selectedItemId?: string | null;
  onActiveItemChange?: (item: RailGarmentItem | null, normalizedX: number) => void;
  onOpenChange?: (index: number | null) => void;
  renderDetailActions?: (item: RailGarmentItem) => React.ReactNode;
}

export const TECH_TABLE_DEMO_ITEMS: RailGarmentItem[] = [
  {
    id: "tech-samsung-s22-ultra",
    productId: 201,
    name: "Samsung Galaxy S22 Ultra · Burgundy",
    description: "Built-in S Pen flagship with 108MP pro-grade quad camera system, Armor Aluminum frame, and Dynamic AMOLED 2X.",
    color: "#00F0FF",
    image: "/products/samsung-s22-ultra.png",
    backImage: "/products/samsung-s22-ultra.png",
    price: 8999,
    stock: 14,
    outOfStock: false,
    tag: "¥8999",
    details: ["Dynamic AMOLED 2X", "Built-in S Pen", "108MP Periscope"],
    shelfCode: "T01",
    zone: "旗舰数码展厅",
  },
  {
    id: "tech-huawei-mate-rs",
    productId: 202,
    name: "HUAWEI Mate RS · Porsche Design",
    description: "Aerospace-cooled microcapsule PCM chassis with Leica triple optics and dual in-screen fingerprint architecture.",
    color: "#FF2A54",
    image: "/products/huawei-mate-rs.jpg",
    backImage: "/products/huawei-mate-rs.jpg",
    price: 9999,
    stock: 8,
    outOfStock: false,
    tag: "¥9999",
    details: ["Porsche Design", "Leica Triple Cam", "Aerospace PCM"],
    shelfCode: "T02",
    zone: "旗舰数码展厅",
  },
  {
    id: "tech-iphone-12-mint",
    productId: 203,
    name: "Apple iPhone 12 · Mint Edition",
    description: "Ceramic Shield front glass with aerospace-grade aluminum edges, A14 Bionic neural engine, and Super Retina XDR.",
    color: "#A8E6CF",
    image: "/products/iphone-12-mint.png",
    backImage: "/products/iphone-12-mint.png",
    price: 5499,
    stock: 16,
    outOfStock: false,
    tag: "¥5499",
    details: ["Super Retina XDR", "Ceramic Shield", "A14 Bionic"],
    shelfCode: "T03",
    zone: "旗舰数码展厅",
  },
  {
    id: "tech-dji-mavic-3",
    productId: 204,
    name: "DJI Mavic 3 Enterprise · RTK Drone",
    description: "4/3 CMOS Hasselblad wide camera with 56× hybrid zoom tele lens, omnidirectional obstacle sensing, and RTK module.",
    color: "#FFA500",
    image: "/products/dji-mavic-3.png",
    backImage: "/products/dji-mavic-3.png",
    price: 23800,
    stock: 5,
    outOfStock: false,
    tag: "¥23800",
    details: ["4/3 CMOS Sensor", "56× Hybrid Zoom", "Centimeter RTK"],
    shelfCode: "T04",
    zone: "旗舰数码展厅",
  },
  {
    id: "tech-dji-osmo-mobile",
    productId: 205,
    name: "DJI Osmo Mobile · 3-Axis Gimbal",
    description: "Foldable magnetic 3-axis smartphone stabilizer with built-in extension rod, ActiveTrack 6.0, and ShotGuides.",
    color: "#C8C3F2",
    image: "/products/dji-osmo-mobile.png",
    backImage: "/products/dji-osmo-mobile.png",
    price: 999,
    stock: 22,
    outOfStock: false,
    tag: "¥999",
    details: ["3-Axis Stabilization", "Magnetic Clamp", "ActiveTrack 6.0"],
    shelfCode: "T05",
    zone: "旗舰数码展厅",
  },
];

export function TechTableHero({
  items,
  eyebrow = "STAGE II · 21ST.DEV WARP CAROUSEL",
  heading = "Flagship digital hardware in optical warp.",
  caption = "Drag the 3D cylindrical lens carousel or click the focal piece to lift & inspect.",
  selectedItemId,
  onActiveItemChange,
  onOpenChange,
  renderDetailActions,
}: TechTableHeroProps): React.JSX.Element {
  const [activeIndex, setActiveIndex] = React.useState<number>(0);
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const sourceRectRef = React.useRef<DOMRect | null>(null);

  React.useEffect(() => {
    if (!selectedItemId) return;
    const idx = items.findIndex((it) => it.id === selectedItemId);
    if (idx >= 0) {
      setActiveIndex(idx);
    }
  }, [selectedItemId, items]);

  const handleActiveChange = React.useCallback(
    (idx: number) => {
      setActiveIndex(idx);
      const item = items[idx] ?? null;
      const normX = items.length > 1 ? (idx / (items.length - 1)) * 2 - 1 : 0;
      onActiveItemChange?.(item, normX);
    },
    [items, onActiveItemChange]
  );

  const handleOpenInspect = React.useCallback(
    (idx: number, rect: DOMRect | null) => {
      sourceRectRef.current = rect;
      setOpenIndex(idx);
      onOpenChange?.(idx);
    },
    [onOpenChange]
  );

  const handleClose = React.useCallback(() => {
    setOpenIndex(null);
    onOpenChange?.(null);
  }, [onOpenChange]);

  const activeItem = items[activeIndex] ?? items[0];
  const modalItem = openIndex !== null ? items[openIndex] : null;
  const isModalOpen = openIndex !== null;

  return (
    <section
      data-slot="tech-table-hero"
      className="relative isolate flex w-full flex-col items-center justify-center overflow-hidden px-4 py-2 text-white"
    >
      {/* 展厅主舞台容器：当详情弹窗打开时完全隐藏并锁定指针，彻底杜绝底层 3D 转盘穿透与重绘闪烁 */}
      <div
        data-testid="tech-showroom-stage"
        data-modal-dimmed={isModalOpen ? "true" : "false"}
        aria-hidden={isModalOpen ? "true" : undefined}
        className={`flex w-full flex-col items-center transition-opacity duration-200 ${
          isModalOpen ? "pointer-events-none invisible opacity-0" : "visible opacity-100"
        }`}
      >
        <header className="relative z-10 flex flex-col items-center gap-1 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#00F0FF]">
            {eyebrow}
          </p>
          <h2 className="text-balance text-2xl font-medium tracking-tight sm:text-3xl">
            {heading}
          </h2>
        </header>

        {/* 21st.dev @louisstudios/warp-carousel 3D 环形广角畸变转盘 */}
        <WarpCarousel
          items={items}
          activeIndex={activeIndex}
          onActiveIndexChange={handleActiveChange}
          onInspectItem={handleOpenInspect}
        />

        {/* 底部快速点选圆点与当前数码单品描述 */}
        <div className="relative z-10 flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            {items.map((it, i) => (
              <button
                key={it.id}
                type="button"
                aria-label={`Warp slide ${i + 1}`}
                onClick={() => handleActiveChange(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIndex ? "w-7 bg-[#00F0FF]" : "w-1.5 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
          <p className="text-sm font-medium text-white">
            {activeItem ? activeItem.name : caption}
          </p>
          <p className="max-w-xl text-xs text-white/55">
            {activeItem?.description ?? caption}
          </p>
        </div>
      </div>

      {/* 独立详情弹窗子组件：内部旋转/水波纹状态完全隔离，不触发底层展厅重渲染 */}
      {modalItem && openIndex !== null && (
        <TechDetailModal
          item={modalItem}
          index={openIndex}
          total={items.length}
          sourceRect={sourceRectRef.current}
          onClose={handleClose}
          renderDetailActions={renderDetailActions}
        />
      )}
    </section>
  );
}

/**
 * 独立隔离的数码展厅 3D 详情检视弹窗
 * - 使用 bg-black/80 backdrop-blur-2xl 呈现稳定深邃毛玻璃背景（透出底层 WebGL Shader 光晕，绝不透出其它展台卡片）
 * - 内部拖拽旋转与水波纹状态不会引发父级 WarpCarousel 重绘
 */
function TechDetailModal({
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
  const [inspectMode, setInspectMode] = React.useState<"wake" | "optics" | "xray">("wake");
  const [spinDeg, setSpinDeg] = React.useState<number>(0);

  const figureRef = React.useRef<HTMLDivElement | null>(null);
  const dragRef = React.useRef<{ active: boolean; startX: number; startDeg: number }>({
    active: false,
    startX: 0,
    startDeg: 0,
  });

  // 与服饰滑轨同款的 FLIP 提拉入场动画
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
            transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 45}px) scale(${((scale + 1) / 2) * 1.04}) rotate(-2deg)`,
            offset: 0.5,
          },
          { transform: "none" },
        ],
        { duration: 640, easing: "cubic-bezier(.22,.85,.3,1)" }
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
        className="absolute right-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-white/80 backdrop-blur-md transition hover:border-[#00F0FF] hover:text-[#00F0FF]"
      >
        DOCK TO TABLE ✕
      </button>

      <div className="relative z-10 grid w-full max-w-5xl items-center gap-10 pt-8 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        {/* 左侧：1400px 3D 真实商品图旋转与水波纹折射检视台 */}
        <div
          ref={figureRef}
          className="relative mx-auto flex aspect-[4/5] h-[min(60vh,520px)] w-full max-w-md cursor-grab items-center justify-center active:cursor-grabbing"
          style={{ perspective: "1400px" }}
          onPointerDown={(e) => {
            dragRef.current = { active: true, startX: e.clientX, startDeg: spinDeg };
          }}
          onPointerMove={(e) => {
            if (!dragRef.current.active) return;
            const delta = (e.clientX - dragRef.current.startX) * 0.55;
            setSpinDeg(dragRef.current.startDeg + delta);
          }}
          onPointerUp={() => {
            dragRef.current.active = false;
          }}
        >
          <div
            data-testid="tech-exploded-layers"
            data-exploded={inspectMode === "xray" ? "true" : "false"}
            className="relative size-full transition-transform duration-500 ease-out [transform-style:preserve-3d]"
            style={{
              transform: `rotateY(${spinDeg}deg)`,
            }}
          >
            {/* 正面真实摄影图：带 [backface-visibility:hidden] 防止与背面重叠 */}
            <div className="absolute inset-0 flex items-center justify-center rounded-3xl border border-white/15 bg-white/[0.03] p-6 shadow-2xl [backface-visibility:hidden]">
              {inspectMode === "xray" && item.image ? (
                <WaterRippleImage
                  src={item.image}
                  alt={item.name}
                  blueish={0.4}
                  scale={7}
                  illumination={0.18}
                  surfaceDistortion={0.03}
                  waterDistortion={0.025}
                  className="size-full rounded-2xl"
                />
              ) : (
                item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    draggable={false}
                    className="max-h-full w-auto select-none object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.85)]"
                  />
                )
              )}
            </div>

            {/* 背面真实摄影图：rotateY(180deg) + [backface-visibility:hidden]，翻转到背面时才显示 */}
            <div
              className="absolute inset-0 flex items-center justify-center rounded-3xl border border-white/15 bg-white/[0.04] p-6 shadow-2xl [backface-visibility:hidden]"
              style={{ transform: "rotateY(180deg)" }}
            >
              {item.image && (
                <img
                  src={item.backImage ?? item.image}
                  alt={`${item.name} back`}
                  draggable={false}
                  className="max-h-full w-auto -scale-x-100 select-none object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.85)]"
                />
              )}
            </div>
          </div>
        </div>

        {/* 右侧：商品信息、三态模式切换与 @jahed/glass-button 加购栏 */}
        <div className="flex flex-col gap-4 text-left">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#00F0FF]">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} · WARP HARDWARE ARCHIVE
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

          {/* 视角与液态波纹滤镜切换 */}
          <div className="mt-2 flex flex-wrap gap-3 border-t border-white/15 pt-4">
            {(
              [
                { id: "wake", label: "DISPLAY WAKE · 0°", deg: 0 },
                { id: "optics", label: "OPTICS & CHASSIS · 180°", deg: 180 },
                { id: "xray", label: "X-RAY EXPLODED · RIPPLE", deg: 0 },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setInspectMode(m.id);
                  setSpinDeg(m.deg);
                }}
                className={`rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition ${
                  inspectMode === m.id
                    ? "bg-[#00F0FF] font-semibold text-black"
                    : "border border-white/20 text-white/70 hover:border-[#00F0FF] hover:text-[#00F0FF]"
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

export default TechTableHero;
