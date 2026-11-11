/**
 * 3D 空间交互拾取管理器 (InteractionManager.ts)
 * 1. 监听画布鼠标事件，发射 Raycaster 检测商品拾取盒与商铺建筑/门头
 * 2. Hover 状态变更光标为 pointer，支持商品与商铺高亮悬浮提示
 * 3. 点击商品触发 onProductClick (弹出商品详情抽屉，触发悬浮 360° 自转)
 * 4. 点击商铺触发 onShopClick (平滑运镜飞入店内，开启店内深度导览模式)
 */
import * as THREE from 'three'

export interface ShopUserData {
  isShop: boolean
  shelfId: number
  shelfCode: string
  shopName: string
  merchantTitle: string
  category: string
  description: string
  x: number
  z: number
}

export interface InteractionCallback {
  onProductClick?: (productId: number) => void
  onProductHover?: (productId: number | null) => void
  onShopClick?: (shop: ShopUserData) => void
  onShopHover?: (shop: ShopUserData | null) => void
}

export class InteractionManager {
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2(-999, -999)
  private hoveredProductId: number | null = null
  private hoveredShop: ShopUserData | null = null

  constructor(
    private domElement: HTMLElement,
    private camera: THREE.PerspectiveCamera,
    private productPickables: THREE.Mesh[] = [],
    private shopPickables: THREE.Mesh[] = [],
    private callbacks?: InteractionCallback
  ) {
    this.setupListeners()
  }

  private setupListeners() {
    this.domElement.addEventListener('mousemove', (e) => {
      const rect = this.domElement.getBoundingClientRect()
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      this.checkHover()
    })

    this.domElement.addEventListener('click', (e) => {
      const rect = this.domElement.getBoundingClientRect()
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      this.raycaster.setFromCamera(this.mouse, this.camera)

      // 1. 优先检测是否点中具体商品
      const productHits = this.raycaster.intersectObjects(this.productPickables, false)
      if (productHits.length > 0) {
        const productId = productHits[0].object.userData?.productId
        if (productId) {
          this.callbacks?.onProductClick?.(productId)
          return
        }
      }

      // 2. 其次检测是否点击了商铺大门/门头/建筑
      const shopHits = this.raycaster.intersectObjects(this.shopPickables, false)
      if (shopHits.length > 0) {
        const shop = shopHits[0].object.userData as ShopUserData
        if (shop && shop.isShop) {
          this.callbacks?.onShopClick?.(shop)
        }
      }
    })
  }

  private checkHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera)

    // 1. 检测商品 Hover
    const productHits = this.raycaster.intersectObjects(this.productPickables, false)
    if (productHits.length > 0) {
      const productId = productHits[0].object.userData?.productId
      if (productId) {
        if (this.hoveredProductId !== productId) {
          this.hoveredProductId = productId
          this.hoveredShop = null
          this.domElement.style.cursor = 'pointer'
          this.callbacks?.onProductHover?.(productId)
          this.callbacks?.onShopHover?.(null)
        }
        return
      }
    }

    // 2. 检测商铺 Hover
    const shopHits = this.raycaster.intersectObjects(this.shopPickables, false)
    if (shopHits.length > 0) {
      const shop = shopHits[0].object.userData as ShopUserData
      if (shop && shop.isShop) {
        if (this.hoveredShop?.shelfId !== shop.shelfId) {
          this.hoveredShop = shop
          this.hoveredProductId = null
          this.domElement.style.cursor = 'pointer'
          this.callbacks?.onShopHover?.(shop)
          this.callbacks?.onProductHover?.(null)
        }
        return
      }
    }

    // 3. 悬浮空白处，重置光标
    if (this.hoveredProductId !== null || this.hoveredShop !== null) {
      this.hoveredProductId = null
      this.hoveredShop = null
      this.domElement.style.cursor = 'default'
      this.callbacks?.onProductHover?.(null)
      this.callbacks?.onShopHover?.(null)
    }
  }

  updatePickables(productPickables: THREE.Mesh[], shopPickables?: THREE.Mesh[]) {
    this.productPickables = productPickables
    if (shopPickables) {
      this.shopPickables = shopPickables
    }
  }
}
