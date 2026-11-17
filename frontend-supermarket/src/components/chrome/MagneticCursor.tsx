/**
 * Kora 磁性双环自定义光标 (MagneticCursor)
 * 遵循 gsap-performance 规范：使用 gsap.quickTo() 在合成层实现 60fps 零布局抖动光标跟随
 */
import React, { useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";

export function MagneticCursor(): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const dot = dotRef.current;
      const ring = ringRef.current;
      if (!dot || !ring || typeof window === "undefined") return;

      const xDot = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3.out" });
      const yDot = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3.out" });
      const xRing = gsap.quickTo(ring, "x", { duration: 0.38, ease: "power3.out" });
      const yRing = gsap.quickTo(ring, "y", { duration: 0.38, ease: "power3.out" });

      const onMove = (e: PointerEvent) => {
        xDot(e.clientX);
        yDot(e.clientY);
        xRing(e.clientX);
        yRing(e.clientY);

        const target = e.target instanceof Element ? e.target : null;
        const interactive = target?.closest("button, a, input, textarea, [data-garment]");
        gsap.to(ring, {
          scale: interactive ? 1.75 : 1,
          borderColor: interactive ? "#C8C3F2" : "rgba(255,255,255,0.35)",
          duration: 0.25,
          overwrite: "auto",
        });
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      return () => window.removeEventListener("pointermove", onMove);
    },
    { scope: rootRef }
  );

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] hidden md:block"
    >
      <div
        ref={dotRef}
        className="fixed left-0 top-0 -ml-1 -mt-1 size-2 rounded-full bg-[#C8C3F2] mix-blend-difference will-change-transform"
      />
      <div
        ref={ringRef}
        className="fixed left-0 top-0 -ml-4 -mt-4 size-8 rounded-full border border-white/35 mix-blend-difference will-change-transform"
      />
    </div>
  );
}
