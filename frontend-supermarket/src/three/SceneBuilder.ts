/**
 * 3D 智慧商业步行街场景生成器 (SceneBuilder.ts)
 * 构建由中央步行大道与两侧 7 座独立商户特色门店组成的电影级商业街区：
 * 1. 阳光明媚的现代商业街氛围（清透天幕、柔和日光、大理石石板路面、迎宾拱门、景观花坛、街灯）
 * 2. 7 座独立商铺高拟真 3D 建筑外观模型（招牌雨棚、大落地橱窗、特色立面、开放式迎宾门廊）
 * 3. 店铺交互拾取系统：支持鼠标悬浮高亮与点击开门直飞入店内
 * 4. 彻底修正 Sprite 文字深度测试 (depthTest: true)，消除黑屏与漂浮重叠遮挡
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

export interface ShopConfig {
  shelfId: number
  code: string
  name: string
  merchantTitle: string
  category: string
  x: number
  z: number
  width: number
  depth: number
  height: number
  wallColor: number
  accentColor: number
  signColor: number
  interiorFloorColor: number
  entranceSide: 'right' | 'left' | 'front'
  description: string
}

export class SceneBuilder {
  /** 碰撞体列表（用于漫游防穿墙） */
  readonly colliders: THREE.Object3D[] = []
  /** 可供点击进入店铺的拾取目标集合 */
  readonly shopPickables: THREE.Mesh[] = []
  sun!: THREE.DirectionalLight

  // 7 座独立商铺规划（严格对应 MySQL 数据库中 7 个货架与类目）
  readonly shops: ShopConfig[] = [
    {
      shelfId: 6,
      code: 'F01',
      name: 'Apple 旗舰体验店',
      merchantTitle: 'Apple 旗舰店 · 手机数码馆',
      category: '手机数码',
      x: -12.0,
      z: 10.0,
      width: 8.0,
      depth: 9.0,
      height: 4.8,
      wallColor: 0xf8fafc, // 极简白铝
      accentColor: 0x94a3b8, // 钛金银
      signColor: 0x0284c7, // 科技蔚蓝
      interiorFloorColor: 0xf1f5f9,
      entranceSide: 'right', // 门口朝向中央街道 (向东)
      description: '极简科技美学，陈列最新款 iPhone 与前沿智能终端',
    },
    {
      shelfId: 2,
      code: 'B01',
      name: 'Sony 索尼声学馆',
      merchantTitle: 'Sony 索尼声学 · 旗舰影音店',
      category: '数码影音',
      x: -12.0,
      z: -3.0,
      width: 8.0,
      depth: 9.0,
      height: 4.8,
      wallColor: 0x334155, // 曜石钛灰
      accentColor: 0xb45309, // 琥珀原木
      signColor: 0xf59e0b, // 暖金霓虹
      interiorFloorColor: 0x1e293b,
      entranceSide: 'right',
      description: '专业声学调音室，陈列旗舰降噪头戴耳机与高保真音响',
    },
    {
      shelfId: 3,
      code: 'C01',
      name: 'ROG 电竞外设馆',
      merchantTitle: 'ROG 玩家极客 · 电竞外设馆',
      category: '电脑外设',
      x: -12.0,
      z: -16.0,
      width: 8.0,
      depth: 9.0,
      height: 4.8,
      wallColor: 0x1e293b, // 赛博碳黑
      accentColor: 0x06b6d4, // 荧光赛博青
      signColor: 0x06b6d4,
      interiorFloorColor: 0x0f172a,
      entranceSide: 'right',
      description: '极客电竞竞技场，陈列 RGB 机械键盘与超轻电竞鼠标',
    },
    {
      shelfId: 1,
      code: 'A01',
      name: '鲜果直采市集',
      merchantTitle: '源头直采 · 鲜果果蔬市集',
      category: '生鲜果蔬',
      x: 12.0,
      z: 10.0,
      width: 8.0,
      depth: 9.0,
      height: 4.8,
      wallColor: 0x78350f, // 暖润雪松木
      accentColor: 0x10b981, // 生机翠绿
      signColor: 0x10b981,
      interiorFloorColor: 0xfef3c7,
      entranceSide: 'left', // 门口朝向中央街道 (向西)
      description: '生态果园源头直采，陈列新鲜脆甜红富士苹果等时令鲜果',
    },
    {
      shelfId: 7,
      code: 'G01',
      name: '特仑苏有机乳品吧',
      merchantTitle: '特仑苏 · 有机乳品与冷饮吧',
      category: '乳品冷饮',
      x: 12.0,
      z: -3.0,
      width: 8.0,
      depth: 9.0,
      height: 4.8,
      wallColor: 0x0284c7, // 蔚蓝天际
      accentColor: 0x38bdf8, // 冰川奶白
      signColor: 0x38bdf8,
      interiorFloorColor: 0xf0f9ff,
      entranceSide: 'left',
      description: '高原牧场纯净有机奶源，恒温保鲜冷饮陈列展柜',
    },
    {
      shelfId: 4,
      code: 'D01',
      name: 'iWatch 智能穿戴馆',
      merchantTitle: 'iWatch · 智能穿戴与健康馆',
      category: '智能穿戴',
      x: 12.0,
      z: -16.0,
      width: 8.0,
      depth: 9.0,
      height: 4.8,
      wallColor: 0x475569, // 钛金属
      accentColor: 0xd97706, // 香槟金
      signColor: 0xc084fc, // 优雅流光紫
      interiorFloorColor: 0x334155,
      entranceSide: 'left',
      description: '时尚科技与健康监测中心，陈列精密智能腕表与多功能表带',
    },
    {
      shelfId: 5,
      code: 'E01',
      name: 'UltraVision 超显中心',
      merchantTitle: 'UltraVision · 高端电竞超显中心',
      category: '电脑办公',
      x: 0.0,
      z: -28.0,
      width: 14.0,
      depth: 9.0,
      height: 5.6,
      wallColor: 0x0f172a, // 旗舰深曜石
      accentColor: 0x38bdf8, // 激光霓虹
      signColor: 0x38bdf8,
      interiorFloorColor: 0x1e293b,
      entranceSide: 'front', // 门口朝向大道入口 (向南)
      description: '街区尽头全景超级旗舰店，陈列 4K 144Hz Mini-LED 顶级电竞巨幕',
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

  /** 清爽明亮的现代商业街氛围 (杜绝黑屏死寂) */
  private buildAtmosphere() {
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environment = envTex
    this.scene.environmentIntensity = 0.5

    // 清爽通透的蔚蓝天空背景色，彻底杜绝纯黑死寂
    this.scene.background = new THREE.Color(0x7dd3fc)
    // 彻底清除导致泛白起雾的无用全局 Fog
    this.scene.fog = null
    pmrem.dispose()
  }

  /** 中央步行街大道与两侧人行步道地坪 */
  private buildStreetBoulevard() {
    // 1. 中央石板主路面 (宽 14m, 长 72m)
    const roadGeo = new THREE.PlaneGeometry(14, 72)
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // 质感高级的花岗岩青石板
      roughness: 0.65,
      metalness: 0.05,
    })
    const road = new THREE.Mesh(roadGeo, roadMat)
    road.rotation.x = -Math.PI / 2
    road.position.set(0, 0, -4)
    road.receiveShadow = true
    this.scene.add(road)

    // 中央导向发光纹理带
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 68), lineMat)
    centerLine.rotation.x = -Math.PI / 2
    centerLine.position.set(0, 0.01, -4)
    this.scene.add(centerLine)

    // 2. 两侧商铺前的人行道广场 (高出路面 0.12m，浅灰大理石石砖)
    const sideWalkMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc, // 浅灰大理石
      roughness: 0.5,
      metalness: 0.05,
    })
    // 左侧人行道广场 (x: -7 到 -19)
    const leftWalk = new THREE.Mesh(new THREE.BoxGeometry(13, 0.24, 72), sideWalkMat)
    leftWalk.position.set(-13.5, 0.12, -4)
    leftWalk.receiveShadow = true
    this.scene.add(leftWalk)

    // 右侧人行道广场 (x: 7 到 19)
    const rightWalk = new THREE.Mesh(new THREE.BoxGeometry(13, 0.24, 72), sideWalkMat)
    rightWalk.position.set(13.5, 0.12, -4)
    rightWalk.receiveShadow = true
    this.scene.add(rightWalk)

    // 路缘石与暖金引导光带
    const curbGlowMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x0284c7,
      emissiveIntensity: 1.5,
    })
    const leftCurbGlow = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 72), curbGlowMat)
    leftCurbGlow.position.set(-7.05, 0.24, -4)
    this.scene.add(leftCurbGlow)

    const rightCurbGlow = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 72), curbGlowMat)
    rightCurbGlow.position.set(7.05, 0.24, -4)
    this.scene.add(rightCurbGlow)
  }

  /** 街区设施：迎宾拱门、路灯、绿化花坛 */
  private buildStreetProps() {
    // 1. 入口迎宾拱门 (Z = 24)
    const archMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.25 })
    const archSignMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x0284c7,
      emissiveIntensity: 1.2,
    })

    const archGroup = new THREE.Group()
    archGroup.position.set(0, 0, 24)

    // 左右立柱
    const colLeft = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.8, 0.8), archMat)
    colLeft.position.set(-7.5, 2.9, 0)
    archGroup.add(colLeft)
    this.colliders.push(colLeft)

    const colRight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.8, 0.8), archMat)
    colRight.position.set(7.5, 2.9, 0)
    archGroup.add(colRight)
    this.colliders.push(colRight)

    // 跨街横梁
    const beam = new THREE.Mesh(new THREE.BoxGeometry(15.8, 0.8, 0.8), archMat)
    beam.position.set(0, 5.8, 0)
    archGroup.add(beam)

    // 拱门迎宾标牌
    const archSign = new THREE.Mesh(new THREE.BoxGeometry(11, 0.6, 0.15), archSignMat)
    archSign.position.set(0, 5.8, 0.42)
    archGroup.add(archSign)

    // 拱门文字 Sprite
    const archTextSprite = this.createTextSprite('✦ 智慧未来商业步行街 · SMART SHOPPING BOULEVARD ✦', '#38bdf8', 36)
    archTextSprite.position.set(0, 5.8, 0.52)
    archTextSprite.scale.set(8.5, 1.1, 1)
    archGroup.add(archTextSprite)

    this.scene.add(archGroup)

    // 2. 街灯与绿化花坛 (沿街两侧成对排布)
    const zPositions = [16, 4, -8, -20]
    zPositions.forEach((z) => {
      this.createStreetLamp(-6.5, z)
      this.createStreetLamp(6.5, z)
      this.createPlanterBox(-7.4, z + 6)
      this.createPlanterBox(7.4, z + 6)
    })
  }

  /** 创建现代路灯与暖色点光源 */
  private createStreetLamp(x: number, z: number) {
    const lampGroup = new THREE.Group()
    lampGroup.position.set(x, 0.24, z)

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.2 })
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.4, 16), poleMat)
    pole.position.y = 2.2
    pole.castShadow = true
    lampGroup.add(pole)

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), poleMat)
    arm.position.set(x > 0 ? -0.45 : 0.45, 4.35, 0)
    lampGroup.add(arm)

    // 发光灯罩
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfef3c7,
      emissiveIntensity: 2.0,
    })
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), headMat)
    head.position.set(x > 0 ? -0.8 : 0.8, 4.25, 0)
    lampGroup.add(head)

    // 暖光点光源照亮人行道（无需阴影投射，避免消耗 WebGL 纹理单元）
    const light = new THREE.PointLight(0xffedd5, 12, 12, 1.6)
    light.position.set(x > 0 ? -0.8 : 0.8, 4.1, 0)
    lampGroup.add(light)

    this.scene.add(lampGroup)
    this.colliders.push(pole)
  }

  /** 街头绿植花坛 */
  private createPlanterBox(x: number, z: number) {
    const boxGroup = new THREE.Group()
    boxGroup.position.set(x, 0.24, z)

    const boxMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 })
    const plantMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 })

    const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.0), boxMat)
    box.position.y = 0.25
    box.castShadow = true
    box.receiveShadow = true
    boxGroup.add(box)

    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75), plantMat)
    bush.position.y = 0.85
    bush.scale.set(1.1, 0.85, 1.3)
    bush.castShadow = true
    boxGroup.add(bush)

    this.scene.add(boxGroup)
    this.colliders.push(box)
  }

  /** 构建 7 座具有高精独立建筑外观、发光门头与点击进入交互的商铺 */
  private buildShops() {
    this.shops.forEach((cfg) => {
      this.buildSingleShop(cfg)
    })
  }

  /** 单个商铺建筑生成器 */
  private buildSingleShop(cfg: ShopConfig) {
    const shopGroup = new THREE.Group()
    shopGroup.position.set(cfg.x, 0.24, cfg.z)

    const wallHeight = cfg.height
    const wallThick = 0.3
    const halfW = cfg.width / 2
    const halfD = cfg.depth / 2

    // 建筑主材质
    const wallMat = new THREE.MeshStandardMaterial({
      color: cfg.wallColor,
      metalness: 0.2,
      roughness: 0.4,
    })
    const accentMat = new THREE.MeshStandardMaterial({
      color: cfg.accentColor,
      metalness: 0.6,
      roughness: 0.3,
    })
    const interiorFloorMat = new THREE.MeshStandardMaterial({
      color: cfg.interiorFloorColor,
      roughness: 0.3,
      metalness: 0.1,
    })
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      opacity: 0.85,
      transparent: true,
      roughness: 0.05,
      ior: 1.5,
      reflectivity: 0.8,
    })

    // 1. 室内独立地坪
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(cfg.width, cfg.depth), interiorFloorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0.02
    floor.receiveShadow = true
    shopGroup.add(floor)

    // 2. 吊顶天花板
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(cfg.width + 0.2, 0.3, cfg.depth + 0.2), wallMat)
    ceiling.position.y = wallHeight
    shopGroup.add(ceiling)

    // 3. 实体围墙（三面封闭墙体，仅临街正面开放供出入）
    if (cfg.entranceSide === 'right') {
      // 门口朝东：后墙在西侧 (-halfW)，南北两侧为隔断山墙
      const backWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, cfg.depth), wallMat)
      backWall.position.set(-halfW, wallHeight / 2, 0)
      backWall.castShadow = true
      backWall.receiveShadow = true
      shopGroup.add(backWall)
      this.colliders.push(backWall)

      const northWall = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, wallHeight, wallThick), wallMat)
      northWall.position.set(0, wallHeight / 2, -halfD)
      northWall.castShadow = true
      northWall.receiveShadow = true
      shopGroup.add(northWall)
      this.colliders.push(northWall)

      const southWall = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, wallHeight, wallThick), wallMat)
      southWall.position.set(0, wallHeight / 2, halfD)
      southWall.castShadow = true
      southWall.receiveShadow = true
      shopGroup.add(southWall)
      this.colliders.push(southWall)
    } else if (cfg.entranceSide === 'left') {
      // 门口朝西：后墙在东侧 (+halfW)，南北两侧为隔断山墙
      const backWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, cfg.depth), wallMat)
      backWall.position.set(halfW, wallHeight / 2, 0)
      backWall.castShadow = true
      backWall.receiveShadow = true
      shopGroup.add(backWall)
      this.colliders.push(backWall)

      const northWall = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, wallHeight, wallThick), wallMat)
      northWall.position.set(0, wallHeight / 2, -halfD)
      northWall.castShadow = true
      northWall.receiveShadow = true
      shopGroup.add(northWall)
      this.colliders.push(northWall)

      const southWall = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, wallHeight, wallThick), wallMat)
      southWall.position.set(0, wallHeight / 2, halfD)
      southWall.castShadow = true
      southWall.receiveShadow = true
      shopGroup.add(southWall)
      this.colliders.push(southWall)
    } else {
      // 门口朝南：后墙在北侧 (-halfD)，东西两侧为侧墙
      const backWall = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, wallHeight, wallThick), wallMat)
      backWall.position.set(0, wallHeight / 2, -halfD)
      backWall.castShadow = true
      backWall.receiveShadow = true
      shopGroup.add(backWall)
      this.colliders.push(backWall)

      const westWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, cfg.depth), wallMat)
      westWall.position.set(-halfW, wallHeight / 2, 0)
      westWall.castShadow = true
      westWall.receiveShadow = true
      shopGroup.add(westWall)
      this.colliders.push(westWall)

      const eastWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, cfg.depth), wallMat)
      eastWall.position.set(halfW, wallHeight / 2, 0)
      eastWall.castShadow = true
      eastWall.receiveShadow = true
      shopGroup.add(eastWall)
      this.colliders.push(eastWall)
    }

    // 4. 临街高拟真门面 (Facade & Entrance)：
    // 包含开放式双门门廊、两侧通透落地大玻璃橱窗、出挑雨棚与发光大招牌
    const frontGroup = new THREE.Group()
    const facadeW = cfg.entranceSide === 'front' ? cfg.width : cfg.depth
    const halfFW = facadeW / 2

    // 4.1 门头出挑雨棚 (深 1.4m)
    const canopyMat = new THREE.MeshStandardMaterial({
      color: cfg.accentColor,
      metalness: 0.7,
      roughness: 0.25,
    })
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(facadeW * 0.95, 0.3, 1.4), canopyMat)
    canopy.position.set(0, wallHeight - 0.7, 0.7)
    canopy.castShadow = true
    frontGroup.add(canopy)

    // 雨棚下方内嵌筒灯照亮门口地面
    const downLight = new THREE.PointLight(0xffedd5, 10, 6, 1.8)
    downLight.position.set(0, wallHeight - 0.9, 0.7)
    frontGroup.add(downLight)

    // 4.2 3D 立体发光门头大招牌
    const signBoardMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8,
    })
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(facadeW * 0.86, 0.85, 0.16), signBoardMat)
    signBoard.position.set(0, wallHeight - 0.15, 0.1)
    frontGroup.add(signBoard)

    // 招牌霓虹发光外框
    const neonBorderMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: cfg.signColor,
      emissiveIntensity: 2.2,
    })
    const neonBorder = new THREE.Mesh(new THREE.BoxGeometry(facadeW * 0.88, 0.88, 0.12), neonBorderMat)
    neonBorder.position.set(0, wallHeight - 0.15, 0.08)
    frontGroup.add(neonBorder)

    // 店铺专属高清晰度 3D 招牌文字 Sprite (带真实深度测试，杜绝遮挡)
    const signSprite = this.createTextSprite(cfg.merchantTitle, `#${cfg.signColor.toString(16).padStart(6, '0')}`, 34)
    signSprite.position.set(0, wallHeight - 0.15, 0.22)
    signSprite.scale.set(facadeW * 0.8, 0.78, 1)
    frontGroup.add(signSprite)

    // 4.3 门口两侧建筑立柱 (宽 0.8m)
    const pillarGeo = new THREE.BoxGeometry(0.8, wallHeight, wallThick)
    const leftPillar = new THREE.Mesh(pillarGeo, accentMat)
    leftPillar.position.set(-halfFW + 0.4, wallHeight / 2, 0)
    leftPillar.castShadow = true
    frontGroup.add(leftPillar)
    this.colliders.push(leftPillar)

    const rightPillar = new THREE.Mesh(pillarGeo, accentMat)
    rightPillar.position.set(halfFW - 0.4, wallHeight / 2, 0)
    rightPillar.castShadow = true
    frontGroup.add(rightPillar)
    this.colliders.push(rightPillar)

    // 4.4 门廊上方封板
    const topLintel = new THREE.Mesh(new THREE.BoxGeometry(facadeW - 1.6, wallHeight - 3.4, wallThick), wallMat)
    topLintel.position.set(0, wallHeight - (wallHeight - 3.4) / 2, 0)
    frontGroup.add(topLintel)

    // 4.5 两侧落地通透大橱窗玻璃与展台基座
    const windowW = (facadeW - 4.6) / 2
    if (windowW > 0.8) {
      // 左橱窗玻璃
      const glassLeft = new THREE.Mesh(new THREE.BoxGeometry(windowW, 2.8, 0.05), glassMat)
      glassLeft.position.set(-halfFW + 0.8 + windowW / 2, 1.4, 0)
      frontGroup.add(glassLeft)

      // 右橱窗玻璃
      const glassRight = new THREE.Mesh(new THREE.BoxGeometry(windowW, 2.8, 0.05), glassMat)
      glassRight.position.set(halfFW - 0.8 - windowW / 2, 1.4, 0)
      frontGroup.add(glassRight)

      // 橱窗底座矮墙
      const baseGeo = new THREE.BoxGeometry(windowW, 0.25, wallThick)
      const baseLeft = new THREE.Mesh(baseGeo, accentMat)
      baseLeft.position.set(-halfFW + 0.8 + windowW / 2, 0.125, 0)
      frontGroup.add(baseLeft)

      const baseRight = new THREE.Mesh(baseGeo, accentMat)
      baseRight.position.set(halfFW - 0.8 - windowW / 2, 0.125, 0)
      frontGroup.add(baseRight)
    }

    // 4.6 门口迎宾门槛地垫
    const matGeo = new THREE.PlaneGeometry(3.0, 1.2)
    const welcomeMat = new THREE.Mesh(
      matGeo,
      new THREE.MeshStandardMaterial({
        color: cfg.accentColor,
        roughness: 0.9,
      })
    )
    welcomeMat.rotation.x = -Math.PI / 2
    welcomeMat.position.set(0, 0.015, 0.6)
    frontGroup.add(welcomeMat)

    // 5. 根据朝向调整立面在店铺中的相对位置
    if (cfg.entranceSide === 'right') {
      // 门口朝东（面朝中央大道）
      frontGroup.rotation.y = Math.PI / 2
      frontGroup.position.set(halfW, 0, 0)
    } else if (cfg.entranceSide === 'left') {
      // 门口朝西（面朝中央大道）
      frontGroup.rotation.y = -Math.PI / 2
      frontGroup.position.set(-halfW, 0, 0)
    } else {
      // 尽头大店朝南（面朝大道入口）
      frontGroup.position.set(0, 0, halfD)
    }
    shopGroup.add(frontGroup)

    // 6. 店内重点照明聚光灯 (打亮中央展台，保留真实漫射泛光，关闭 shadow 以节约 WebGL 纹理单元)
    const shopLight = new THREE.SpotLight(0xffffff, 16, 14, Math.PI / 2.8, 0.35)
    shopLight.position.set(0, wallHeight - 0.2, 0)
    shopLight.target.position.set(0, 0.9, 0)
    shopGroup.add(shopLight)
    shopGroup.add(shopLight.target)

    // 7. 注册店铺点击可拾取热区 (Click to Enter Shop Hitbox)
    // 覆盖整个门头招牌与大门入口通道，便于用户轻松点中店铺
    const hitBoxGeo = new THREE.BoxGeometry(facadeW * 0.9, 3.8, 2.2)
    const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false })
    const shopHitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat)
    shopHitBox.position.set(0, 2.0, 0.6)

    // 挂载店铺交互元数据
    const shopUserData = {
      isShop: true,
      shelfId: cfg.shelfId,
      shelfCode: cfg.code,
      shopName: cfg.name,
      merchantTitle: cfg.merchantTitle,
      category: cfg.category,
      description: cfg.description,
      x: cfg.x,
      z: cfg.z,
    }
    shopHitBox.userData = shopUserData
    frontGroup.add(shopHitBox)
    this.shopPickables.push(shopHitBox)

    // 招牌本身也作为拾取目标
    signBoard.userData = shopUserData
    this.shopPickables.push(signBoard)

    this.scene.add(shopGroup)
  }

  /** 主照明系统：清朗日光与柔和半球环境光 (平衡光比，杜绝过曝泛白) */
  private buildLights() {
    // 1. 半球天光（天空明亮蓝白，地面轻微暖灰反射，立体通透）
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x64748b, 0.7)
    hemiLight.position.set(0, 40, 0)
    this.scene.add(hemiLight)

    // 2. 纯白温和环境光，适度柔光
    const ambient = new THREE.AmbientLight(0xffffff, 0.9)
    this.scene.add(ambient)

    // 3. 温暖主太阳平行光（承担逼真柔和阴影投射）
    this.sun = new THREE.DirectionalLight(0xfffbeb, 1.8)
    this.sun.position.set(20, 36, 18)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.width = 2048
    this.sun.shadow.mapSize.height = 2048
    this.sun.shadow.camera.near = 0.5
    this.sun.shadow.camera.far = 100
    this.sun.shadow.camera.left = -35
    this.sun.shadow.camera.right = 35
    this.sun.shadow.camera.top = 45
    this.sun.shadow.camera.bottom = -45
    this.sun.shadow.bias = -0.0008
    this.scene.add(this.sun)
  }

  /** Canvas 绘制高清晰度 3D 文字 Sprite（必须保留 depthTest: true 杜绝遮挡乱飞） */
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
      ctx.shadowBlur = 16
      ctx.fillStyle = '#ffffff'
      ctx.fillText(text, canvas.width / 2, canvas.height / 2)

      // 叠加纯色以保证字迹清晰
      ctx.shadowBlur = 0
      ctx.fillStyle = colorHex
      ctx.fillText(text, canvas.width / 2, canvas.height / 2)
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    // 关键修正：开启 depthTest，尊重 3D 深度遮挡关系
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: true })
    const sprite = new THREE.Sprite(mat)
    sprite.renderOrder = 10
    return sprite
  }
}
