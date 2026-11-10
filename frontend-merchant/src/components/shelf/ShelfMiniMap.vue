<script setup lang="ts">
/**
 * 货架俯视小地图（Canvas）
 * - 横轴为世界 X（-20 ~ 20 米），纵轴为世界 Z（-25 ~ 15 米，向下为 +Z）
 * - 货架绘制为按 rotationY 旋转的矩形，颜色按状态区分
 * - 正在编辑的货架实时高亮，随表单数值变化重绘
 */
import { onMounted, ref, watch } from 'vue'
import type { Shelf } from '@/types/api'

/** 场景边界（米） */
const BOUNDS = { minX: -20, maxX: 20, minZ: -25, maxZ: 15 }
/** 货架在俯视图中的示意尺寸（米）：长沿本地 X 轴，宽沿本地 Z 轴 */
const SHELF_LEN = 4
const SHELF_DEPTH = 1

const props = withDefaults(
  defineProps<{
    shelves: Shelf[]
    /** 正在编辑的货架（表单实时值），可为空 */
    highlight?: Partial<Shelf> | null
    size?: number
  }>(),
  { highlight: null, size: 360 }
)

const canvasRef = ref<HTMLCanvasElement | null>(null)

/** 世界坐标 → 画布像素 */
function toCanvas(x: number, z: number, w: number, h: number): [number, number] {
  const px = ((x - BOUNDS.minX) / (BOUNDS.maxX - BOUNDS.minX)) * w
  const py = ((z - BOUNDS.minZ) / (BOUNDS.maxZ - BOUNDS.minZ)) * h
  return [px, py]
}

/** 绘制单个货架矩形 */
function drawShelf(ctx: CanvasRenderingContext2D, s: Partial<Shelf>, w: number, h: number, active: boolean) {
  const x = Number(s.positionX ?? 0)
  const z = Number(s.positionZ ?? 0)
  const rot = Number(s.rotationY ?? 0)
  const [px, py] = toCanvas(x, z, w, h)
  const scale = w / (BOUNDS.maxX - BOUNDS.minX)
  ctx.save()
  ctx.translate(px, py)
  // Three.js 绕 Y 轴正向旋转在俯视（Z 向下）画布中表现为逆向旋转
  ctx.rotate(-rot)
  const rw = SHELF_LEN * scale
  const rh = SHELF_DEPTH * scale
  const oos = s.status === 'OUT_OF_STOCK'
  ctx.fillStyle = active ? 'rgba(64,158,255,0.85)' : oos ? 'rgba(245,108,108,0.85)' : 'rgba(103,194,58,0.75)'
  ctx.strokeStyle = active ? '#1d4ed8' : oos ? '#c45656' : '#529b2e'
  ctx.lineWidth = active ? 2 : 1
  ctx.fillRect(-rw / 2, -rh / 2, rw, rh)
  ctx.strokeRect(-rw / 2, -rh / 2, rw, rh)
  ctx.restore()
  // 标注货架编码
  ctx.fillStyle = active ? '#1d4ed8' : '#606266'
  ctx.font = `${active ? 'bold ' : ''}11px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(s.shelfCode || '新货架', px, py - rh / 2 - 6)
}

/** 绘制网格与起点 */
function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#fafbfc'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = '#ebeef5'
  ctx.lineWidth = 1
  for (let x = BOUNDS.minX; x <= BOUNDS.maxX; x += 5) {
    const [px] = toCanvas(x, 0, w, h)
    ctx.beginPath()
    ctx.moveTo(px, 0)
    ctx.lineTo(px, h)
    ctx.stroke()
  }
  for (let z = BOUNDS.minZ; z <= BOUNDS.maxZ; z += 5) {
    const [, py] = toCanvas(0, z, w, h)
    ctx.beginPath()
    ctx.moveTo(0, py)
    ctx.lineTo(w, py)
    ctx.stroke()
  }
  // 导购起点 (0, 0)
  const [ox, oz] = toCanvas(0, 0, w, h)
  ctx.fillStyle = '#e6a23c'
  ctx.beginPath()
  ctx.arc(ox, oz, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#909399'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('起点', ox + 6, oz + 4)
}

/** 全量重绘（支持高清屏） */
function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  const w = props.size
  const h = props.size
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawGrid(ctx, w, h)
  const hl = props.highlight
  props.shelves.forEach((s) => {
    if (hl && hl.id != null && s.id === hl.id) return
    drawShelf(ctx, s, w, h, false)
  })
  if (hl) drawShelf(ctx, hl, w, h, true)
}

watch(() => [props.shelves, props.highlight, props.size], draw, { deep: true })
onMounted(draw)
</script>

<template>
  <div class="inline-block">
    <canvas ref="canvasRef" class="rounded border border-gray-200" />
    <div class="flex gap-4 mt-2 text-xs text-gray-500">
      <span><i class="inline-block w-3 h-2 mr-1 bg-green-500/75" />正常</span>
      <span><i class="inline-block w-3 h-2 mr-1 bg-red-400" />售罄</span>
      <span><i class="inline-block w-3 h-2 mr-1 bg-blue-400" />编辑中</span>
      <span>X ∈ [-20, 20]，Z ∈ [-25, 15]（米）</span>
    </div>
  </div>
</template>
