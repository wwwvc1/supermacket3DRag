"use client";

/**
 * 21st.dev @rahil1202/components/water-ripple-image
 * 基于 WebGL Fragment Shader 的真实液态焦散与水波纹折射图像组件
 * 支持 blueish、scale、illumination、surfaceDistortion、waterDistortion 参数与鼠标划过实时涟漪扰动
 */
import * as React from "react";
import * as THREE from "three";

export interface WaterRippleImageProps {
  src: string;
  alt?: string;
  blueish?: number;
  scale?: number;
  illumination?: number;
  surfaceDistortion?: number;
  waterDistortion?: number;
  className?: string;
  imgClassName?: string;
}

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uHover;
  uniform float uScale;
  uniform float uIllumination;
  uniform float uSurfaceDistortion;
  uniform float uWaterDistortion;
  uniform float uBlueish;

  // 2D Simplex-like wave interference for realistic water caustics
  float waveField(vec2 p, float t) {
    float w1 = sin(p.x * uScale + t * 1.9 + cos(p.y * (uScale * 0.85) - t * 1.4));
    float w2 = cos(p.y * (uScale * 1.15) - t * 1.6 + sin(p.x * uScale + t * 1.2));
    float dist = length(vUv - uPointer);
    float pointerRipple = sin(dist * 38.0 - t * 9.5) * exp(-dist * 5.5) * uHover * 1.65;
    return (w1 + w2) * 0.5 + pointerRipple;
  }

  void main() {
    vec2 p = vUv;
    float t = uTime;

    float h0 = waveField(p, t);
    float hx = waveField(p + vec2(0.008, 0.0), t) - h0;
    float hy = waveField(p + vec2(0.0, 0.008), t) - h0;

    // Refractive UV displacement
    vec2 displacedUv = clamp(
      p + vec2(hx, hy) * (uWaterDistortion * 12.0 + uSurfaceDistortion * 8.0),
      0.01,
      0.99
    );

    vec4 texColor = texture2D(uTexture, displacedUv);

    // Caustic specular highlights across wave crests
    float specular = pow(max(0.0, hx * 14.0 + hy * 14.0 + 0.35), 3.0) * uIllumination * 2.4;
    vec3 waterTint = vec3(0.72, 0.91, 1.0);
    vec3 tinted = mix(texColor.rgb, texColor.rgb * waterTint, uBlueish * 0.35);

    gl_FragColor = vec4(tinted + vec3(specular), texColor.a);
  }
`;

export function WaterRippleImage({
  src,
  alt = "",
  blueish = 0.4,
  scale = 7,
  illumination = 0.15,
  surfaceDistortion = 0.03,
  waterDistortion = 0.02,
  className = "",
  imgClassName = "",
}: WaterRippleImageProps): React.JSX.Element {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const pointerRef = React.useRef<{ x: number; y: number; hover: number }>({
    x: 0.5,
    y: 0.5,
    hover: 0.25,
  });
  const [webglReady, setWebglReady] = React.useState(false);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) {
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 380;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.domElement.className = "pointer-events-none absolute inset-0 h-full w-full object-cover";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const texture = loader.load(
      src,
      () => setWebglReady(true),
      undefined,
      () => setWebglReady(false)
    );

    const uniforms = {
      uTexture: { value: texture },
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uHover: { value: 0.25 },
      uScale: { value: scale },
      uIllumination: { value: illumination },
      uSurfaceDistortion: { value: surfaceDistortion },
      uWaterDistortion: { value: waterDistortion },
      uBlueish: { value: blueish },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      transparent: true,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    let rafId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      uniforms.uTime.value = clock.getElapsedTime();
      uniforms.uPointer.value.set(pointerRef.current.x, pointerRef.current.y);
      uniforms.uHover.value += (pointerRef.current.hover - uniforms.uHover.value) * 0.08;
      renderer?.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!renderer || !container) return;
      renderer.setSize(container.clientWidth || 320, container.clientHeight || 380);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      quad.geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer?.dispose();
      if (renderer?.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [src, scale, illumination, surfaceDistortion, waterDistortion, blueish]);

  return (
    <div
      ref={containerRef}
      data-water-ripple-image
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          pointerRef.current.x = (e.clientX - rect.left) / rect.width;
          pointerRef.current.y = 1 - (e.clientY - rect.top) / rect.height;
          pointerRef.current.hover = 1.0;
        }
      }}
      onPointerLeave={() => {
        pointerRef.current.hover = 0.22;
      }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* 底层真实高清商品图（当 WebGL 纹理解析完成前或无 WebGL 环境时保证 100% 清晰可见） */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={`h-full w-full select-none object-contain transition-opacity duration-300 ${
          webglReady ? "opacity-0" : "opacity-100"
        } ${imgClassName}`}
      />
    </div>
  );
}

export default WaterRippleImage;
