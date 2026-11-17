"use client";

/**
 * 21st.dev @jatin-yadav05/components/elegant-dark-pattern 动态光束与点阵暗色背景组件
 * - 1:1 还原 5 道 45° 倾斜青色体积光束 (rgb(0, 207, 255) + 90deg 多段渐变遮罩 + skewX(45deg))
 * - 叠加左上角径向辉光、胶片颗粒噪点层、20px×20px 微米级星点矩阵与中心暗角
 * - 为 5 道青色体积光束赋予呼吸漂移动效，既可用作全局展厅背景，也可用作商品详情弹窗的毛玻璃动态底座
 */
import * as React from "react";

export interface ElegantDarkPatternProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  /** 是否作为半透明毛玻璃弹窗遮罩模式（透出底层光效同时保持光束与点阵清晰可见） */
  translucent?: boolean;
}

const LIGHT_SHAFT_MASKS = [
  "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 20%, rgba(0, 0, 0, 0) 36%, rgb(0, 0, 0) 55%, rgba(0, 0, 0, 0.13) 67%, rgb(0, 0, 0) 78%, rgba(0, 0, 0, 0) 97%)",
  "linear-gradient(90deg, rgba(0, 0, 0, 0) 11%, rgb(0, 0, 0) 25%, rgba(0, 0, 0, 0.55) 41%, rgba(0, 0, 0, 0.13) 67%, rgb(0, 0, 0) 78%, rgba(0, 0, 0, 0) 97%)",
  "linear-gradient(90deg, rgba(0, 0, 0, 0) 9%, rgb(0, 0, 0) 20%, rgba(0, 0, 0, 0.55) 28%, rgba(0, 0, 0, 0.424) 40%, rgb(0, 0, 0) 48%, rgba(0, 0, 0, 0.267) 54%, rgba(0, 0, 0, 0.13) 78%, rgb(0, 0, 0) 88%, rgba(0, 0, 0, 0) 97%)",
  "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 17%, rgba(0, 0, 0, 0.55) 26%, rgb(0, 0, 0) 35%, rgba(0, 0, 0, 0) 47%, rgba(0, 0, 0, 0.13) 69%, rgb(0, 0, 0) 79%, rgba(0, 0, 0, 0) 97%)",
  "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 20%, rgba(0, 0, 0, 0.55) 27%, rgb(0, 0, 0) 42%, rgba(0, 0, 0, 0) 48%, rgba(0, 0, 0, 0.13) 67%, rgb(0, 0, 0) 74%, rgba(0, 0, 0) 82%, rgba(0, 0, 0, 0.47) 88%, rgba(0, 0, 0, 0) 97%)",
] as const;

/**
 * 纯背景图层栈（可直接嵌入全屏 Stage 或详情弹窗 Backdrop）
 */
export function ElegantDarkPatternLayers({
  translucent = false,
  className = "",
}: {
  translucent?: boolean;
  className?: string;
}): React.JSX.Element {
  return (
    <div
      data-elegant-dark-pattern
      className={`pointer-events-none absolute inset-0 overflow-hidden ${
        translucent ? "bg-black/75 backdrop-blur-2xl" : "bg-black"
      } ${className}`}
    >
      {/* Layer 1: 左上角径向环境辉光与 5 道 45° 斜射青色体积光束 */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-100"
          style={{
            background:
              "radial-gradient(100% 100% at 0% 0%, rgb(46, 46, 46) 0%, rgb(0, 0, 0) 100%)",
            mask: "radial-gradient(125% 100% at 0% 0%, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0.224) 88.2883%, rgba(0, 0, 0, 0) 100%)",
            WebkitMask:
              "radial-gradient(125% 100% at 0% 0%, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0.224) 88.2883%, rgba(0, 0, 0, 0) 100%)",
          }}
        >
          {LIGHT_SHAFT_MASKS.map((maskStr, idx) => (
            <div
              key={idx}
              data-light-shaft={idx + 1}
              className="elegant-light-shaft absolute inset-0 opacity-25"
              style={{
                background:
                  "linear-gradient(rgb(0, 207, 255) 0%, rgba(0, 207, 255, 0) 100%)",
                mask: maskStr,
                WebkitMask: maskStr,
                transform: "skewX(45deg)",
                animationDelay: `${idx * -1.6}s`,
                animationDuration: `${7 + idx * 1.4}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Layer 2: 21st.dev 胶片颗粒微纹理层 */}
      <div
        className="absolute inset-0 bg-repeat opacity-5"
        style={{
          backgroundImage: `url("https://cdn.21st.dev/assets/mirror/f5/f55dfc553c100e6da0ad95258a042b4100f0ff4bb03a5313d1f541984275e262.png")`,
          backgroundSize: "149.76px auto",
        }}
      />

      {/* Layer 3: 20px × 20px 精密星点矩阵网格 */}
      <div
        data-dot-grid
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.5) 1px, transparent 0px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Layer 4: 中心冷灰蓝环境晕影 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(30, 41, 59, 0.24) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

export function ElegantDarkPattern({
  title = "Dark Gradient Background",
  description = "A clean, dark gradient background with subtle patterns and textures.",
  children,
  className = "",
  translucent = false,
}: ElegantDarkPatternProps): React.JSX.Element {
  return (
    <div className={`relative min-h-screen w-full overflow-hidden bg-black ${className}`}>
      <ElegantDarkPatternLayers translucent={translucent} />
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        {children || (
          <div className="space-y-6 p-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white">{title}</h1>
            <p className="mx-auto max-w-md text-lg text-gray-300">{description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ElegantDarkPattern;
