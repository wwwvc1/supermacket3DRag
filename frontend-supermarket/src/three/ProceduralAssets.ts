/**
 * 程序化商品模型库：按商品类目生成高精几何组合模板（供 InstancedMesh 批量实例化）
 * 每个模板由若干 Part（几何体 + 材质 + 局部变换）组成，原点位于商品底面中心。
 * 预留 GLB 替换口：未来可在 ProductInstancer 中优先加载 /models/{category}.glb。
 */
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { createLabelTexture } from './textures'

export interface Part {
  geometry: THREE.BufferGeometry
  material: THREE.Material
  matrix: THREE.Matrix4
}

export interface ProductTemplate {
  parts: Part[]
  /** 包围尺寸（米），用于货架陈列排布 */
  size: { w: number; h: number; d: number }
}

const cache = new Map<string, ProductTemplate>()

const m4 = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(s, s, s),
  )

const std = (color: number, roughness = 0.4, metalness = 0, extra: THREE.MeshPhysicalMaterialParameters = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness, metalness, ...extra })

/** iPhone：钛金属边框 + 黑色玻璃屏 + 三摄模组（斜靠展示） */
function phone(): ProductTemplate {
  const tilt = -0.25
  const body = std(0x2b2b2e, 0.25, 0.9)
  const glass = std(0x05070a, 0.05, 0, { clearcoat: 1, emissive: 0x0b1a33, emissiveIntensity: 0.6 })
  const lens = std(0x111111, 0.1, 0.6)
  return {
    size: { w: 0.1, h: 0.17, d: 0.08 },
    parts: [
      { geometry: new RoundedBoxGeometry(0.078, 0.162, 0.009, 4, 0.008), material: body, matrix: m4(0, 0.085, 0, tilt) },
      { geometry: new THREE.PlaneGeometry(0.072, 0.155), material: glass, matrix: m4(0, 0.085 + 0.0012, 0.0047, tilt) },
      { geometry: new RoundedBoxGeometry(0.034, 0.034, 0.004, 2, 0.006), material: body, matrix: m4(-0.016, 0.145, -0.022, tilt) },
      { geometry: new THREE.CylinderGeometry(0.0065, 0.0065, 0.005, 20), material: lens, matrix: m4(-0.024, 0.15, -0.026, tilt + Math.PI / 2) },
      { geometry: new THREE.CylinderGeometry(0.0065, 0.0065, 0.005, 20), material: lens, matrix: m4(-0.008, 0.145, -0.024, tilt + Math.PI / 2) },
    ],
  }
}

/** 头戴降噪耳机：弧形头梁 + 双耳罩 */
function headphones(): ProductTemplate {
  const shell = std(0x1f2937, 0.55, 0.1)
  const pad = std(0x111111, 0.9)
  const metal = std(0xb0b6bf, 0.3, 0.9)
  return {
    size: { w: 0.22, h: 0.24, d: 0.12 },
    parts: [
      { geometry: new THREE.TorusGeometry(0.09, 0.012, 12, 32, Math.PI), material: shell, matrix: m4(0, 0.13, 0) },
      { geometry: new THREE.CylinderGeometry(0.048, 0.048, 0.035, 28), material: shell, matrix: m4(-0.09, 0.07, 0, 0, 0, Math.PI / 2) },
      { geometry: new THREE.CylinderGeometry(0.048, 0.048, 0.035, 28), material: shell, matrix: m4(0.09, 0.07, 0, 0, 0, Math.PI / 2) },
      { geometry: new THREE.TorusGeometry(0.038, 0.012, 10, 24), material: pad, matrix: m4(-0.07, 0.07, 0, 0, Math.PI / 2) },
      { geometry: new THREE.TorusGeometry(0.038, 0.012, 10, 24), material: pad, matrix: m4(0.07, 0.07, 0, 0, Math.PI / 2) },
      { geometry: new THREE.CylinderGeometry(0.004, 0.004, 0.06, 8), material: metal, matrix: m4(-0.09, 0.11, 0) },
      { geometry: new THREE.CylinderGeometry(0.004, 0.004, 0.06, 8), material: metal, matrix: m4(0.09, 0.11, 0) },
    ],
  }
}

/** 87 键 RGB 机械键盘：铝合金外壳 + 键帽阵列 + 发光底灯 */
function keyboard(): ProductTemplate {
  const caseMat = std(0x374151, 0.35, 0.8)
  const capMat = std(0xe5e7eb, 0.6)
  const rgb = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xa855f7, emissiveIntensity: 2.4 })
  const parts: Part[] = [
    { geometry: new RoundedBoxGeometry(0.36, 0.03, 0.13, 3, 0.006), material: caseMat, matrix: m4(0, 0.015, 0, 0.08) },
    { geometry: new THREE.BoxGeometry(0.352, 0.004, 0.122), material: rgb, matrix: m4(0, 0.031, 0, 0.08) },
  ]
  // 键帽合并为单一几何体，减少 Draw Call
  const caps: THREE.BufferGeometry[] = []
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 15; c++) {
      const g = new THREE.BoxGeometry(0.018, 0.009, 0.018)
      g.applyMatrix4(m4(-0.165 + c * 0.0236, 0.04 + r * 0.0018, -0.048 + r * 0.0236, 0.08))
      caps.push(g)
    }
  }
  parts.push({ geometry: mergeSimple(caps), material: capMat, matrix: m4() })
  return { size: { w: 0.38, h: 0.06, d: 0.15 }, parts }
}

/** Apple Watch：方形表壳 + 表带 + 发光表盘，立于展示托上 */
function watch(): ProductTemplate {
  const caseMat = std(0xd1d5db, 0.2, 1)
  const band = std(0xf97316, 0.7)
  const screen = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x38bdf8, emissiveIntensity: 1.2 })
  const stand = std(0xf8fafc, 0.3)
  return {
    size: { w: 0.08, h: 0.12, d: 0.08 },
    parts: [
      { geometry: new THREE.CylinderGeometry(0.03, 0.035, 0.05, 24), material: stand, matrix: m4(0, 0.025, 0) },
      { geometry: new THREE.TorusGeometry(0.03, 0.01, 8, 24), material: band, matrix: m4(0, 0.07, 0, 0, Math.PI / 2) },
      { geometry: new RoundedBoxGeometry(0.04, 0.046, 0.012, 3, 0.008), material: caseMat, matrix: m4(0, 0.075, 0.035) },
      { geometry: new THREE.PlaneGeometry(0.033, 0.039), material: screen, matrix: m4(0, 0.075, 0.0412) },
    ],
  }
}

/** 27 英寸 Mini-LED 显示器：超窄边框屏幕 + 支架底座 */
function monitor(): ProductTemplate {
  const frame = std(0x111827, 0.3, 0.6)
  const screen = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x6366f1, emissiveIntensity: 0.9, roughness: 0.1 })
  const metal = std(0x9ca3af, 0.25, 1)
  return {
    size: { w: 0.62, h: 0.48, d: 0.2 },
    parts: [
      { geometry: new RoundedBoxGeometry(0.62, 0.36, 0.025, 3, 0.006), material: frame, matrix: m4(0, 0.3, 0) },
      { geometry: new THREE.PlaneGeometry(0.6, 0.34), material: screen, matrix: m4(0, 0.3, 0.0131) },
      { geometry: new THREE.BoxGeometry(0.04, 0.2, 0.025), material: metal, matrix: m4(0, 0.1, -0.04) },
      { geometry: new RoundedBoxGeometry(0.24, 0.012, 0.16, 2, 0.005), material: metal, matrix: m4(0, 0.006, -0.02) },
    ],
  }
}

/** 特仑苏牛奶整箱：印刷包装纸箱 */
function milk(): ProductTemplate {
  const box = new THREE.MeshPhysicalMaterial({
    map: createLabelTexture(['特仑苏', '有机纯牛奶 250ml×12'], { bg: '#f8fafc', fg: '#14532d', accent: '#16a34a' }),
    roughness: 0.6,
  })
  return {
    size: { w: 0.3, h: 0.2, d: 0.2 },
    parts: [{ geometry: new THREE.BoxGeometry(0.28, 0.19, 0.18), material: box, matrix: m4(0, 0.095, 0) }],
  }
}

/** 红富士苹果篮：藤编果篮 + 堆叠苹果 */
function apples(): ProductTemplate {
  const basket = std(0x92400e, 0.85)
  const apple = std(0xb91c1c, 0.35, 0, { clearcoat: 0.6, clearcoatRoughness: 0.3 })
  const appleGeo: THREE.BufferGeometry[] = []
  const pos = [[-0.05, 0], [0.05, 0], [0, 0.05], [0, -0.05], [0, 0]]
  pos.forEach(([x, z], i) => {
    const g = new THREE.SphereGeometry(0.038, 18, 14)
    g.scale(1, 0.9, 1)
    g.applyMatrix4(m4(x, i === 4 ? 0.12 : 0.08, z))
    appleGeo.push(g)
  })
  return {
    size: { w: 0.24, h: 0.17, d: 0.24 },
    parts: [
      { geometry: new THREE.CylinderGeometry(0.11, 0.08, 0.08, 24, 1, true), material: basket, matrix: m4(0, 0.04, 0) },
      { geometry: new THREE.CircleGeometry(0.08, 24), material: basket, matrix: m4(0, 0.002, 0, -Math.PI / 2) },
      { geometry: mergeSimple(appleGeo), material: apple, matrix: m4() },
    ],
  }
}

/** 默认通用商品盒（新增类目兜底） */
function genericBox(name: string): ProductTemplate {
  const mat = new THREE.MeshPhysicalMaterial({
    map: createLabelTexture([name.slice(0, 8), '智慧超市精选'], { bg: '#e0f2fe', fg: '#0c4a6e', accent: '#0284c7' }),
    roughness: 0.5,
  })
  return {
    size: { w: 0.18, h: 0.22, d: 0.12 },
    parts: [{ geometry: new THREE.BoxGeometry(0.16, 0.22, 0.1), material: mat, matrix: m4(0, 0.11, 0) }],
  }
}

/** 合并若干非索引/索引几何体（仅保留 position/normal/uv） */
function mergeSimple(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const list = geos.map((g) => (g.index ? g.toNonIndexed() : g))
  const attrs = ['position', 'normal', 'uv'] as const
  const merged = new THREE.BufferGeometry()
  for (const a of attrs) {
    const size = list[0].getAttribute(a).itemSize
    const total = list.reduce((s, g) => s + g.getAttribute(a).array.length, 0)
    const arr = new Float32Array(total)
    let off = 0
    for (const g of list) {
      arr.set(g.getAttribute(a).array as Float32Array, off)
      off += g.getAttribute(a).array.length
    }
    merged.setAttribute(a, new THREE.BufferAttribute(arr, size))
  }
  return merged
}

/** 按类目/名称获取（带缓存的）商品模板 */
export function getProductTemplate(category: string, name: string): ProductTemplate {
  const key = `${category}|${category ? '' : name}`
  const hit = cache.get(key)
  if (hit) return hit
  const c = category || ''
  let t: ProductTemplate
  if (c.includes('手机')) t = phone()
  else if (c.includes('影音') || name.includes('耳机')) t = headphones()
  else if (c.includes('外设') || name.includes('键盘')) t = keyboard()
  else if (c.includes('穿戴') || name.includes('手表')) t = watch()
  else if (c.includes('办公') || name.includes('显示器')) t = monitor()
  else if (c.includes('乳品') || name.includes('奶')) t = milk()
  else if (c.includes('生鲜') || name.includes('果')) t = apples()
  else t = genericBox(name)
  cache.set(key, t)
  return t
}
