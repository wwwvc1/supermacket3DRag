/**
 * 三态相机控制器：
 * 1. 上帝俯瞰全景模式 (OrbitControls)：俯视自由旋转/缩放，带地下防穿透限制
 * 2. 第一人称漫游模式 (FPS Roaming)：成人视高 (Y=1.6m)，WASD + Shift 奔跑位移，带射线碰撞检测防穿墙
 * 3. 电影级平滑运镜模式 (Flight Mode)：基于 GSAP 贝塞尔补间，在货架特写与全景之间丝滑飞跃
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'

export type CameraMode = 'orbit' | 'fps' | 'flight'

export interface CameraStateCallback {
  onModeChanged?: (mode: CameraMode) => void
}

export class CameraController {
  mode: CameraMode = 'orbit'
  orbitControls: OrbitControls
  private activeTween: gsap.core.Tween | null = null

  // 第一人称控制状态
  private keys = { forward: false, backward: false, left: false, right: false, shift: false }
  private eyeHeight = 1.6
  private isPointerLocked = false
  private euler = new THREE.Euler(0, 0, 0, 'YXZ')
  private raycaster = new THREE.Raycaster()

  // 外部传入的碰撞体集合
  colliders: THREE.Object3D[] = []

  constructor(
    public camera: THREE.PerspectiveCamera,
    public domElement: HTMLElement,
    private callbacks?: CameraStateCallback
  ) {
    this.orbitControls = new OrbitControls(this.camera, this.domElement)
    this.orbitControls.enableDamping = true
    this.orbitControls.dampingFactor = 0.05
    this.orbitControls.minDistance = 2.0
    this.orbitControls.maxDistance = 35.0
    this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.05 // 防穿入地下
    this.orbitControls.target.set(0, 1.0, 0)

    this.setupFPSListeners()
  }

  /** 设置初始机位与视线注视点 */
  setSpawn(spawn: { spawnX: number; spawnY: number; spawnZ: number; lookAtX: number; lookAtY: number; lookAtZ: number }) {
    this.camera.position.set(spawn.spawnX, spawn.spawnY, spawn.spawnZ)
    this.orbitControls.target.set(spawn.lookAtX, spawn.lookAtY, spawn.lookAtZ)
    this.orbitControls.update()
  }

  /** 切换到上帝全景模式 */
  setOrbitMode() {
    this.mode = 'orbit'
    this.orbitControls.enabled = true
    if (this.isPointerLocked) {
      document.exitPointerLock?.()
    }
    this.callbacks?.onModeChanged?.('orbit')
  }

  /** 切换到第一人称漫游模式 */
  setFPSMode() {
    this.mode = 'fps'
    this.orbitControls.enabled = false
    this.camera.position.y = this.eyeHeight
    this.callbacks?.onModeChanged?.('fps')
  }

  /** 平滑运镜直飞目标点 (GSAP) */
  flyTo(
    targetCamPos: { x: number; y: number; z: number },
    targetLookAt: { x: number; y: number; z: number },
    duration = 1.5,
    onComplete?: () => void
  ) {
    if (this.activeTween) {
      this.activeTween.kill()
    }

    this.mode = 'flight'
    this.orbitControls.enabled = false
    this.callbacks?.onModeChanged?.('flight')

    const currentCam = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
    }
    const currentTarget = {
      x: this.orbitControls.target.x,
      y: this.orbitControls.target.y,
      z: this.orbitControls.target.z,
    }

    const state = {
      camX: currentCam.x,
      camY: currentCam.y,
      camZ: currentCam.z,
      tarX: currentTarget.x,
      tarY: currentTarget.y,
      tarZ: currentTarget.z,
    }

    this.activeTween = gsap.to(state, {
      camX: targetCamPos.x,
      camY: targetCamPos.y,
      camZ: targetCamPos.z,
      tarX: targetLookAt.x,
      tarY: targetLookAt.y,
      tarZ: targetLookAt.z,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.camera.position.set(state.camX, state.camY, state.camZ)
        this.orbitControls.target.set(state.tarX, state.tarY, state.tarZ)
        this.camera.lookAt(state.tarX, state.tarY, state.tarZ)
      },
      onComplete: () => {
        this.activeTween = null
        this.setOrbitMode()
        onComplete?.()
      },
    })
  }

  /** 绑定键盘与第一人称指针锁定事件 */
  private setupFPSListeners() {
    window.addEventListener('keydown', (e) => {
      if (this.mode !== 'fps') return
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true
          break
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true
          break
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true
          break
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.shift = true
          break
        case 'Escape':
          this.setOrbitMode()
          break
      }
    })

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false
          break
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false
          break
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false
          break
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.shift = false
          break
      }
    })

    // 第一人称鼠标视角旋转
    this.domElement.addEventListener('mousemove', (e) => {
      if (this.mode !== 'fps') return
      // 如果按住鼠标右键或已进入指针锁定
      if (e.buttons === 2 || this.isPointerLocked) {
        const movementX = e.movementX || 0
        const movementY = e.movementY || 0

        this.euler.setFromQuaternion(this.camera.quaternion)
        this.euler.y -= movementX * 0.0025
        this.euler.x -= movementY * 0.0025
        this.euler.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.euler.x))
        this.camera.quaternion.setFromEuler(this.euler)
      }
    })

    this.domElement.addEventListener('contextmenu', (e) => {
      if (this.mode === 'fps') e.preventDefault()
    })
  }

  /** 帧更新：Orbit 阻尼与 FPS 碰撞位移计算 */
  update(delta: number) {
    if (this.mode === 'orbit') {
      this.orbitControls.update()
      return
    }

    if (this.mode === 'fps') {
      const speed = this.keys.shift ? 6.0 : 3.2
      const moveZ = Number(this.keys.forward) - Number(this.keys.backward)
      const moveX = Number(this.keys.right) - Number(this.keys.left)

      const dir = new THREE.Vector3()
      if (moveZ !== 0 || moveX !== 0) {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion)
        forward.y = 0
        forward.normalize()

        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion)
        right.y = 0
        right.normalize()

        dir.addScaledVector(forward, moveZ)
        dir.addScaledVector(right, moveX)
        dir.normalize()

        // 防穿墙/防穿货架检测：沿移动方向发射水平射线
        const rayStart = this.camera.position.clone()
        rayStart.y = 0.8
        this.raycaster.set(rayStart, dir)
        const hits = this.raycaster.intersectObjects(this.colliders, true)

        const dist = speed * delta
        if (hits.length === 0 || hits[0].distance > 0.6) {
          this.camera.position.addScaledVector(dir, dist)
        }
      }

      this.camera.position.y = this.eyeHeight
    }
  }
}
