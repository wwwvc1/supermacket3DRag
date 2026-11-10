/**
 * 商品陈列与空间拾取管理器：
 * 1. 遍历货架关联的商品，根据商品类目选取对应程序化 3D 模板
 * 2. 规则排布在货架层板或展台上
 * 3. 维护每个商品的拾取包围盒（用于射线检测拾取与 Hover 交互）
 * 4. 实时响应库存变动：售罄时半透明或隐藏对应陈列件
 */
import * as THREE from 'three'
import type { Product, SceneShelf } from '../types/api'
import { getProductTemplate, type ProductTemplate } from './ProceduralAssets'

export interface PlacedProduct {
  product: Product
  shelf: SceneShelf
  root: THREE.Group
  pickBox: THREE.Mesh
}

export class ProductInstancer {
  readonly group = new THREE.Group()
  /** 可被鼠标射线拾取的网格列表 */
  readonly pickables: THREE.Mesh[] = []
  private placedProducts = new Map<number, PlacedProduct[]>()

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
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0])
    }
    this.pickables.length = 0
    this.placedProducts.clear()
  }

  /** 在单个货架上排布其归属的商品 */
  private populateShelf(shelf: SceneShelf) {
    if (!shelf.products || shelf.products.length === 0) return

    const isTable = shelf.zone.includes('数码') || shelf.zone.includes('外设') || shelf.zone.includes('穿戴')
    const shelfY = isTable ? 0.95 : 0.4

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
        const rotY = shelf.rotationY || 0
        localPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY)

        itemGroup.position.set(
          shelf.positionX + localPos.x,
          shelf.positionY + localPos.y,
          shelf.positionZ + localPos.z
        )
        itemGroup.rotation.y = rotY

        // 附加拾取透明外壳
        const pickBox = new THREE.Mesh(
          new THREE.BoxGeometry(
            Math.max(template.size.w, 0.3),
            Math.max(template.size.h, 0.3),
            Math.max(template.size.d, 0.3)
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
        list.push({ product, shelf, root: itemGroup, pickBox })
      }

      this.placedProducts.set(product.id, list)
    })
  }

  /** 根据部件模板克隆 Mesh 树 */
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

  /** 动态更新某商品的展示（根据库存显隐） */
  updateStock(productId: number, stock: number) {
    const list = this.placedProducts.get(productId)
    if (!list) return
    list.forEach((item, idx) => {
      item.product.stock = stock
      item.root.visible = stock > 0 && idx < stock
    })
  }
}
