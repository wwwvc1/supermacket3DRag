/**
 * 场景硬装生成器：大理石地坪、墙体、吊顶、LED 条形灯带、灯光矩阵与室内环境反射
 */
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { createMarbleTextures } from './textures'

export interface Bounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  height: number
}

export class SceneBuilder {
  /** 墙体碰撞体（第一人称漫游防穿墙） */
  readonly colliders: THREE.Object3D[] = []
  /** 主平行光（承担柔和阴影） */
  sun!: THREE.DirectionalLight

  constructor(
    private scene: THREE.Scene,
    private renderer: THREE.WebGLRenderer,
  ) {}

  /** 构建整个超市硬装 */
  build(bounds: Bounds) {
    this.buildEnvironment()
    this.buildFloor(bounds)
    this.buildWalls(bounds)
    this.buildCeiling(bounds)
    this.buildLights(bounds)
  }

  /** 环境反射：RoomEnvironment 经 PMREM 预滤波，替代外部 HDR 文件 */
  private buildEnvironment() {
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environment = envTex
    this.scene.environmentIntensity = 0.55
    this.scene.background = new THREE.Color(0x0b1020)
    this.scene.fog = new THREE.Fog(0x0b1020, 30, 70)
    pmrem.dispose()
  }

  /** 50x40 大理石地坪：MeshPhysicalMaterial + 清漆层产生微反射 */
  private buildFloor(b: Bounds) {
    const w = b.maxX - b.minX + 10
    const d = b.maxZ - b.minZ
    const { map, normalMap } = createMarbleTextures()
    // 每块贴图包含 2x2 块 1.2m 瓷砖
    map.repeat.set(w / 2.4, d / 2.4)
    normalMap.repeat.copy(map.repeat)
    const mat = new THREE.MeshPhysicalMaterial({
      map,
      normalMap,
      normalScale: new THREE.Vector2(0.6, 0.6),
      roughness: 0.15,
      metalness: 0.05,
      reflectivity: 0.6,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
    })
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set((b.minX + b.maxX) / 2, 0, (b.minZ + b.maxZ) / 2)
    floor.receiveShadow = true
    floor.name = 'floor'
    this.scene.add(floor)
  }

  /** 四周墙体 + 踢脚线灯带 */
  private buildWalls(b: Bounds) {
    const h = b.height
    const mat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.05 })
    const glow = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x22d3ee, emissiveIntensity: 2.2 })
    const cx = (b.minX + b.maxX) / 2
    const cz = (b.minZ + b.maxZ) / 2
    const w = b.maxX - b.minX + 10
    const d = b.maxZ - b.minZ
    const specs: [number, number, number, number][] = [
      // x, z, 长度, 旋转
      [cx, b.minZ, w, 0],
      [cx - w / 2, cz, d, Math.PI / 2],
      [cx + w / 2, cz, d, -Math.PI / 2],
    ]
    for (const [x, z, len, rot] of specs) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(len, h, 0.3), mat)
      wall.position.set(x, h / 2, z)
      wall.rotation.y = rot
      wall.receiveShadow = true
      this.scene.add(wall)
      this.colliders.push(wall)
      const strip = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.05), glow)
      strip.position.set(x, 0.12, z)
      strip.rotation.y = rot
      strip.translateZ(0.18)
      this.scene.add(strip)
    }
  }

  /** 吊顶 + 纵向 LED 条形灯带（Bloom 泛光主要来源） */
  private buildCeiling(b: Bounds) {
    const w = b.maxX - b.minX + 10
    const d = b.maxZ - b.minZ
    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 }),
    )
    ceil.rotation.x = Math.PI / 2
    ceil.position.set((b.minX + b.maxX) / 2, b.height, (b.minZ + b.maxZ) / 2)
    this.scene.add(ceil)

    const ledMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4e0, emissiveIntensity: 3 })
    const geo = new THREE.BoxGeometry(0.12, 0.04, d - 4)
    for (let x = b.minX + 2; x <= b.maxX - 2; x += 4) {
      const led = new THREE.Mesh(geo, ledMat)
      led.position.set(x, b.height - 0.05, (b.minZ + b.maxZ) / 2)
      this.scene.add(led)
    }
  }

  /** 灯光：半球漫射 + 柔和主光（2048 阴影）+ 顶部点光源矩阵 */
  private buildLights(b: Bounds) {
    this.scene.add(new THREE.HemisphereLight(0xdbeafe, 0x1e1b16, 0.6))
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.15))

    const sun = new THREE.DirectionalLight(0xfff1dc, 1.4)
    sun.position.set(6, b.height + 8, 6)
    sun.target.position.set(0, 0, -6)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -22
    sun.shadow.camera.right = 22
    sun.shadow.camera.top = 22
    sun.shadow.camera.bottom = -22
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 40
    sun.shadow.bias = -0.0004
    sun.shadow.normalBias = 0.02
    sun.shadow.radius = 4
    this.scene.add(sun, sun.target)
    this.sun = sun

    // 点光源矩阵：模拟商超筒灯，不投射阴影以控制性能
    for (let x = b.minX + 6; x <= b.maxX - 6; x += 8) {
      for (let z = b.minZ + 6; z <= b.maxZ - 4; z += 8) {
        const p = new THREE.PointLight(0xffeedd, 9, 14, 1.6)
        p.position.set(x, b.height - 0.4, z)
        this.scene.add(p)
      }
    }
  }
}
