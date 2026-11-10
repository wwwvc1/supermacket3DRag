/**
 * 3D 数字孪生超市世界总控制器 (SupermarketWorld)
 * 聚合渲染循环、硬装搭建、货架摆放、商品陈列、相机控制、后处理光影与交互拾取
 */
import * as THREE from 'three'
import type { ShelfStatus, SupermarketScene } from '../types/api'
import { SceneBuilder } from './SceneBuilder'
import { ShelfManager } from './ShelfManager'
import { ProductInstancer } from './ProductInstancer'
import { CameraController, type CameraMode } from './CameraController'
import { PostProcessing } from './PostProcessing'
import { InteractionManager } from './InteractionManager'
import { setWorld } from './worldRef'

export interface WorldCallbacks {
  onProductSelected?: (productId: number) => void
  onModeChanged?: (mode: CameraMode) => void
  onFpsUpdated?: (fps: number) => void
}

export class SupermarketWorld {
  container!: HTMLElement
  scene!: THREE.Scene
  camera!: THREE.PerspectiveCamera
  renderer!: THREE.WebGLRenderer

  sceneBuilder!: SceneBuilder
  shelfManager!: ShelfManager
  productInstancer!: ProductInstancer
  cameraController!: CameraController
  postProcessing!: PostProcessing
  interactionManager!: InteractionManager

  private clock = new THREE.Clock()
  private animId: number | null = null
  private isDestroyed = false

  // FPS 统计
  private frameCount = 0
  private lastTime = performance.now()

  constructor(private callbacks?: WorldCallbacks) {}

  init(container: HTMLElement) {
    this.container = container
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    // 1. 场景与相机
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100)
    this.camera.position.set(0, 3.0, 8.0)

    // 2. 电影级写实渲染器 (ACESFilmic 色彩映射 + PCFSoft 柔和阴影)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    container.appendChild(this.renderer.domElement)

    // 3. 子系统装配
    this.sceneBuilder = new SceneBuilder(this.scene, this.renderer)
    this.shelfManager = new ShelfManager(this.scene)
    this.productInstancer = new ProductInstancer(this.scene)

    this.cameraController = new CameraController(this.camera, this.renderer.domElement, {
      onModeChanged: (m) => this.callbacks?.onModeChanged?.(m),
    })

    this.postProcessing = new PostProcessing(this.renderer, this.scene, this.camera)

    this.interactionManager = new InteractionManager(
      this.renderer.domElement,
      this.camera,
      this.productInstancer.pickables,
      {
        onProductClick: (id) => this.callbacks?.onProductSelected?.(id),
      }
    )

    // 绑定自适应缩放
    window.addEventListener('resize', this.onResize)

    // 注册全局世界单例
    setWorld(this)

    // 启动帧循环
    this.startLoop()
  }

  /** 加载后端下发的完整场景全景树 */
  loadSceneData(data: SupermarketScene) {
    // 1. 生成硬装
    this.sceneBuilder.build(data.sceneBounds)

    // 2. 摆放货架
    this.shelfManager.buildShelves(data.shelves)

    // 3. 摆放商品
    this.productInstancer.populate(data.shelves)

    // 4. 更新碰撞体与交互拾取目标
    this.cameraController.colliders = [
      ...this.sceneBuilder.colliders,
      ...this.shelfManager.colliders,
    ]
    this.interactionManager.updatePickables(this.productInstancer.pickables)

    // 5. 设置初始机位
    if (data.initialCamera) {
      this.cameraController.setSpawn(data.initialCamera)
    }
  }

  /** 实时更新商品库存 */
  updateProductStock(productId: number, stock: number) {
    this.productInstancer.updateStock(productId, stock)
  }

  /** 选中商品触发悬浮 360 度自转展示 */
  selectProduct(productId: number | null) {
    this.productInstancer.selectProduct(productId)
  }

  /** 实时更新货架售罄标红状态 */
  setShelfStatus(shelfId: number, status: ShelfStatus) {
    this.shelfManager.setShelfStatus(shelfId, status)
  }

  /** 飞向指定货架特写视角 */
  flyToShelf(shelfId: number, onComplete?: () => void) {
    const inst = this.shelfManager.shelves.get(shelfId)
    if (!inst) return
    const s = inst.data

    const camPos = {
      x: s.cameraTargetX ?? s.positionX,
      y: s.cameraTargetY ?? 1.5,
      z: s.cameraTargetZ ?? s.positionZ + 2,
    }
    const lookAt = {
      x: s.positionX,
      y: s.positionY + 1.0,
      z: s.positionZ,
    }

    this.cameraController.flyTo(camPos, lookAt, 1.5, onComplete)
  }

  /** 按绝对三维点位平滑运镜飞掠 */
  flyToCoords(
    camPos: { x: number; y: number; z: number },
    lookAt: { x: number; y: number; z: number },
    duration = 1.5,
    onComplete?: () => void
  ) {
    this.cameraController.flyTo(camPos, lookAt, duration, onComplete)
  }

  /** 切换相机模式 (orbit: 上帝视角 / fps: 第一人称漫游) */
  setCameraMode(mode: 'orbit' | 'fps') {
    if (mode === 'fps') {
      this.cameraController.setFPSMode()
    } else {
      this.cameraController.setOrbitMode()
    }
  }

  /** 切换画质档位 (高质量开启 Bloom 泛光) */
  setQuality(high: boolean) {
    this.postProcessing.setQuality(high)
  }

  private onResize = () => {
    if (!this.container || this.isDestroyed) return
    const w = this.container.clientWidth || window.innerWidth
    const h = this.container.clientHeight || window.innerHeight

    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    this.postProcessing.setSize(w, h)
  }

  private startLoop() {
    const loop = () => {
      if (this.isDestroyed) return
      this.animId = requestAnimationFrame(loop)

      const delta = this.clock.getDelta()
      const elapsed = this.clock.getElapsedTime()

      // 更新控制器、货架呼吸灯与选中商品悬浮旋转
      this.cameraController.update(delta)
      this.shelfManager.update(elapsed)
      this.productInstancer.update(delta, elapsed)

      // 后处理通道渲染
      this.postProcessing.render()

      // FPS 帧率计数
      this.frameCount++
      const now = performance.now()
      if (now - this.lastTime >= 1000) {
        const fps = Math.round((this.frameCount * 1000) / (now - this.lastTime))
        this.callbacks?.onFpsUpdated?.(fps)
        this.frameCount = 0
        this.lastTime = now
      }
    }
    loop()
  }

  dispose() {
    this.isDestroyed = true
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId)
    }
    window.removeEventListener('resize', this.onResize)
    setWorld(null)

    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement)
    }
    this.renderer.dispose()
  }
}
