/**
 * 全局单实例持久化 WebGL 舞台 (WebGLStage)
 * 承载：
 * - Scene 01: 21st.dev DesignAli 45° 斜切百叶窗色散光学冲击波 Shader
 * - Scene 02: Kora 3D 聚光灯与透视网格湿地反射（通过 gsap.quickTo 实时追踪上方物理滑轨当前激活衣架）
 * - Scene 03: Kora 第 4 幕同款 3D 液态虹彩噪波球体（随 AI/RAG 检索状态律动）
 * - Scene 04: 极简暗黑工作室环境网格
 */
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap, useGSAP } from "../../lib/gsap";
import {
  DESIGNALI_FRAGMENT_SHADER,
  DESIGNALI_VERTEX_SHADER,
  KORA_BLOB_FRAGMENT_SHADER,
  KORA_STAGE_VERTEX_SHADER,
  computeSceneWeights,
  hexToNormalizedRgb,
} from "./shaders";

export interface WebGLStageProps {
  activeScene: 0 | 1 | 2 | 3 | 4 | 5;
  spotlightX: number;
  spotlightColor: string;
  oracleActive: boolean;
}

interface UniformState {
  w0: number;
  w1: number;
  w2: number;
  w3: number;
  spotX: number;
  spotR: number;
  spotG: number;
  spotB: number;
  blobOpacity: number;
  turbulence: number;
  camX: number;
  camY: number;
  camZ: number;
}

export function WebGLStage({
  activeScene,
  spotlightX,
  spotlightColor,
  oracleActive,
}: WebGLStageProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<UniformState>({
    w0: 1,
    w1: 0,
    w2: 0,
    w3: 0,
    spotX: 0,
    spotR: 200 / 255,
    spotG: 195 / 255,
    spotB: 242 / 255,
    blobOpacity: 0,
    turbulence: 0.1,
    camX: 0,
    camY: 0.4,
    camZ: 4.5,
  });

  const quickSpotX = useRef<gsap.QuickToFunc | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) {
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      // Headless / jsdom 环境无 WebGL 上下文时安全降级
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      (container.clientWidth || window.innerWidth) / Math.max(1, container.clientHeight || window.innerHeight),
      0.1,
      100
    );
    camera.position.set(0, 0.4, 4.5);

    // 1. 全屏背景 Shader 平面 (Scene 01 Shockwave + Scene 02 Spotlight + Scene 03/04 Backdrop)
    const bgUniforms = {
      uResolution: {
        value: new THREE.Vector2(
          renderer.domElement.width || window.innerWidth,
          renderer.domElement.height || window.innerHeight
        ),
      },
      uTime: { value: 0 },
      uScene1Weight: { value: 1 },
      uScene2Weight: { value: 0 },
      uScene3Weight: { value: 0 },
      uScene4Weight: { value: 0 },
      uSpotlightX: { value: 0 },
      uSpotlightColor: { value: new THREE.Vector3(200 / 255, 195 / 255, 242 / 255) },
    };

    const bgQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: DESIGNALI_VERTEX_SHADER,
        fragmentShader: DESIGNALI_FRAGMENT_SHADER,
        uniforms: bgUniforms,
        depthWrite: false,
        depthTest: false,
      })
    );
    bgQuad.renderOrder = -1;
    scene.add(bgQuad);

    // 2. Scene 03 Kora 3D 液态虹彩流光球体
    const blobUniforms = {
      uTime: { value: 0 },
      uTurbulence: { value: 0.1 },
      uOpacity: { value: 0 },
    };
    const blobGeo = new THREE.IcosahedronGeometry(1.05, 32);
    const blobMat = new THREE.ShaderMaterial({
      vertexShader: KORA_STAGE_VERTEX_SHADER,
      fragmentShader: KORA_BLOB_FRAGMENT_SHADER,
      uniforms: blobUniforms,
      transparent: true,
    });
    const blobMesh = new THREE.Mesh(blobGeo, blobMat);
    blobMesh.position.set(-1.35, 0.05, 0);
    scene.add(blobMesh);

    quickSpotX.current = gsap.quickTo(stateRef.current, "spotX", {
      duration: 0.45,
      ease: "power3.out",
    });

    const onResize = () => {
      if (!renderer || !container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      bgUniforms.uResolution.value.set(renderer.domElement.width, renderer.domElement.height);
    };
    window.addEventListener("resize", onResize);

    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const s = stateRef.current;

      bgUniforms.uTime.value = elapsed;
      bgUniforms.uScene1Weight.value = s.w0;
      bgUniforms.uScene2Weight.value = s.w1;
      bgUniforms.uScene3Weight.value = s.w2;
      bgUniforms.uScene4Weight.value = s.w3;
      bgUniforms.uSpotlightX.value = s.spotX;
      bgUniforms.uSpotlightColor.value.set(s.spotR, s.spotG, s.spotB);

      blobUniforms.uTime.value = elapsed;
      blobUniforms.uOpacity.value = s.blobOpacity;
      blobUniforms.uTurbulence.value = s.turbulence;
      blobMesh.rotation.y = elapsed * 0.28;
      blobMesh.rotation.x = Math.sin(elapsed * 0.4) * 0.2;
      blobMesh.visible = s.blobOpacity > 0.01;

      camera.position.set(s.camX, s.camY, s.camZ);
      camera.lookAt(0, 0, 0);

      renderer?.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      bgQuad.geometry.dispose();
      (bgQuad.material as THREE.Material).dispose();
      blobGeo.dispose();
      blobMat.dispose();
      renderer?.dispose();
      if (renderer?.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 受控机位与六幕权重插值 (GSAP useGSAP + CustomEase)
  useGSAP(
    () => {
      const [w0, w1, w2, w3] = computeSceneWeights(activeScene, 6);
      const camPresets: Record<0 | 1 | 2 | 3 | 4 | 5, [number, number, number]> = {
        0: [0, 0.2, 4.5],
        1: [0, 0.5, 4.0],
        2: [-0.25, 0.65, 3.85],
        3: [0.25, 0.45, 3.95],
        4: [0.2, 0.1, 3.8],
        5: [0, 0.3, 4.8],
      };
      const [cx, cy, cz] = camPresets[activeScene];

      gsap.to(stateRef.current, {
        w0,
        w1,
        w2,
        w3,
        blobOpacity: activeScene === 4 ? 0.95 : 0,
        camX: cx,
        camY: cy,
        camZ: cz,
        duration: 1.05,
        ease: "koraOut",
        overwrite: "auto",
      });
    },
    { dependencies: [activeScene] }
  );

  // 第 02 幕物理衣架位置与主题色实时联动 3D 聚光灯
  useGSAP(
    () => {
      quickSpotX.current?.(spotlightX);
      const [r, g, b] = hexToNormalizedRgb(spotlightColor);
      gsap.to(stateRef.current, {
        spotR: r,
        spotG: g,
        spotB: b,
        duration: 0.5,
        ease: "power2.out",
        overwrite: "auto",
      });
    },
    { dependencies: [spotlightX, spotlightColor] }
  );

  // 第 03 幕 AI/RAG 思考状态驱动液态球体湍流强度
  useGSAP(
    () => {
      gsap.to(stateRef.current, {
        turbulence: oracleActive ? 0.85 : 0.12,
        duration: 0.6,
        ease: "power2.inOut",
      });
    },
    { dependencies: [oracleActive] }
  );

  return (
    <div
      ref={containerRef}
      data-webgl-stage
      data-active-scene={activeScene}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
    />
  );
}
