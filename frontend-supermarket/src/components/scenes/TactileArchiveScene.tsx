/**
 * 第 02 / 03 / 04 幕 · 三大 3D 触感展厅容器 (TactileArchiveScene)
 * - STAGE I (Scene 02): GARMENT RAIL — 高定服饰金属悬架滑轨 (product-rail-gallery.tsx)
 * - STAGE II (Scene 03): HORIZON TECH TABLE — 旗舰数码极简体验长桌 (tech-table-gallery.tsx)
 * - STAGE III (Scene 04): VITRINE GALLERY — 精品器物博物馆玻璃钟罩展柜 (vitrine-pedestal-gallery.tsx)
 * - 顶部提供三大展厅一键快切开关，内部检视台共用 ScrambleTextPlugin 实时价格/库存解码与加购面板
 */
import React, { useEffect, useRef, useState } from "react";
import { Minus, Plus, Sparkles, Zap } from "lucide-react";
import { ElegantDarkPatternLayers } from "@/components/ui/elegant-dark-pattern";
import GlassButton from "@/components/ui/glass-button";
import ClothingRailHero, { type RailGarment } from "@/components/ui/product-rail-gallery";
import TechTableHero from "@/components/ui/tech-table-gallery";
import VitrineGalleryHero from "@/components/ui/vitrine-pedestal-gallery";
import type { RailCollection, RailGarmentItem } from "../../types/domain";
import { gsap } from "../../lib/gsap";

export type ShowroomStageMode = "rail" | "tech" | "vitrine";

export interface TactileArchiveSceneProps {
  active: boolean;
  stageMode: ShowroomStageMode;
  onStageModeChange: (mode: ShowroomStageMode) => void;
  collections: RailCollection[];
  activeCollectionId: string;
  selectedItemId: string | null;
  onSelectCollection: (id: string) => void;
  onActiveItemChange: (item: RailGarment | null, normalizedX: number) => void;
  onDetailOpenChange: (isOpen: boolean) => void;
  onAddToBag: (item: RailGarmentItem, quantity: number) => void;
}

/**
 * 3D 检视台右侧的 Kora 编辑风实时库存与加购面板
 * 使用 ScrambleTextPlugin 呈现价格与库存的数字解码跳动
 */
function DetailCommercePanel({
  item,
  onAddToBag,
}: {
  item: RailGarmentItem;
  onAddToBag: (item: RailGarmentItem, quantity: number) => void;
}) {
  const [qty, setQty] = useState(1);
  const priceRef = useRef<HTMLSpanElement | null>(null);
  const stockRef = useRef<HTMLSpanElement | null>(null);

  const stock = item.stock ?? 18;
  const soldOut = Boolean(item.outOfStock) || stock <= 0;
  const unitPrice = item.price ?? (Number(String(item.tag ?? "").replace(/[^0-9.]/g, "")) || 68);

  useEffect(() => {
    setQty(1);
    const targetPriceText = item.tag?.startsWith("$") ? item.tag : `¥${unitPrice.toFixed(2)}`;
    const targetStockText = soldOut ? "SOLD OUT · 00" : `IN ARCHIVE · ${String(stock).padStart(2, "0")} PCS`;

    if (priceRef.current) {
      try {
        gsap.to(priceRef.current, {
          duration: 0.55,
          scrambleText: { text: targetPriceText, chars: "0123456789¥$.", speed: 0.6 },
        });
      } catch {
        priceRef.current.textContent = targetPriceText;
      }
    }
    if (stockRef.current) {
      try {
        gsap.to(stockRef.current, {
          duration: 0.55,
          scrambleText: { text: targetStockText, chars: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", speed: 0.6 },
        });
      } catch {
        stockRef.current.textContent = targetStockText;
      }
    }
  }, [item.id, item.tag, unitPrice, stock, soldOut]);

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-baseline justify-between border-b border-white/15 pb-3">
        <div>
          <span className="block font-mono text-[10px] uppercase tracking-[0.26em] text-white/50">
            ARCHIVE VALUATION
          </span>
          <span
            ref={priceRef}
            className="font-mono text-2xl font-semibold tracking-tight text-[#C8C3F2]"
          >
            {item.tag?.startsWith("$") ? item.tag : `¥${unitPrice.toFixed(2)}`}
          </span>
        </div>

        <div className="text-right">
          <span className="block font-mono text-[10px] uppercase tracking-[0.26em] text-white/50">
            LIVE TELEMETRY
          </span>
          <span
            ref={stockRef}
            className={`font-mono text-xs font-semibold tracking-[0.18em] ${
              soldOut ? "text-[#FF2A54]" : "text-[#A8E6CF]"
            }`}
          >
            {soldOut ? "SOLD OUT · 00" : `IN ARCHIVE · ${String(stock).padStart(2, "0")} PCS`}
          </span>
        </div>
      </div>

      {/* 数量调控与 21st.dev @jahed/glass-button 加入购物车按钮 */}
      <div className="flex flex-wrap items-center gap-4">
        {!soldOut && (
          <div className="inline-flex h-11 items-center rounded-full border border-white/20 bg-black/60 px-2 backdrop-blur-md">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex size-7 items-center justify-center rounded-full text-white/70 transition hover:text-white"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-8 text-center font-mono text-xs font-semibold text-white">
              {qty}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQty((q) => Math.min(stock, q + 1))}
              className="flex size-7 items-center justify-center rounded-full text-white/70 transition hover:text-white"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        )}

        <GlassButton
          size="default"
          disabled={soldOut}
          onClick={() => onAddToBag(item, qty)}
          wrapClassName="flex-1"
          className="w-full"
          contentClassName="w-full font-mono text-xs uppercase tracking-[0.18em]"
        >
          <span>{soldOut ? "ARCHIVE DEPLETED" : `ADD TO BAG · ${item.name}`}</span>
          {!soldOut && <Zap className="size-4 text-[#C8C3F2]" />}
        </GlassButton>
      </div>
    </div>
  );
}

const SHOWROOM_STAGES: { mode: ShowroomStageMode; label: string; accent: string }[] = [
  { mode: "rail", label: "STAGE I · GARMENT RAIL", accent: "#C8C3F2" },
  { mode: "tech", label: "STAGE II · TECH TABLE", accent: "#00F0FF" },
  { mode: "vitrine", label: "STAGE III · VITRINE GALLERY", accent: "#A8E6CF" },
];

export function TactileArchiveScene({
  active,
  stageMode,
  onStageModeChange,
  collections,
  activeCollectionId,
  selectedItemId,
  onSelectCollection,
  onActiveItemChange,
  onDetailOpenChange,
  onAddToBag,
}: TactileArchiveSceneProps): React.JSX.Element {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleDetailOpen = (open: boolean) => {
    setIsDetailOpen(open);
    onDetailOpenChange(open);
  };

  if (!active) {
    return <div className="hidden" aria-hidden="true" />;
  }

  const railCollections = collections.filter(
    (c) => c.id !== "tech-table-02" && c.id !== "vitrine-gallery-03"
  );
  const currentRailCollection =
    railCollections.find((c) => c.id === activeCollectionId) ?? railCollections[0];
  const techCollection = collections.find((c) => c.id === "tech-table-02");
  const vitrineCollection = collections.find((c) => c.id === "vitrine-gallery-03");

  return (
    <section
      data-testid="scene-02-archive"
      data-stage-mode={stageMode}
      className="relative flex h-full w-full flex-col justify-center pt-16 pb-14"
    >
      {/* 仅在 03 数码展厅与 04 典藏展柜厅启用 @jatin-yadav05/elegant-dark-pattern 动态光束点阵背景，绝不改动 02 服饰页 */}
      {stageMode !== "rail" && <ElegantDarkPatternLayers className="!bg-transparent -z-10" />}

      {/* 顶部三大 3D 展厅一键快切栏 (Showroom Stage Switcher) */}
      <div
        className={`relative z-30 mx-auto mb-2 flex flex-wrap items-center justify-center gap-2 px-6 transition-opacity duration-200 ${
          isDetailOpen && stageMode !== "rail"
            ? "pointer-events-none invisible opacity-0"
            : "visible opacity-100"
        }`}
      >
        {SHOWROOM_STAGES.map((st) => {
          const isCurrent = stageMode === st.mode;
          return (
            <button
              key={st.mode}
              type="button"
              onClick={() => onStageModeChange(st.mode)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.24em] transition ${
                isCurrent
                  ? "border-white bg-white font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.28)]"
                  : "border-white/15 bg-black/85 text-white/65 hover:border-white/45 hover:text-white"
              }`}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: st.accent }}
              />
              <span>{st.label}</span>
            </button>
          );
        })}

        {/* 服饰滑轨子系列切换（当位于 STAGE I · GARMENT RAIL 且存在多个服饰/实时系列时显示） */}
        {stageMode === "rail" &&
          railCollections.length > 1 &&
          railCollections.map((col) => {
            const isCurrent = col.id === currentRailCollection?.id;
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => onSelectCollection(col.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.2em] transition ${
                  isCurrent
                    ? "border-[#C8C3F2] bg-[#C8C3F2]/20 text-[#C8C3F2]"
                    : "border-white/10 bg-black/60 text-white/45 hover:text-white/80"
                }`}
              >
                <span>{col.title}</span>
              </button>
            );
          })}
      </div>

      {/* STAGE I: 高定服饰金属悬架滑轨 */}
      {stageMode === "rail" && (
        <ClothingRailHero
          items={currentRailCollection?.items ?? []}
          hanger={currentRailCollection?.id === "atelier-01" ? "none" : "matte"}
          eyebrow={`STAGE I · ${currentRailCollection?.title ?? "ATELIER GARMENTS"}`}
          heading="A tactile garment rail you can handle in 3D."
          caption="Brush along the rail, slide a hanger, or lift any piece to spin 360° Front & Back."
          autoplay={false}
          selectedItemId={selectedItemId}
          onActiveItemChange={onActiveItemChange}
          onOpenChange={(index) => handleDetailOpen(index !== null)}
          renderDetailActions={(item) => (
            <DetailCommercePanel item={item} onAddToBag={onAddToBag} />
          )}
          action={
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/90 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-white/65">
              <Sparkles className="size-3 text-[#C8C3F2]" />
              <span>CLICK ANY PIECE ON RAIL TO LIFT & SPIN 360°</span>
            </div>
          }
          className="!bg-transparent"
        />
      )}

      {/* STAGE II: 旗舰数码极简体验长桌 */}
      {stageMode === "tech" && (
        <TechTableHero
          items={techCollection?.items ?? []}
          selectedItemId={selectedItemId}
          onActiveItemChange={onActiveItemChange}
          onOpenChange={(index) => handleDetailOpen(index !== null)}
          renderDetailActions={(item) => (
            <DetailCommercePanel item={item} onAddToBag={onAddToBag} />
          )}
        />
      )}

      {/* STAGE III: 精品器物博物馆玻璃钟罩展柜 */}
      {stageMode === "vitrine" && (
        <VitrineGalleryHero
          items={vitrineCollection?.items ?? []}
          selectedItemId={selectedItemId}
          onActiveItemChange={onActiveItemChange}
          onOpenChange={(index) => handleDetailOpen(index !== null)}
          renderDetailActions={(item) => (
            <DetailCommercePanel item={item} onAddToBag={onAddToBag} />
          )}
        />
      )}
    </section>
  );
}
