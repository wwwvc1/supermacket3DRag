/**
 * 3D 货架管理器：
 * 1. 根据分区/类型程序化组装 3D 货架（常规金属货架、冷柜玻璃门、数码展台）
 * 2. 精确放置货架点位 (positionX, Y, Z, rotationY)
 * 3. 动态标红与呼吸灯：售罄状态下边框灯带切换为红色脉冲发光 (emissive: 0xff0033)
 * 4. 货架顶端 3D 信息浮标（编码、名称、分区与售罄警示徽章）
 */
import * as THREE from 'three'
import type { SceneShelf, ShelfStatus } from '../types/api'

export interface ShelfInstance {
  data: SceneShelf
  root: THREE.Group
  /** 边框灯带 Mesh 列表（用于售罄呼吸闪烁） */
  accentStrips: THREE.Mesh[]
  /** 顶端悬浮看板 Sprite */
  badgeSprite: THREE.Sprite
  status: ShelfStatus
}

export class ShelfManager {
  readonly shelves = new Map<number, ShelfInstance>()
  readonly colliders: THREE.Object3D[] = []
  readonly group = new THREE.Group()

  // 材质复用
  private metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.85 })
  private shelfMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.7 })
  private glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.05,
    transmission: 0.9,
    transparent: true,
    opacity: 0.95,
    ior: 1.5,
  })
  private normalGlowMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0x22d3ee,
    emissiveIntensity: 1.8,
  })
  private oosGlowMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0xff0033,
    emissiveIntensity: 2.2,
  })

  constructor(private scene: THREE.Scene) {
    this.scene.add(this.group)
  }

  /** 全量构建并排布货架 */
  buildShelves(shelfList: SceneShelf[]) {
    this.clear()
    shelfList.forEach((shelf) => {
      const instance = this.createShelfMesh(shelf)
      this.shelves.set(shelf.id, instance)
      this.group.add(instance.root)
      this.colliders.push(instance.root)
    })
  }

  private clear() {
    this.shelves.forEach((s) => {
      this.group.remove(s.root)
    })
    this.shelves.clear()
    this.colliders.length = 0
  }

  /** 根据货架分区创建对应的 3D 结构 */
  private createShelfMesh(shelf: SceneShelf): ShelfInstance {
    const root = new THREE.Group()
    root.name = `shelf_${shelf.shelfCode}`
    root.position.set(shelf.positionX, shelf.positionY, shelf.positionZ)
    root.rotation.y = shelf.rotationY || 0

    const isFridge = shelf.zone.includes('冷饮') || shelf.zone.includes('生鲜')
    const isTable = shelf.zone.includes('数码') || shelf.zone.includes('外设') || shelf.zone.includes('穿戴')

    const strips: THREE.Mesh[] = []

    if (isTable) {
      // 现代科技展台：宽敞木/金属平铺台面 + 下方 LED 悬浮灯带
      const top = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.1, 1.4), this.metalMat)
      top.position.y = 0.9
      top.castShadow = true
      top.receiveShadow = true
      root.add(top)

      // 4 条金属支腿
      const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.85, 16)
      const legPositions = [
        [-1.6, 0.425, -0.55],
        [1.6, 0.425, -0.55],
        [-1.6, 0.425, 0.55],
        [1.6, 0.425, 0.55],
      ]
      legPositions.forEach(([x, y, z]) => {
        const leg = new THREE.Mesh(legGeo, this.metalMat)
        leg.position.set(x, y, z)
        leg.castShadow = true
        root.add(leg)
      })

      // 台面边缘发光灯带
      const glowStrip = new THREE.Mesh(
        new THREE.BoxGeometry(3.62, 0.03, 1.42),
        shelf.status === 'OUT_OF_STOCK' ? this.oosGlowMat.clone() : this.normalGlowMat.clone()
      )
      glowStrip.position.y = 0.85
      root.add(glowStrip)
      strips.push(glowStrip)

    } else {
      // 多层立式标准货架 (带冷柜玻璃或开放陈列)
      const width = 3.8
      const height = isFridge ? 2.4 : 2.2
      const depth = 1.1

      // 左右立柱与背板
      const back = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.05), this.shelfMat)
      back.position.set(0, height / 2, -depth / 2)
      back.castShadow = true
      root.add(back)

      const sideGeo = new THREE.BoxGeometry(0.06, height, depth)
      const leftSide = new THREE.Mesh(sideGeo, this.metalMat)
      leftSide.position.set(-width / 2, height / 2, 0)
      leftSide.castShadow = true
      root.add(leftSide)

      const rightSide = new THREE.Mesh(sideGeo, this.metalMat)
      rightSide.position.set(width / 2, height / 2, 0)
      rightSide.castShadow = true
      root.add(rightSide)

      // 3 层陈列板
      const tierCount = 3
      const tierGeo = new THREE.BoxGeometry(width - 0.08, 0.05, depth - 0.08)
      for (let i = 0; i < tierCount; i++) {
        const tier = new THREE.Mesh(tierGeo, this.metalMat)
        tier.position.set(0, 0.35 + i * 0.65, 0)
        tier.receiveShadow = true
        root.add(tier)
      }

      // 顶部发光招牌边框
      const topStrip = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.08, 0.08),
        shelf.status === 'OUT_OF_STOCK' ? this.oosGlowMat.clone() : this.normalGlowMat.clone()
      )
      topStrip.position.set(0, height - 0.04, depth / 2)
      root.add(topStrip)
      strips.push(topStrip)

      // 若是冷饮柜，增加透明通透玻璃推拉门
      if (isFridge) {
        const doorGeo = new THREE.BoxGeometry((width - 0.2) / 2, height - 0.4, 0.02)
        const leftDoor = new THREE.Mesh(doorGeo, this.glassMat)
        leftDoor.position.set(-width / 4, height / 2, depth / 2 - 0.04)
        root.add(leftDoor)

        const rightDoor = new THREE.Mesh(doorGeo, this.glassMat)
        rightDoor.position.set(width / 4, height / 2, depth / 2 - 0.02)
        root.add(rightDoor)
      }
    }

    // 顶端悬浮看板 Sprite
    const badgeSprite = this.createBadgeSprite(shelf)
    const badgeHeight = isTable ? 1.6 : 2.7
    badgeSprite.position.set(0, badgeHeight, 0)
    root.add(badgeSprite)

    return {
      data: shelf,
      root,
      accentStrips: strips,
      badgeSprite,
      status: shelf.status,
    }
  }

  /** 创建货架顶端 2D 悬浮标牌 Sprite (Canvas 绘制) */
  private createBadgeSprite(shelf: SceneShelf): THREE.Sprite {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 160
    this.renderBadgeCanvas(canvas, shelf)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(2.2, 0.68, 1)
    sprite.renderOrder = 999
    return sprite
  }

  /** 在 Canvas 上绘制货架顶端标牌内容 */
  private renderBadgeCanvas(canvas: HTMLCanvasElement, shelf: SceneShelf) {
    const ctx = canvas.getContext('2d')!
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    const isOOS = shelf.status === 'OUT_OF_STOCK'

    // 背景半透明圆角矩形
    ctx.save()
    ctx.fillStyle = isOOS ? 'rgba(127, 29, 29, 0.88)' : 'rgba(15, 23, 42, 0.85)'
    ctx.strokeStyle = isOOS ? '#ef4444' : '#38bdf8'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.roundRect(8, 8, w - 16, h - 16, 20)
    ctx.fill()
    ctx.stroke()

    // 货架编码徽章
    ctx.fillStyle = isOOS ? '#dc2626' : '#0284c7'
    ctx.beginPath()
    ctx.roundRect(24, 24, 96, h - 48, 12)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 36px "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(shelf.shelfCode, 72, h / 2)

    // 货架名称与分区
    ctx.textAlign = 'left'
    ctx.font = 'bold 32px "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#f8fafc'
    ctx.fillText(shelf.name, 136, 52)

    ctx.font = '24px "Microsoft YaHei", sans-serif'
    ctx.fillStyle = '#94a3b8'
    ctx.fillText(shelf.zone, 136, 102)

    // 售罄警示标签
    if (isOOS) {
      ctx.textAlign = 'right'
      ctx.fillStyle = '#fecaca'
      ctx.font = 'bold 28px "Microsoft YaHei", sans-serif'
      ctx.fillText('⚠️ 已售罄', w - 28, 54)
    }

    ctx.restore()
  }

  /** 动态更新货架状态 (NORMAL / OUT_OF_STOCK) */
  setShelfStatus(shelfId: number, status: ShelfStatus) {
    const inst = this.shelves.get(shelfId)
    if (!inst || inst.status === status) return

    inst.status = status
    inst.data.status = status

    // 重新渲染 Sprite 贴图
    const sprite = inst.badgeSprite
    const canvas = (sprite.material.map as THREE.CanvasTexture).image as HTMLCanvasElement
    this.renderBadgeCanvas(canvas, inst.data)
    sprite.material.map!.needsUpdate = true

    // 切换灯带材质
    inst.accentStrips.forEach((strip) => {
      const mat = strip.material as THREE.MeshStandardMaterial
      if (status === 'OUT_OF_STOCK') {
        mat.emissive.setHex(0xff0033)
        mat.emissiveIntensity = 2.4
      } else {
        mat.emissive.setHex(0x22d3ee)
        mat.emissiveIntensity = 1.8
      }
    })
  }

  /** 帧更新：售罄货架的红色呼吸灯闪烁效果 */
  update(elapsedTime: number) {
    this.shelves.forEach((inst) => {
      if (inst.status === 'OUT_OF_STOCK') {
        const pulse = 1.6 + Math.sin(elapsedTime * 4) * 0.9
        inst.accentStrips.forEach((strip) => {
          (strip.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse
        })
      }
    })
  }
}
