/**
 * KORA × TACTILE ARCHIVE 核心 GLSL 着色器与场景权重计算工具
 * - Scene 01: 21st.dev DesignAli 45° 斜切百叶窗色散光学冲击波 Shader
 * - Scene 02: Kora 透视网格湿地反射与追光舞台
 * - Scene 03: Kora 液态虹彩噪波球体 (Iridescent Liquid Displacement Sphere)
 * - Scene 04: 极简暗黑工作室环境网格
 */

export const DESIGNALI_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export const DESIGNALI_FRAGMENT_SHADER = `
  precision highp float;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uScene1Weight;
  uniform float uScene2Weight;
  uniform float uScene3Weight;
  uniform float uScene4Weight;
  uniform float uSpotlightX;
  uniform vec3 uSpotlightColor;

  void main(void) {
    vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
    float t = uTime * 0.05;
    float lineWidth = 0.002;

    // 1. 21st.dev DesignAli 45° Slatted Chromatic Optical Shockwave
    vec3 portalColor = vec3(0.0);
    for (int j = 0; j < 3; j++) {
      for (int i = 0; i < 5; i++) {
        portalColor[j] += lineWidth * float(i * i) / abs(
          fract(t - 0.01 * float(j) + float(i) * 0.01) * 5.0 - length(uv) + mod(uv.x + uv.y, 0.2)
        );
      }
    }

    // 2. Scene 02 Kora Tactile Archive Volumetric Spotlight & Wet-Floor Reflection
    vec2 spotUv = uv - vec2(uSpotlightX * 0.65, 0.15);
    float beam = exp(-abs(spotUv.x) * 3.2) * smoothstep(-1.1, 0.9, uv.y);
    float floorGlow = exp(-length(uv - vec2(uSpotlightX * 0.65, -0.58)) * 2.6);
    float gridX = smoothstep(0.96, 1.0, cos((uv.x - uSpotlightX * 0.08) * 28.0));
    float gridY = smoothstep(0.96, 1.0, cos(uv.y * 28.0 + uTime * 0.3));
    float floorMask = smoothstep(0.0, -0.85, uv.y);
    vec3 archiveColor = uSpotlightColor * (beam * 0.22 + floorGlow * 0.36)
      + vec3(0.78, 0.76, 0.95) * (max(gridX, gridY) * floorMask * 0.09);

    // 3. Scene 03 Neural Atelier Deep Cosmic Aura
    float radial3 = exp(-length(uv - vec2(-0.38, 0.0)) * 1.8);
    vec3 oracleBg = mix(vec3(0.02, 0.015, 0.04), vec3(0.18, 0.14, 0.32), radial3);

    // 4. Scene 04 Studio Console Subtle Editorial Grid
    float studioGrid = max(
      smoothstep(0.985, 1.0, cos(uv.x * 20.0)),
      smoothstep(0.985, 1.0, cos(uv.y * 20.0))
    );
    vec3 studioColor = vec3(0.03, 0.03, 0.05) + vec3(0.78, 0.76, 0.95) * studioGrid * 0.04;

    vec3 finalColor = portalColor * uScene1Weight
      + archiveColor * uScene2Weight
      + oracleBg * uScene3Weight
      + studioColor * uScene4Weight;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export const KORA_STAGE_VERTEX_SHADER = `
  uniform float uTime;
  uniform float uTurbulence;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normal;
    float wave = sin(position.x * 3.2 + uTime * 1.8)
               * cos(position.y * 3.0 + uTime * 1.4)
               * sin(position.z * 2.8 + uTime * 2.1);
    vec3 displaced = position + normal * (wave * (0.14 + uTurbulence * 0.18));
    vPosition = displaced;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

export const KORA_BLOB_FRAGMENT_SHADER = `
  precision highp float;
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vec3 norm = normalize(vNormal);
    vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
    float fresnel = pow(1.0 - abs(dot(norm, viewDir)), 2.2);

    vec3 lilac = vec3(0.784, 0.765, 0.949);
    vec3 cyan = vec3(0.0, 0.941, 1.0);
    vec3 mint = vec3(0.659, 0.902, 0.812);
    vec3 base = vec3(0.07, 0.06, 0.11);

    float shift = 0.5 + 0.5 * sin(vPosition.x * 2.5 + vPosition.y * 2.0 + uTime * 1.6);
    vec3 iridescence = mix(lilac, mix(cyan, mint, shift), fresnel);
    vec3 col = mix(base, iridescence, clamp(fresnel * 1.35 + 0.25, 0.0, 1.0));

    gl_FragColor = vec4(col, uOpacity);
  }
`;

/**
 * 计算场景的归一化四通道渲染权重向量 [wPortal, wShowroom, wOracle, wStudio]
 * 支持 6 幕映射：0=Portal, 1/2/3=三大展厅(Garment Rail / Tech Table / Vitrine Gallery), 4=Oracle, 5=Studio
 */
export function computeSceneWeights(
  activeScene: number,
  totalScenes: 4 | 6 = 4
): [number, number, number, number] {
  if (totalScenes === 6) {
    const s = Math.max(0, Math.min(5, Math.round(activeScene)));
    return [
      s === 0 ? 1 : 0,
      s === 1 || s === 2 || s === 3 ? 1 : 0,
      s === 4 ? 1 : 0,
      s === 5 ? 1 : 0,
    ];
  }
  const clamped = Math.max(0, Math.min(3, Math.round(activeScene)));
  return [
    clamped === 0 ? 1 : 0,
    clamped === 1 ? 1 : 0,
    clamped === 2 ? 1 : 0,
    clamped === 3 ? 1 : 0,
  ];
}

/**
 * 将十六进制颜色字符串（如 #C8C3F2）解析为归一化 RGB 元组 [0..1, 0..1, 0..1]
 */
export function hexToNormalizedRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace(/[^0-9a-fA-F]/g, "");
  if (cleaned.length !== 6) {
    return [200 / 255, 195 / 255, 242 / 255];
  }
  const num = Number.parseInt(cleaned, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return [r, g, b];
}
