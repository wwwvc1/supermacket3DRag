/**
 * 第 01 幕 · OPTICAL PORTAL（21st.dev 45° 斜切百叶窗色散光学冲击波序幕）
 * - 遵循 gsap-plugins (SplitText) 规范：使用遮罩行/词切分完成高定杂志主标题入场
 * - 遵循 Kora 第 1 幕规范：居中圆形缩放填充 EXPLORE ARCHIVE 磁吸按钮
 */
import React, { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap, SplitText, useGSAP } from "../../lib/gsap";

export interface OpticalPortalSceneProps {
  active: boolean;
  onExplore: () => void;
  onOpenOracle: () => void;
}

export function OpticalPortalScene({
  active,
  onExplore,
  onOpenOracle,
}: OpticalPortalSceneProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const exploreBtnRef = useRef<HTMLButtonElement | null>(null);

  useGSAP(
    () => {
      if (!active || !containerRef.current) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        ".portal-eyebrow",
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.65 }
      );

      let splitInstance: { revert?: () => void } | null = null;
      if (titleRef.current) {
        try {
          const split = SplitText.create(titleRef.current, { type: "words" });
          splitInstance = split;
          tl.fromTo(
            split.words,
            { autoAlpha: 0, y: 38, rotateX: -25 },
            { autoAlpha: 1, y: 0, rotateX: 0, stagger: 0.06, duration: 0.75 },
            "-=0.35"
          );
        } catch {
          tl.fromTo(
            titleRef.current,
            { autoAlpha: 0, y: 24 },
            { autoAlpha: 1, y: 0, duration: 0.7 },
            "-=0.35"
          );
        }
      }

      tl.fromTo(
        ".portal-sub",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 },
        "-=0.4"
      );

      return () => {
        splitInstance?.revert?.();
      };
    },
    { scope: containerRef, dependencies: [active] }
  );

  // Kora EXPLORE 按钮磁吸位移 (gsap.quickTo)
  useGSAP(
    () => {
      const btn = exploreBtnRef.current;
      if (!btn) return;
      const xTo = gsap.quickTo(btn, "x", { duration: 0.35, ease: "power3.out" });
      const yTo = gsap.quickTo(btn, "y", { duration: 0.35, ease: "power3.out" });

      const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
        const rect = btn.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        xTo(dx * 0.28);
        yTo(dy * 0.28);
      };
      const onLeave = () => {
        xTo(0);
        yTo(0);
      };

      btn.addEventListener("pointermove", onMove as any);
      btn.addEventListener("pointerleave", onLeave);
      return () => {
        btn.removeEventListener("pointermove", onMove as any);
        btn.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: containerRef }
  );

  if (!active) {
    return <div className="hidden" aria-hidden="true" />;
  }

  return (
    <section
      ref={containerRef}
      data-testid="scene-01-portal"
      className="relative flex h-full w-full flex-col items-center justify-center px-6 pt-16 pb-20"
    >
      {/* 21st.dev 光栅取景框 */}
      <div className="relative flex h-[min(74vh,640px)] w-full max-w-6xl flex-col items-center justify-between overflow-hidden rounded-2xl border border-white/15 bg-black/25 p-8 sm:p-12">
        {/* 顶部宽字距元数据眉标 */}
        <div className="portal-eyebrow flex w-full items-center justify-between font-mono text-[10px] uppercase tracking-[0.34em] text-white/60">
          <span>SCENE 01 / OPTICAL PORTAL</span>
          <span className="hidden sm:inline">45° CHROMATIC DISPERSION FIELD</span>
          <span className="text-[#C8C3F2]">TACTILE ARCHIVE 2026</span>
        </div>

        {/* 中央巨幅紧缩字距标题 + 斜体衬线点睛 */}
        <div className="my-auto flex flex-col items-center text-center">
          <p className="portal-eyebrow mb-4 font-mono text-[11px] uppercase tracking-[0.38em] text-[#C8C3F2]">
            INDEPENDENT SPATIAL COMMERCE STUDIO
          </p>
          <h1
            ref={titleRef}
            className="pointer-events-none select-none text-center text-5xl font-semibold leading-none tracking-tighter text-white sm:text-7xl md:text-8xl"
          >
            CURATED OBJECTS,{" "}
            <span className="kora-serif-italic font-normal text-[#C8C3F2]">
              tactile
            </span>{" "}
            REALITY.
          </h1>
          <p className="portal-sub mt-6 max-w-xl text-center text-xs leading-relaxed tracking-wide text-white/65 sm:text-sm">
            Brush along the brushed-chrome rail, trigger real-time spring collisions,
            and lift any piece into a 1400px 3D inspection stage.
          </p>
        </div>

        {/* 底部 Kora 标志性圆形缩放填充 EXPLORE 按钮 + AI 顾问直达 */}
        <div className="portal-sub flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
          <button
            ref={exploreBtnRef}
            type="button"
            aria-label="EXPLORE ARCHIVE"
            onClick={onExplore}
            className="kora-explore-btn flex size-28 items-center justify-center rounded-full border border-white/40 text-xs font-semibold uppercase tracking-[0.24em] text-white"
          >
            <span className="relative z-10 text-center leading-tight">
              EXPLORE
              <br />
              ARCHIVE
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenOracle}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/80 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-white/80 transition hover:border-[#C8C3F2] hover:text-[#C8C3F2]"
          >
            <span>NEURAL RAG ORACLE</span>
            <ArrowUpRight className="size-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
