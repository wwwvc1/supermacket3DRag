/**
 * 3D 空间交互拾取管理器：
 * 1. 监听画布鼠标事件，发射 Raycaster 检测商品拾取盒
 * 2. Hover 状态变更光标为 pointer，并触发商品边缘微动或高亮
 * 3. 点击商品触发回调，弹出 2D 毛玻璃商品详情抽屉卡片
 */
import * as THREE from 'three'

export interface InteractionCallback {
  onProductClick?: (productId: number) => void
  onProductHover?: (productId: number | null) => void
}

export class InteractionManager {
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2(-999, -999)
  private hoveredProductId: number | null = null

  constructor(
    private domElement: HTMLElement,
    private camera: THREE.PerspectiveCamera,
    private pickables: THREE.Mesh[],
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
      const hits = this.raycaster.intersectObjects(this.pickables, false)
      if (hits.length > 0) {
        const productId = hits[0].object.userData?.productId
        if (productId) {
          this.callbacks?.onProductClick?.(productId)
        }
      }
    })
  }

  private checkHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const hits = this.raycaster.intersectObjects(this.pickables, false)

    if (hits.length > 0) {
      const productId = hits[0].object.userData?.productId
      if (this.hoveredProductId !== productId) {
        this.hoveredProductId = productId
        this.domElement.style.cursor = 'pointer'
        this.callbacks?.onProductHover?.(productId)
      }
    } else {
      if (this.hoveredProductId !== null) {
        this.hoveredProductId = null
        this.domElement.style.cursor = 'default'
        this.callbacks?.onProductHover?.(null)
      }
    }
  }

  updatePickables(list: THREE.Mesh[]) {
    this.pickables = list
  }
}
