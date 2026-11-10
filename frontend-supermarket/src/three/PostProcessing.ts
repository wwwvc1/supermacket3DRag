/**
 * 后处理特效管线 (Post-Processing Pipeline)：
 * 1. RenderPass：主场景渲染
 * 2. UnrealBloomPass：高光/LED灯带/售罄红光泛光光晕
 * 3. OutputPass：ACES 电影级色调映射与色彩管理
 * 4. 支持高质量/性能模式一键切换
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
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.x, size.y),
      0.45,
      0.5,
      0.85
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
