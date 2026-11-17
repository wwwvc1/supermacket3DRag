/**
 * 滚轮/触摸切幕防冲突守卫工具
 * 当存在打开的 3D 检视弹窗/购物袋抽屉，或事件源位于内部可滚动容器 ([data-scrollable="true"]) / 表单输入控件内时，
 * 阻止全局 GSAP Observer 误触切幕。
 */
export function shouldIgnoreSceneWheel(
  target: EventTarget | null,
  hasOverlayOpen: boolean
): boolean {
  if (hasOverlayOpen) {
    return true;
  }
  if (!target || !(target instanceof Element)) {
    return false;
  }
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") {
    return true;
  }
  if (target.closest('[data-scrollable="true"]') || target.closest('[role="dialog"]')) {
    return true;
  }
  return false;
}
