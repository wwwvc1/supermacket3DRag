/**
 * 3D 智慧商业步行街场景生成器 (SceneBuilder.ts)
 * 构建由中央步行大道与两侧 7 座独立商户特色门店组成的电影级商业街区：
 * 1. 中央大道 (石板路面、导向地灯、两侧路灯、景观花坛、街区入口霓虹拱门)
 * 2. 两侧 7 座独立商户店铺 (Apple 旗舰店、Sony 影音店、ROG 电竞馆、生鲜果蔬市集、特仑苏乳品吧、智能穿戴馆、UltraVision 极客超显中心)
 * 3. 彻底移除灰暗起雾滤镜，打造清透写实光影
 */
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

export interface Bounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  height: number
}

interface ShopConfig {
  code: string
  name: string
  merchantTitle: string
  category: string
  x: number
  z: number
  width: number
  depth: number
  themeColor: number
  signColor: number
  entranceSide: 'right' | 'left' | 'front'
}

export class SceneBuilder {
  /** 碰撞体列表（用于漫游防穿墙） */
  readonly colliders: THREE.Object3D[] = []
  sun!: THREE.DirectionalLight

  // 7 座独立商铺规划
  private shops: ShopConfig[] = [
    {
      code: 'F01',
      name: 'Apple 旗舰体验店',
      merchantTitle: 'Apple 旗舰店 · 手机数码馆',
      category: '手机数码',
      x: -12.0,
      z: 10.0,
      width: 7.5,
      depth: 8.5,
      themeColor: 0xe2e8f0, // 极简白铝
      signColor: 0xffffff,
      entranceSide: 'right', // 门口朝向中央街道 (向东)
    },
    {
      code: 'B01',
      name: 'Sony 索尼声学馆',
      merchantTitle: 'Sony 索尼声学 · 旗舰影音店',
      category: '数码影音',
      x: -12.0,
      z: -3.0,
      width: 7.5,
      depth: 8.5,
      themeColor: 0x1e293b, // 曜石碳黑
      signColor: 0xf59e0b, // 琥珀金
      entranceSide: 'right',
    },
    {
      code: 'C01',
      name: 'ROG 电竞外设馆',
      merchantTitle: 'ROG 玩家极客 · 电竞外设馆',
      category: '电脑外设',
      x: -12.0,
      z: -16.0,
      width: 7.5,
      depth: 8.5,
      themeColor: 0x0f172a, // 深夜黑钛
      signColor: 0x06b6d4, // 赛博青
      entranceSide: 'right',
    },
    {
      code: 'A01',
      name: '鲜果直采市集',
      merchantTitle: '源头直采 · 鲜果果蔬市集',
      category: '生鲜果蔬',
      x: 12.0,
      z: 10.0,
      width: 7.5,
      depth: 8.5,
      themeColor: 0x78350f, // 原木温润
      signColor: 0x10b981, // 生机绿
      entranceSide: 'left', // 门口朝向中央街道 (向西)
    },
    {
      code: 'G01',
      name: '特仑苏有机乳品吧',
      merchantTitle: '特仑苏 · 有机乳品与冷饮吧',
      category: '乳品冷饮',
      x: 12.0,
      z: -3.0,
      width: 7.5,
      depth: 8.5,
      themeColor: 0x38bdf8, // 冰川天蓝
      signColor: 0x38bdf8,
      entranceSide: 'left',
    },
    {
      code: 'D01',
      name: 'iWatch 智能穿戴馆',
      merchantTitle: 'iWatch · 智能穿戴与健康馆',
      category: '智能穿戴',
      x: 12.0,
      z: -16.0,
      width: 7.5,
      depth: 8.5,
      themeColor: 0x475569, // 钛金流光
      signColor: 0xa855f7, // 科技紫
      entranceSide: 'left',
    },
    {
      code: 'E01',
      name: 'UltraVision 超显中心',
      merchantTitle: 'UltraVision · 高端电竞超显中心',
      category: '电脑办公',
      x: 0.0,
      z: -28.0,
      width: 13.0,
      depth: 8.5,
      themeColor: 0x0284c7, // 深海蓝
      signColor: 0x38bdf8, // 蔚蓝霓虹
      entranceSide: 'front', // 门口朝向大道入口 (向南)
    },
  ]

  constructor(
    private scene: THREE.Scene,
    private renderer: THREE.WebGLRenderer,
  ) {}

  /** 构建整个商业步行街环境 */
  build(_bounds: Bounds) {
    this.buildAtmosphere()
    this.buildStreetBoulevard()
    this.buildStreetProps()
    this.buildShops()
    this.buildLights()
  }

  /** 清透夜色氛围 (无任何浑浊雾气遮挡) */
  private buildAtmosphere() {
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environment = envTex
    this.scene.environmentIntensity = 0.65
    // 璀璨夜空深蓝底色
    this.scene.background = new THREE.Color(0x060914)
    // 彻底清除导致泛白起雾的 Fog
    this.scene.fog = null
    pmrem.dispose()
  }

  /** 中央步行街大道与两侧人行步道地坪 */
  private buildStreetBoulevard() {
    // 1. 中央石板沥青主路面 (宽 12m, 长 68m)
    const roadGeo = new THREE.PlaneGeometry(12, 68)
    const roadMat = new THREE.MeshPhysicalMaterial({
      color: 0x181e2b,
      roughness: 0.35,
      metalness: 0.1,
      reflectivity: 0.5,
      clearcoat: 0.3,
    })
    const road = new THREE.Mesh(roadGeo, roadMat)
    road.rotation.x = -Math.PI / 2
    road.position.set(0, 0, -4)
    road.receiveShadow = true
    this.scene.add(road)

    // 中央导向发光带
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 64), lineMat)
    centerLine.rotation.x = -Math.PI / 2
    centerLine.position.set(0, 0.01, -4)
    this.scene.add(centerLine)

    // 2. 两侧商铺前的人行道广场 (高出路面 0.08m，大理石方砖质感)
    const sideWalkMat = new THREE.MeshPhysicalMaterial({
      color: 0x242c3d,
      roughness: 0.25,
      metalness: 0.1,
      reflectivity: 0.6,
      clearcoat: 0.6,
    })
    // 左侧人行道
    const leftWalk = new THREE.Mesh(new THREE.BoxGeometry(14, 0.16, 68), sideWalkMat)
    leftWalk.position.set(-13, 0.08, -4)
    leftWalk.receiveShadow = true
    this.scene.add(leftWalk)

    // 右侧人行道
    const rightWalk = new THREE.Mesh(new THREE.BoxGeometry(14, 0.16, 68), sideWalkMat)
    rightWalk.position.set(13, 0.08, -4)
    rightWalk.receiveShadow = true
    this.scene.add(rightWalk)

    // 路缘石边缘发光带
    const curbGlowMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 })
    const leftCurbGlow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 68), curbGlowMat)
    leftCurbGlow.position.set(-6.02, 0.16, -4)
    this.scene.add(leftCurbGlow)

    const rightCurbGlow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 68), curbGlowMat)
    rightCurbGlow.position.set(6.02, 0.16, -4)
    this.scene.add(rightCurbGlow)
  }

  /** 街区设施：路灯、绿化花坛、入口迎宾霓虹拱门 */
  private buildStreetProps() {
    // 1. 入口迎宾拱门 (Z = 24)
    const archMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 })
    const archSignMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x38bdf8,
      emissiveIntensity: 2.2,
    })

    const archGroup = new THREE.Group()
    archGroup.position.set(0, 0, 24)

    // 左右立柱
    const colLeft = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5.5, 0.6), archMat)
    colLeft.position.set(-7, 2.75, 0)
    archGroup.add(colLeft)
    this.colliders.push(colLeft)

    const colRight = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5.5, 0.6), archMat)
    colRight.position.set(7, 2.75, 0)
    archGroup.add(colRight)
    this.colliders.push(colRight)

    // 跨街横梁
    const beam = new THREE.Mesh(new THREE.BoxGeometry(14.8, 0.7, 0.7), archMat)
    beam.position.set(0, 5.3, 0)
    archGroup.add(beam)

    // 拱门发光迎宾标牌
    const archSign = new THREE.Mesh(new THREE.BoxGeometry(10, 0.45, 0.1), archSignMat)
    archSign.position.set(0, 5.3, 0.4)
    archGroup.add(archSign)

    // 拱门文字 Sprite
    const archTextSprite = this.createTextSprite('✦ 未来智慧商业街 · FUTURE SHOPPING AVENUE ✦', '#38bdf8', 42)
    archTextSprite.position.set(0, 5.3, 0.52)
    archTextSprite.scale.set(7.5, 1.2, 1)
    archGroup.add(archTextSprite)

    this.scene.add(archGroup)

    // 2. 街灯与绿化花坛 (沿街两侧成对排布)
    const zPositions = [16, 4, -8, -20]
    zPositions.forEach((z) => {
      this.createStreetLamp(-5.6, z)
      this.createStreetLamp(5.6, z)
      this.createPlanterBox(-6.4, z + 6)
      this.createPlanterBox(6.4, z + 6)
    })
  }

  /** 创建现代路灯与真实光源 */
  private createStreetLamp(x: number, z: number) {
    const lampGroup = new THREE.Group()
    lampGroup.position.set(x, 0.16, z)

    // 灯杆
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 16), poleMat)
    pole.position.y = 2.1
    pole.castShadow = true
    lampGroup.add(pole)

    // 挑臂
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.06), poleMat)
    arm.position.set(x > 0 ? -0.4 : 0.4, 4.15, 0)
    lampGroup.add(arm)

    // 发光灯罩
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0xffedd5,
      emissiveIntensity: 2.5,
    })
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.2), headMat)
    head.position.set(x > 0 ? -0.7 : 0.7, 4.1, 0)
    lampGroup.add(head)

    // 暖光点光源 (照亮人行道)
    const light = new THREE.PointLight(0xffedd5, 12, 10, 1.8)
    light.position.set(x > 0 ? -0.7 : 0.7, 4.0, 0)
    light.castShadow = true
    light.shadow.bias = -0.001
    lampGroup.add(light)

    this.scene.add(lampGroup)
    this.colliders.push(pole)
  }

  /** 街头绿植花坛 */
  private createPlanterBox(x: number, z: number) {
    const boxGroup = new THREE.Group()
    boxGroup.position.set(x, 0.16, z)

    const boxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.9 })

    const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 1.8), boxMat)
    box.position.y = 0.225
    box.castShadow = true
    box.receiveShadow = true
    boxGroup.add(box)

    // 绿化灌木
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65), soilMat)
    bush.position.y = 0.7
    bush.scale.set(1.1, 0.8, 1.3)
    bush.castShadow = true
    boxGroup.add(bush)

    this.scene.add(boxGroup)
    this.colliders.push(box)
  }

  /** 构建 7 座具有独立建筑外观与发光门头的商铺 */
  private buildShops() {
    this.shops.forEach((cfg) => {
      this.buildSingleShop(cfg)
    })
  }

  /** 单个商铺建筑生成器 */
  private buildSingleShop(cfg: ShopConfig) {
    const shopGroup = new THREE.Group()
    shopGroup.position.set(cfg.x, 0.16, cfg.z)

    const wallHeight = 4.4
    const wallThick = 0.25
    const facadeMat = new THREE.MeshStandardMaterial({
      color: cfg.themeColor,
      metalness: 0.35,
      roughness: 0.45,
    })
    const interiorFloorMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.2,
      reflectivity: 0.7,
      clearcoat: 0.5,
    })
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      opacity: 1.0,
      transparent: true,
      roughness: 0.05,
      ior: 1.5,
    })

    // 1. 室内独立地坪
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(cfg.width, cfg.depth), interiorFloorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0.02
    floor.receiveShadow = true
    shopGroup.add(floor)

    // 2. 吊顶
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, 0.2, cfg.depth), facadeMat)
    ceiling.position.y = wallHeight
    shopGroup.add(ceiling)

    // 3. 墙体（带大开门开放式设计）
    // 后墙 (封闭)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, wallHeight, wallThick), facadeMat)
    backWall.position.set(0, wallHeight / 2, -cfg.depth / 2)
    backWall.castShadow = true
    backWall.receiveShadow = true
    shopGroup.add(backWall)
    this.colliders.push(backWall)

    // 两侧侧墙
    const sideWallGeo = new THREE.BoxGeometry(wallThick, wallHeight, cfg.depth)
    const sideWall1 = new THREE.Mesh(sideWallGeo, facadeMat)
    sideWall1.position.set(-cfg.width / 2, wallHeight / 2, 0)
    sideWall1.castShadow = true
    shopGroup.add(sideWall1)
    this.colliders.push(sideWall1)

    const sideWall2 = new THREE.Mesh(sideWallGeo, facadeMat)
    sideWall2.position.set(cfg.width / 2, wallHeight / 2, 0)
    sideWall2.castShadow = true
    shopGroup.add(sideWall2)
    this.colliders.push(sideWall2)

    // 4. 临街立面与店铺门头大招牌
    const frontGroup = new THREE.Group()

    // 发光门头招牌背板
    const signBoardMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1d,
      roughness: 0.5,
      metalness: 0.8,
    })
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(cfg.width * 0.85, 0.95, 0.18), signBoardMat)
    signBoard.position.set(0, wallHeight - 0.5, 0)
    frontGroup.add(signBoard)

    // 招牌霓虹发光边框
    const neonBorderMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: cfg.signColor,
      emissiveIntensity: 2.2,
    })
    const neonBorder = new THREE.Mesh(new THREE.BoxGeometry(cfg.width * 0.87, 0.98, 0.14), neonBorderMat)
    neonBorder.position.set(0, wallHeight - 0.5, -0.02)
    frontGroup.add(neonBorder)

    // 店铺专属文字 Sprite 招牌
    const signSprite = this.createTextSprite(cfg.merchantTitle, `#${cfg.signColor.toString(16).padStart(6, '0')}`, 34)
    signSprite.position.set(0, wallHeight - 0.5, 0.18)
    signSprite.scale.set(cfg.width * 0.78, 0.8, 1)
    frontGroup.add(signSprite)

    // 透明橱窗玻璃
    const glassWindow = new THREE.Mesh(new THREE.BoxGeometry(cfg.width * 0.35, 2.8, 0.06), glassMat)
    glassWindow.position.set(cfg.width * 0.28, 1.4, 0)
    frontGroup.add(glassWindow)

    // 根据朝向调整立面在店铺中的相对位置
    if (cfg.entranceSide === 'right') {
      // 门口朝东（面朝中央大道）
      frontGroup.rotation.y = Math.PI / 2
      frontGroup.position.set(cfg.width / 2, 0, 0)
    } else if (cfg.entranceSide === 'left') {
      // 门口朝西（面朝中央大道）
      frontGroup.rotation.y = -Math.PI / 2
      frontGroup.position.set(-cfg.width / 2, 0, 0)
    } else {
      // 尽头大店朝南
      frontGroup.position.set(0, 0, cfg.depth / 2)
    }
    shopGroup.add(frontGroup)

    // 5. 店内重点照明聚光灯 (打亮展台)
    const shopLight = new THREE.SpotLight(0xffffff, 18, 12, Math.PI / 3, 0.4)
    shopLight.position.set(0, wallHeight - 0.3, 0)
    shopLight.target.position.set(0, 0.9, 0)
    shopLight.castShadow = true
    shopGroup.add(shopLight)
    shopGroup.add(shopLight.target)

    this.scene.add(shopGroup)
  }

  /** 主照明系统：清朗月夜主平行光与柔和天光 */
  private buildLights() {
    // 漫射环境天光
    const ambient = new THREE.AmbientLight(0x384b70, 1.2)
    this.scene.add(ambient)

    // 主平行光（承担柔和阴影投射）
    this.sun = new THREE.DirectionalLight(0xdbeafe, 1.8)
    this.sun.position.set(15, 25, 18)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.width = 2048
    this.sun.shadow.mapSize.height = 2048
    this.sun.shadow.camera.near = 0.5
    this.sun.shadow.camera.far = 80
    this.sun.shadow.camera.left = -30
    this.sun.shadow.camera.right = 30
    this.sun.shadow.camera.top = 40
    this.sun.shadow.camera.bottom = -40
    this.sun.shadow.bias = -0.0008
    this.scene.add(this.sun)
  }

  /** Canvas 绘制高清晰度 3D 文字 Sprite */
  private createTextSprite(text: string, colorHex: string, fontSize = 32): THREE.Sprite {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // 发光外阴影
      ctx.shadowColor = colorHex
      ctx.shadowBlur = 18
      ctx.fillStyle = '#ffffff'
      ctx.fillText(text, canvas.width / 2, canvas.height / 2)

      // 再次叠加纯色以保证字迹清晰
      ctx.shadowBlur = 0
      ctx.fillStyle = colorHex
      ctx.fillText(text, canvas.width / 2, canvas.height / 2)
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false })
    const sprite = new THREE.Sprite(mat)
    sprite.renderOrder = 900
    return sprite
  }
}
