/**
 * 后处理特效管线 (Post-Processing Pipeline)：
 * 1. RenderPass：主场景高保真渲染
 * 2. UnrealBloomPass：高光/霓虹招牌/LED灯带/售罄红光精准泛光 (阈值 1.05，杜绝普通地面/墙面反光泛白起雾)
 * 3. OutputPass：ACES 电影级色彩管理与动态对比
 */
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

export class PostProcessing {
  composer: EffectComposer
  bloomPass: UnrealBloomPass
  renderPass: RenderPass
  outputPass: OutputPass

  constructor(
    private renderer: THREE.WebGLRenderer,
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera
  ) {
    const size = new THREE.Vector2()
    this.renderer.getSize(size)

    this.composer = new EffectComposer(this.renderer)

    // 1. 基础场景通道
    this.renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(this.renderPass)

    // 2. 选择性柔和辉光通道 (Bloom)
    // 关键参数调整：threshold 设为 1.6，仅真正的高亮自发光/霓虹材质生效，杜绝地面与墙壁泛白起雾！
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.x, size.y),
      0.28, // strength：自然清透，不泛白
      0.25, // radius
      1.6   // threshold：仅发光材质生效
    )
    this.composer.addPass(this.bloomPass)

    // 3. 最终输出通道 (包含 ACESFilmic 色彩映射)
    this.outputPass = new OutputPass()
    this.composer.addPass(this.outputPass)
  }

  setSize(width: number, height: number) {
    this.composer.setSize(width, height)
    this.bloomPass.resolution.set(width, height)
  }

  setQuality(high: boolean) {
    this.bloomPass.enabled = high
  }

  render() {
    this.composer.render()
  }
}
