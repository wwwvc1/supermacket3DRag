/**
 * 商品陈列、空间拾取与点击悬浮旋转管理器 (ProductInstancer.ts)
 * 1. 遍历各商户店铺/货架，实例化商品 3D 模型
 * 2. 悬浮旋转特效：点击商品时，商品平滑浮起离开台面 (+0.38m) 并保持 360 度匀速旋转与全息光圈
 * 3. 实时响应库存变动：售罄时半透明或隐藏对应陈列件
 */
import * as THREE from 'three'
import gsap from 'gsap'
import type { Product, SceneShelf } from '../types/api'
import { getProductTemplate, type ProductTemplate } from './ProceduralAssets'

export interface PlacedProduct {
  product: Product
  shelf: SceneShelf
  root: THREE.Group
  pickBox: THREE.Mesh
  origY: number
  origRotY: number
}

interface ActiveShowcase {
  item: PlacedProduct
  ring: THREE.Mesh
}

export class ProductInstancer {
  readonly group = new THREE.Group()
  /** 可被鼠标射线拾取的网格列表 */
  readonly pickables: THREE.Mesh[] = []
  private placedProducts = new Map<number, PlacedProduct[]>()

  /** 当前被点击正在悬浮 360° 旋转的商品 */
  private activeShowcase: ActiveShowcase | null = null

  constructor(private scene: THREE.Scene) {
    this.scene.add(this.group)
  }

  /** 全量排布全场货架上的在架商品 */
  populate(shelves: SceneShelf[]) {
    this.clear()
    shelves.forEach((shelf) => {
      this.populateShelf(shelf)
    })
  }

  private clear() {
    this.resetShowcase()
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0])
    }
    this.pickables.length = 0
    this.placedProducts.clear()
  }

  /** 在单个货架/展台上排布其归属的商品 */
  private populateShelf(shelf: SceneShelf) {
    if (!shelf.products || shelf.products.length === 0) return

    const isTable =
      shelf.zone.includes('数码') ||
      shelf.zone.includes('外设') ||
      shelf.zone.includes('穿戴') ||
      shelf.zone.includes('电竞') ||
      shelf.zone.includes('影音') ||
      shelf.zone.includes('办公')
    const shelfY = isTable ? 0.95 : 0.4

    // 展台朝向自动对齐门店大门迎客方向
    const rotY =
      shelf.rotationY != null && shelf.rotationY !== 0
        ? shelf.rotationY
        : shelf.positionX < -5
          ? Math.PI / 2
          : shelf.positionX > 5
            ? -Math.PI / 2
            : 0

    shelf.products.forEach((product, pIdx) => {
      const template = getProductTemplate(product.category, product.name)
      const count = Math.min(Math.max(product.stock, 0), isTable ? 3 : 5)
      const list: PlacedProduct[] = []

      for (let i = 0; i < (count > 0 ? count : 1); i++) {
        const itemGroup = this.instantiateTemplate(template)

        // 计算横向分布坐标
        const spacing = 0.55
        const offsetX = (i - ((count > 0 ? count : 1) - 1) / 2) * spacing
        const offsetY = shelfY + (isTable ? 0 : (pIdx % 3) * 0.65)
        const offsetZ = 0

        // 局部坐标转换到货架世界位姿
        const localPos = new THREE.Vector3(offsetX, offsetY, offsetZ)
        localPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY)

        const worldX = shelf.positionX + localPos.x
        const worldY = shelf.positionY + localPos.y
        const worldZ = shelf.positionZ + localPos.z

        itemGroup.position.set(worldX, worldY, worldZ)
        itemGroup.rotation.y = rotY

        // 附加拾取透明外壳
        const pickBox = new THREE.Mesh(
          new THREE.BoxGeometry(
            Math.max(template.size.w, 0.4),
            Math.max(template.size.h, 0.4),
            Math.max(template.size.d, 0.4)
          ),
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
        )
        pickBox.position.y = template.size.h / 2
        pickBox.userData = { productId: product.id, shelfId: shelf.id }
        itemGroup.add(pickBox)
        this.pickables.push(pickBox)

        // 若库存为 0，标记半透明灰色
        if (product.stock <= 0) {
          itemGroup.visible = false
        }

        this.group.add(itemGroup)
        list.push({
          product,
          shelf,
          root: itemGroup,
          pickBox,
          origY: worldY,
          origRotY: rotY,
        })
      }

      this.placedProducts.set(product.id, list)
    })
  }

  /**
   * 触发商品点击悬浮上升并 360 度旋转动效
   */
  selectProduct(productId: number | null) {
    // 1. 若已有商品在悬浮，将其平滑放回原位
    this.resetShowcase()

    if (productId === null) return

    // 2. 找到该商品陈列实例 (取中间一件展示)
    const list = this.placedProducts.get(productId)
    if (!list || list.length === 0) return

    const targetItem = list[Math.floor(list.length / 2)] || list[0]

    // 3. 在展台表面生成全息发光投射底座光环
    const ringGeo = new THREE.RingGeometry(0.2, 0.28, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.set(targetItem.root.position.x, targetItem.origY + 0.02, targetItem.root.position.z)
    this.group.add(ring)

    // 4. GSAP 弹动升起动效 (+0.38m)
    gsap.to(targetItem.root.position, {
      y: targetItem.origY + 0.38,
      duration: 0.55,
      ease: 'back.out(1.8)',
    })

    this.activeShowcase = {
      item: targetItem,
      ring,
    }
  }

  /** 将当前悬浮商品平滑放回台面 */
  private resetShowcase() {
    if (!this.activeShowcase) return

    const { item, ring } = this.activeShowcase
    // 平滑降回
    gsap.to(item.root.position, {
      y: item.origY,
      duration: 0.45,
      ease: 'power2.inOut',
    })
    // 恢复初始朝向
    gsap.to(item.root.rotation, {
      y: item.origRotY,
      duration: 0.45,
      ease: 'power2.inOut',
    })
    // 移除光环
    this.group.remove(ring)
    ring.geometry.dispose()
    ;(ring.material as THREE.Material).dispose()

    this.activeShowcase = null
  }

  /** 每帧更新：驱动被选中商品的 360 度持续旋转与上下悬浮微动 */
  update(delta: number, elapsed: number) {
    if (!this.activeShowcase) return

    const { item, ring } = this.activeShowcase

    // 1. 360 度匀速优雅自转
    item.root.rotation.y += delta * 1.8

    // 2. 悬浮微动呼吸波
    item.root.position.y = item.origY + 0.38 + Math.sin(elapsed * 4.0) * 0.025

    // 3. 全息光圈缓慢反向旋转
    ring.rotation.z += delta * 0.6
  }

  /** 实例化模板并组装各部件 Mesh 树 */
  private instantiateTemplate(template: ProductTemplate): THREE.Group {
    const group = new THREE.Group()
    template.parts.forEach((part) => {
      const mesh = new THREE.Mesh(part.geometry, part.material)
      mesh.applyMatrix4(part.matrix)
      mesh.castShadow = true
      mesh.receiveShadow = true
      group.add(mesh)
    })
    return group
  }

  /** 实时响应库存更新 */
  updateStock(productId: number, stock: number) {
    const list = this.placedProducts.get(productId)
    if (!list) return

    const visibleCount = Math.max(stock, 0)
    list.forEach((item, idx) => {
      item.product.stock = stock
      item.root.visible = idx < visibleCount
    })
  }
}
