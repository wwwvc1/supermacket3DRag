/**
 * GSAP 核心与官方插件统一注册入口
 * 严格遵循 gsap-core、gsap-react、gsap-plugins、gsap-timeline、gsap-performance、gsap-utils 技能规范
 */
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Observer } from "gsap/Observer";
import { Flip } from "gsap/Flip";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { CustomEase } from "gsap/CustomEase";

let registered = false;

/**
 * 在应用启动时一次性注册全部 GSAP 插件与 Kora 戏剧性缓动曲线
 */
export function ensureGsapRegistered(): void {
  if (registered) return;
  try {
    gsap.registerPlugin(useGSAP, Observer, Flip, SplitText, ScrambleTextPlugin, CustomEase);
    CustomEase.create("koraEase", "0.74, -0.02, 0.94, -0.32");
    CustomEase.create("koraOut", "0.16, 1, 0.3, 1");
    gsap.defaults({ duration: 0.65, ease: "power3.out" });
  } catch {
    // 兼容无 DOM 或受限测试环境
  }
  registered = true;
}

ensureGsapRegistered();

export { gsap, useGSAP, Observer, Flip, SplitText, ScrambleTextPlugin, CustomEase };
