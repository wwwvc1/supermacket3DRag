/**
 * Canvas 运行时程序化贴图生成：无缝大理石地砖（颜色 + 法线）、拉丝金属、价签/品牌贴纸
 * 零外部图片依赖，首屏无需下载任何纹理文件。
 */
import * as THREE from 'three'

/** 简易可复现伪随机数（保证每次生成的纹理一致） */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function makeCanvas(size: number) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  return [c, c.getContext('2d')!] as const
}

/** 由灰度高度图计算切线空间法线贴图（Sobel 算子） */
function heightToNormal(height: HTMLCanvasElement, strength: number): HTMLCanvasElement {
  const size = height.width
  const src = height.getContext('2d')!.getImageData(0, 0, size, size).data
  const [out, ctx] = makeCanvas(size)
  const img = ctx.createImageData(size, size)
  const h = (x: number, y: number) => src[(((y + size) % size) * size + ((x + size) % size)) * 4] / 255
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * strength
      const dy = (h(x, y + 1) - h(x, y - 1)) * strength
      const len = Math.hypot(dx, dy, 1)
      const i = (y * size + x) * 4
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255
      img.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255
      img.data[i + 2] = (1 / len) * 0.5 * 255 + 127
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return out
}

/** 生成 2x2 块大理石瓷砖的颜色贴图与法线贴图（砖缝下沉） */
export function createMarbleTextures(size = 1024) {
  const [color, cctx] = makeCanvas(size)
  const [height, hctx] = makeCanvas(size)
  const rand = rng(20261110)
  const tiles = 2
  const tile = size / tiles
  const grout = Math.max(3, size / 256)

  hctx.fillStyle = '#ffffff'
  hctx.fillRect(0, 0, size, size)

  for (let ty = 0; ty < tiles; ty++) {
    for (let tx = 0; tx < tiles; tx++) {
      const x0 = tx * tile
      const y0 = ty * tile
      // 底色：暖白/浅灰交替，模拟不同批次石材
      const base = 228 + Math.floor(rand() * 14)
      cctx.fillStyle = `rgb(${base},${base - 2},${base - 6})`
      cctx.fillRect(x0, y0, tile, tile)
      // 石材纹理：多条贝塞尔细脉络
      cctx.save()
      cctx.beginPath()
      cctx.rect(x0, y0, tile, tile)
      cctx.clip()
      for (let v = 0; v < 9; v++) {
        cctx.strokeStyle = `rgba(${120 + rand() * 40},${120 + rand() * 40},${130 + rand() * 40},${0.08 + rand() * 0.18})`
        cctx.lineWidth = 0.6 + rand() * 2.2
        cctx.beginPath()
        let px = x0 + rand() * tile
        let py = y0
        cctx.moveTo(px, py)
        for (let k = 0; k < 6; k++) {
          const nx = px + (rand() - 0.5) * tile * 0.5
          const ny = py + tile / 5
          cctx.quadraticCurveTo(px + (rand() - 0.5) * tile * 0.4, (py + ny) / 2, nx, ny)
          px = nx
          py = ny
        }
        cctx.stroke()
      }
      cctx.restore()
    }
  }
  // 砖缝：颜色贴图加深，高度图压低
  cctx.fillStyle = 'rgba(150,145,140,0.9)'
  hctx.fillStyle = '#000000'
  for (let i = 0; i <= tiles; i++) {
    const p = i * tile - grout / 2
    cctx.fillRect(p, 0, grout, size)
    cctx.fillRect(0, p, size, grout)
    hctx.fillRect(p, 0, grout, size)
    hctx.fillRect(0, p, size, grout)
  }

  const map = new THREE.CanvasTexture(color)
  map.colorSpace = THREE.SRGBColorSpace
  const normalMap = new THREE.CanvasTexture(heightToNormal(height, 6))
  for (const t of [map, normalMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.anisotropy = 8
  }
  return { map, normalMap }
}

/** 拉丝金属细纹贴图（用于货架层板与立柱的粗糙度扰动） */
export function createBrushedTexture(size = 256) {
  const [c, ctx] = makeCanvas(size)
  const rand = rng(7)
  ctx.fillStyle = '#9a9a9a'
  ctx.fillRect(0, 0, size, size)
  for (let y = 0; y < size; y++) {
    const g = 130 + rand() * 60
    ctx.fillStyle = `rgb(${g},${g},${g})`
    ctx.fillRect(0, y, size, 1)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

/** 文字贴纸纹理：品牌标签、牛奶盒包装、货架价签等 */
export function createLabelTexture(
  lines: string[],
  opts: { bg?: string; fg?: string; width?: number; height?: number; accent?: string } = {},
) {
  const w = opts.width ?? 512
  const h = opts.height ?? 256
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.fillStyle = opts.bg ?? '#ffffff'
  ctx.fillRect(0, 0, w, h)
  if (opts.accent) {
    ctx.fillStyle = opts.accent
    ctx.fillRect(0, h * 0.78, w, h * 0.22)
  }
  ctx.fillStyle = opts.fg ?? '#111827'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  lines.forEach((line, i) => {
    const fs = i === 0 ? h * 0.26 : h * 0.14
    ctx.font = `bold ${fs}px "Microsoft YaHei", "PingFang SC", sans-serif`
    ctx.fillText(line, w / 2, h * (0.3 + i * 0.26), w * 0.92)
  })
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}
