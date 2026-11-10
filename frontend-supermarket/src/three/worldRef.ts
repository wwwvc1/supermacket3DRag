/**
 * 3D 世界单例引用：供 Pinia store 与 HUD 组件调用运镜、标红等能力
 */
import type { SupermarketWorld } from './SupermarketWorld'

let current: SupermarketWorld | null = null

export function setWorld(w: SupermarketWorld | null) {
  current = w
}

export function getWorld(): SupermarketWorld | null {
  return current
}
