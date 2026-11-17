"use client";

/**
 * 21st.dev @louisstudios/components/warp-carousel 1:1 原生 WebGL2 光线投射广角畸变转盘组件
 * - 完整移植 Louis Studios 的 3D 环形轨迹方程 poseAt(q)（含 Hermite 样条折页铰链与非对称偏航角）
 * - 完整移植 110 帧单调三次 Hermite 旋转曲线 spin(frames) / spinN(frames, n) 与拖拽惯性弹簧阻尼 (-60*(P-to) - 13*v)
 * - 完整移植 WebGL2 片元着色器 (#version 300 es)：
 *   - lensH(a) 9 节点分段广角镜头水平拉伸与边缘回折
 *   - lensS(a) 边缘垂直扩张畸变
 *   - 三通道 RGB 色散偏移 (off = -20.92 / 0.0 / +11.91) 产生青/蓝/琥珀边缘虚影
 *   - shadeCard 解析光线-平面相交与硬件各向异性 Mipmap 采样 (sampler2DArray)
 *   - glowAt / glowShape 上下舞台边缘动态色彩匹配椭圆光晕
 * - 增强支持将真实数码硬件高清实拍图 (card.image) 烘焙进 B-spline 42 色网格渐变卡片纹理中，使商品实拍图随卡片一起发生真实的 WebGL2 广角镜头畸变与色散
 */
import * as React from "react";
import type { RailGarmentItem } from "../../types/domain";

/** The small graphic under each numeral. */
export type WarpCardDetail = "slider" | "ring" | "wave" | "cross" | "none";

/** One card on the Warp Carousel ring. */
export interface WarpCard {
  /** Two-line title, top left. Use "\n" for the line break. */
  title: string;
  /** The big thin numeral, for example "25". */
  value: string;
  /** Small superscript unit after the numeral, for example "%". */
  unit?: string;
  /** Small label at the bottom left. */
  footer?: string;
  /** Mesh gradient: 42 colours, a 6 by 7 grid read row by row from the top left, smoothed with a B-spline. */
  mesh?: string[];
  /** Numeral fill, left to right. */
  numeral?: [string, string];
  /** Colour of the glow this card casts onto the top and bottom edges while it faces the viewer. */
  glow?: string;
  /** The small graphic under the numeral. */
  detail?: WarpCardDetail;
  /** Detail accent colour: slider knob glow, waveform marker, ring ticks. */
  accent?: string;
  /** Labels for the detail: slider ends, or the crosshair pill and its two badges. */
  labels?: string[];
  /** Optional real product photograph painted onto the WebGL2 card texture. */
  image?: string;
}

export interface WarpCarouselProps {
  /** Optional domain items mapped automatically to WarpCard[] when provided. */
  items?: RailGarmentItem[];
  /** Controlled active index alias for domain integration. */
  activeIndex?: number;
  /** Callback when active index changes. */
  onActiveIndexChange?: (index: number) => void;
  /** Callback when user clicks the focal front card to inspect in 3D modal. */
  onInspectItem?: (index: number, sourceRect: DOMRect | null) => void;
  /** The cards on the ring, in order. */
  cards?: WarpCard[];
  /** Controlled front card index. Pair it with onIndexChange. */
  index?: number;
  /** Front card when uncontrolled. */
  defaultIndex?: number;
  /** Called when the front card should change: autoplay, drag, click, or arrow keys. */
  onIndexChange?: (index: number) => void;
  /** Spin to the next card on a timer. */
  autoplay?: boolean;
  /** Seconds between autoplay spins. */
  interval?: number;
  /** Cards advanced per autoplay spin. */
  step?: number;
  /** Stage colour behind the ring ("transparent" lets ElegantDarkPattern shine behind the ring). */
  background?: string;
  /** Overrides every card's own glow colour for the top and bottom glows. */
  glow?: string;
  /** Strength of the wide-lens flare at the left and right edges, 0 to 1. */
  warp?: number;
  /** Font stack for all card copy. */
  font?: string;
  /** Freeze the animation at this many seconds of autoplay time. */
  seconds?: number;
  /** Accessible name for the carousel region. */
  ariaLabel?: string;
  /** Extra class on the outer element. */
  className?: string;
  /** Extra style on the outer element. */
  style?: React.CSSProperties;
}

const DEFAULT_FONT =
  '"Inter", "SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, system-ui, "Helvetica Neue", Arial, sans-serif';

export const WARP_CAROUSEL_CARDS: WarpCard[] = [
  {
    title: "Motion budget\nper page",
    value: "25",
    unit: "%",
    footer: "Tuned per screen",
    detail: "slider",
    labels: ["Calm", "Lively"],
    numeral: ["#3ad2ff", "#8cf6ff"],
    accent: "#7fe8ff",
    glow: "#12b0e8",
    mesh: [
      "#022852", "#031e3f", "#031934", "#021831", "#021b36", "#022246",
      "#022345", "#020e1e", "#01040f", "#000416", "#020b31", "#021c57",
      "#01172f", "#01010c", "#03001d", "#0a0f4c", "#112383", "#0b36af",
      "#021142", "#050b47", "#0c2e8f", "#165bd4", "#1675fd", "#167bff",
      "#03288e", "#0438af", "#0d66e7", "#107eec", "#30afff", "#71dcff",
      "#0356e8", "#0259ec", "#0945b0", "#001a49", "#3f7c9d", "#d4ffff",
      "#0365ff", "#0256ea", "#052a87", "#00001f", "#1f4c7b", "#9ee7ff",
    ],
  },
  {
    title: "Loop length\nseconds",
    value: "20",
    unit: "s",
    footer: "Seamless on every loop",
    detail: "cross",
    labels: ["Preview", "in", "out"],
    numeral: ["#e2a6ff", "#fff6ff"],
    accent: "#d9a8ff",
    glow: "#62bce8",
    mesh: [
      "#4c2d5f", "#3b2245", "#3e285b", "#33204f", "#381844", "#572571",
      "#644096", "#4f3688", "#8358f6", "#8d54f3", "#5e20ac", "#6e24b7",
      "#482e6d", "#261b48", "#825bf6", "#d48cff", "#d07bff", "#b359ff",
      "#2d1837", "#140a1b", "#2c1d66", "#3a2383", "#693bca", "#8b42ef",
      "#411c5b", "#300753", "#3b006e", "#500f79", "#7e31c1", "#9541f3",
      "#44245a", "#3f0c69", "#6f15b9", "#d17cff", "#e2a3ff", "#a668ff",
      "#4b2f60", "#4d2172", "#6819aa", "#9b48dc", "#965dc9", "#7745c4",
    ],
  },
  {
    title: "Frame rate\nsteady",
    value: "95",
    unit: "fps",
    footer: "Smooth on every screen",
    detail: "ring",
    numeral: ["#f4eeb6", "#c4c688"],
    accent: "#f6efc0",
    glow: "#dacbe9",
    mesh: [
      "#ff623e", "#f57337", "#e49435", "#fba03f", "#ef6b36", "#f14c36",
      "#f29a3e", "#a0a92e", "#a2ba36", "#fffe65", "#ffd852", "#f2863b",
      "#a5b12e", "#46821d", "#6a6127", "#b88b44", "#b6bd41", "#c4b838",
      "#7e9f27", "#3b5a19", "#412c10", "#0d1700", "#255b0c", "#98ad28",
      "#a5b232", "#3e7c1e", "#002800", "#00300f", "#5b9745", "#c1b833",
      "#f3983b", "#b3b431", "#6fa31f", "#9bc976", "#edd896", "#fd8c3d",
      "#ff5f3b", "#ff7d47", "#ffa880", "#ffc1d8", "#ff8d99", "#ff5438",
    ],
  },
  {
    title: "Components\nin the kit",
    value: "72",
    footer: "Studio-made",
    detail: "wave",
    numeral: ["#fffdf8", "#e8603f"],
    accent: "#ff6a3d",
    glow: "#6cc0ea",
    mesh: [
      "#48001c", "#400119", "#41011d", "#4b021e", "#47021a", "#480019",
      "#7e0036", "#8c0033", "#4b0120", "#10000c", "#1f010b", "#390116",
      "#e84396", "#ff568c", "#dc433c", "#0e0705", "#090004", "#2f0213",
      "#ff9fd9", "#ff6f90", "#a53625", "#190d05", "#050002", "#2f0110",
      "#ff67b5", "#b11348", "#000000", "#11000c", "#3e021b", "#8a0c31",
      "#e31771", "#5d0027", "#3a0021", "#620030", "#640627", "#dc184a",
      "#c10b5f", "#920245", "#ab054f", "#910041", "#650226", "#c01240",
    ],
  },
];

/** 将商城数码单品映射为 Louis Studios WarpCard（保留 42 色 B-Spline Mesh 渐变 + 真实硬件摄影） */
function mapItemsToWarpCards(items: RailGarmentItem[]): WarpCard[] {
  const details: WarpCardDetail[] = ["slider", "cross", "ring", "wave", "slider"];
  return items.map((item, idx) => {
    const preset = WARP_CAROUSEL_CARDS[idx % WARP_CAROUSEL_CARDS.length]!;
    const parts = item.name.split("·").map((s) => s.trim());
    const line1 = parts[0] || item.name;
    const line2 = parts[1] || item.details?.[0] || "Flagship Hardware";
    const priceNum = item.price ? String(item.price) : (item.tag || "9999").replace(/[^0-9]/g, "");
    return {
      title: `${line1}\n${line2}`,
      value: priceNum,
      unit: "RMB",
      footer: item.outOfStock
        ? "SOLD OUT · ARCHIVE"
        : `${item.details?.[0] ?? "IN ARCHIVE"} · CLICK TO INSPECT 3D`,
      detail: details[idx % details.length],
      labels: item.details?.slice(0, 3) ?? preset.labels,
      numeral: preset.numeral,
      accent: item.color || preset.accent,
      glow: item.color || preset.glow,
      mesh: preset.mesh,
      image: item.image,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Geometry: measured from the reference and fitted frame by frame.   */
/* Stage units: the stage is 720 units wide; a card is 256 by 320.    */
/* ------------------------------------------------------------------ */

const CW = 256;
const CH = 320;
const CR = 10;
const FOCAL = 734.103;
const G = {
  qA: 0.46401,
  XLA: 165.774,
  zA: 35.354,
  psiA: 1.44638,
  a1: 1.31454,
  a2: 1.10948,
  qB: 0.74999,
  XB: 204.525,
  ZB: 355.405,
  bB: 0.69311,
  bE: 0.04614,
  vC: 203.134,
  aC: 229.26,
  kB: 0.01087,
  bP: 0.99129,
  qPR: 1.01828,
  bPL: 1.0092,
  qPL: 1.07139,
};

type Pose = [number, number, number];

/** Pose of a card at ring offset q (0 front, +1 right, -1 left): centre x, depth behind the front plane, yaw. */
function poseAt(q0: number): Pose {
  let q = q0;
  if (Math.abs(q) < 1) q -= G.kB * Math.sin(Math.PI * q) ** 2;
  const s = q < 0 ? -1 : 1;
  const a = Math.abs(q);
  const half = CW / 2;
  if (a <= G.qA) {
    const t = a / G.qA;
    const xl = -half + (G.XLA + half) * Math.pow(t, G.a1);
    const zl = G.zA * t ** 4;
    const psi = G.psiA * Math.pow(t, G.a2);
    return [s * (xl + half * Math.cos(psi)), zl + half * Math.sin(psi), s * psi];
  }
  const dXL = ((G.XLA + half) * G.a1) / G.qA;
  const dZL = (G.zA * 4) / G.qA;
  const dps = (G.psiA * G.a2) / G.qA;
  let Hx: number;
  let Hz: number;
  if (a <= G.qB) {
    const L = G.qB - G.qA;
    const t = (a - G.qA) / L;
    const hx = G.XLA + CW * Math.cos(G.psiA);
    const hz = G.zA + CW * Math.sin(G.psiA);
    const dhx = dXL - CW * Math.sin(G.psiA) * dps;
    const dhz = dZL + CW * Math.cos(G.psiA) * dps;
    const h00 = 2 * t ** 3 - 3 * t ** 2 + 1;
    const h10 = t ** 3 - 2 * t ** 2 + t;
    const h01 = -2 * t ** 3 + 3 * t ** 2;
    const h11 = t ** 3 - t ** 2;
    Hx = h00 * hx + h10 * L * dhx * G.bB + h01 * G.XB + h11 * L * G.vC * G.bE;
    Hz = h00 * hz + h10 * L * dhz * G.bB + h01 * G.ZB;
  } else {
    const d = a - G.qB;
    Hx = G.XB + G.vC * d + G.aC * d * d;
    Hz = G.ZB;
  }
  const qP = s < 0 ? G.qPL : G.qPR;
  const bP = s < 0 ? G.bPL : G.bP;
  const LP = qP - G.qA;
  const tp = Math.min(1, (a - G.qA) / LP);
  const psi =
    (2 * tp ** 3 - 3 * tp ** 2 + 1) * G.psiA +
    (tp ** 3 - 2 * tp ** 2 + tp) * LP * dps * bP +
    (-2 * tp ** 3 + 3 * tp ** 2) * Math.PI;
  return [s * (Hx - half * Math.cos(psi)), Hz - half * Math.sin(psi), s * psi];
}

/* Spin curve: ring progress over one autoplay step, in reference frames (30 fps). */
const TK = [0, 3, 6, 8, 10, 11, 12, 13, 14, 16, 18, 21, 25, 30, 36, 45, 55, 70, 88, 110];
const TB = [
  0, 0.02175, 0.12069, 0.22549, 0.35493, 0.43254, 0.51436, 0.5952, 0.6751, 0.83199,
  0.9709, 1.12669, 1.27958, 1.40975, 1.53561, 1.68385, 1.79183, 1.89191, 1.95233, 2,
];
const DRIFT = 0.06511;
const REST_PHASE = 81.828;
const STEP_FRAMES = 110;

const SLOPES = (() => {
  const n = TK.length;
  const h = TK.slice(1).map((x, i) => x - TK[i]!);
  const dl = h.map((hi, i) => (TB[i + 1]! - TB[i]!) / hi);
  const d = new Array<number>(n).fill(0);
  for (let k = 1; k < n - 1; k++) {
    if (dl[k - 1]! * dl[k]! <= 0) d[k] = 0;
    else {
      const w1 = 2 * h[k]! + h[k - 1]!;
      const w2 = h[k]! + 2 * h[k - 1]!;
      d[k] = (w1 + w2) / (w1 / dl[k - 1]! + w2 / dl[k]!);
    }
  }
  const v = (dl[0]! + dl[n - 2]!) / 2;
  d[0] = v;
  d[n - 1] = v;
  return d;
})();

function spin(frames: number): number {
  if (frames <= 0) return 0;
  if (frames >= STEP_FRAMES) return 1;
  let i = 0;
  while (i < TK.length - 2 && frames > TK[i + 1]!) i++;
  const h = TK[i + 1]! - TK[i]!;
  const t = (frames - TK[i]!) / h;
  const h00 = 2 * t ** 3 - 3 * t ** 2 + 1;
  const h10 = t ** 3 - 2 * t ** 2 + t;
  const h01 = -2 * t ** 3 + 3 * t ** 2;
  const h11 = t ** 3 - t ** 2;
  return (h00 * TB[i]! + h10 * h * SLOPES[i]! + h01 * TB[i + 1]! + h11 * h * SLOPES[i + 1]!) / 2;
}

function spinN(frames: number, n: number): number {
  if (n <= STEP_FRAMES + 0.5) return spin((frames * STEP_FRAMES) / Math.max(1, n));
  const knee = 80;
  if (frames <= knee) return spin(frames);
  return spin(knee + ((frames - knee) * (STEP_FRAMES - knee)) / (n - knee));
}

const LEAD = (STEP_FRAMES - REST_PHASE) / 30;

function autoplayProgress(t: number, start: number, step: number, interval: number): number {
  if (t < LEAD) return start - step + DRIFT + step * spin(REST_PHASE + t * 30);
  const k = Math.floor((t - LEAD) / interval);
  const tau = (t - LEAD - k * interval) * 30;
  return start + k * step + DRIFT + step * spinN(tau, interval * 30);
}

/* ------------------------------------------------------------------ */
/* Colour helpers                                                     */
/* ------------------------------------------------------------------ */

function parseColor(
  c: string,
  fallback: [number, number, number] = [0, 0, 0]
): [number, number, number] {
  const s = (c || "").trim();
  if (!s || s === "transparent") return fallback;
  let m = /^#([0-9a-f]{3,8})$/i.exec(s);
  if (m) {
    let h = m[1]!;
    if (h.length <= 4) h = h.split("").map((x) => x + x).join("");
    const n = parseInt(h.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  m = /^rgba?\(([^)]+)\)$/i.exec(s);
  if (m) {
    const p = m[1]!
      .split(/[ ,/]+/)
      .filter(Boolean)
      .map((x) => parseFloat(x));
    return [p[0] || 0, p[1] || 0, p[2] || 0];
  }
  return fallback;
}

function rgba(c: [number, number, number], a: number) {
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
}

/* ------------------------------------------------------------------ */
/* Card painter (B-Spline 42-color mesh + Product Photo + Typography) */
/* ------------------------------------------------------------------ */

const imageCache = new Map<string, HTMLImageElement>();

function bspline(t: number, out: number[]) {
  const it = 1 - t;
  out[0] = (it * it * it) / 6;
  out[1] = (3 * t * t * t - 6 * t * t + 4) / 6;
  out[2] = (-3 * t * t * t + 3 * t * t + 3 * t + 1) / 6;
  out[3] = (t * t * t) / 6;
}

function meshGrid(mesh: string[] | undefined): [number, number, number][] {
  const fallback = ["#1d1d3a", "#3b2f8f", "#2a6fd6", "#0d0d24"];
  const src = mesh && mesh.length ? mesh : fallback;
  const cols = src.map((c) => parseColor(c));
  const out: [number, number, number][] = [];
  for (let j = 0; j < 7; j++) {
    for (let i = 0; i < 6; i++) {
      if (cols.length === 42) out.push(cols[j * 6 + i]!);
      else {
        const k = Math.min(cols.length - 1, Math.round(((j * 6 + i) / 41) * (cols.length - 1)));
        out.push(cols[k]!);
      }
    }
  }
  return out;
}

function paintMesh(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  mesh: string[] | undefined
) {
  const grid = meshGrid(mesh);
  const img = ctx.createImageData(w, h);
  const d = img.data;
  const wx = new Float32Array(w * 4);
  const ix = new Int32Array(w * 4);
  const tmp = [0, 0, 0, 0];
  for (let x = 0; x < w; x++) {
    const u = ((x + 0.5) / w) * 5;
    const i = Math.floor(u);
    bspline(u - i, tmp);
    for (let k = 0; k < 4; k++) {
      wx[x * 4 + k] = tmp[k]!;
      ix[x * 4 + k] = Math.min(5, Math.max(0, i - 1 + k));
    }
  }
  const row = new Float32Array(6 * 3);
  let seed = 1234567;
  for (let y = 0; y < h; y++) {
    const v = ((y + 0.5) / h) * 6;
    const j = Math.floor(v);
    bspline(v - j, tmp);
    row.fill(0);
    for (let k = 0; k < 4; k++) {
      const jj = Math.min(6, Math.max(0, j - 1 + k));
      const wy = tmp[k]!;
      for (let i = 0; i < 6; i++) {
        const c = grid[jj * 6 + i]!;
        row[i * 3] += c[0] * wy;
        row[i * 3 + 1] += c[1] * wy;
        row[i * 3 + 2] += c[2] * wy;
      }
    }
    for (let x = 0; x < w; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let k = 0; k < 4; k++) {
        const wgt = wx[x * 4 + k]!;
        const i3 = ix[x * 4 + k]! * 3;
        r += row[i3]! * wgt;
        g += row[i3 + 1]! * wgt;
        b += row[i3 + 2]! * wgt;
      }
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const n = (seed / 0x7fffffff - 0.5) * 1.6;
      const o = (y * w + x) * 4;
      d[o] = r + n;
      d[o + 1] = g + n;
      d[o + 2] = b + n;
      d[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function fontStr(weight: number, px: number, family: string) {
  return `${weight} ${px}px ${family}`;
}

function sizeForCap(
  ctx: CanvasRenderingContext2D,
  weight: number,
  family: string,
  cap: number,
  sample = "0"
) {
  ctx.font = fontStr(weight, 100, family);
  const m = ctx.measureText(sample);
  const asc = m.actualBoundingBoxAscent || 71;
  return (cap / asc) * 100;
}

function paintCard(cv: HTMLCanvasElement, card: WarpCard, family: string) {
  const w = cv.width;
  const h = cv.height;
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = cv.getContext("2d");
  } catch {
    return;
  }
  if (!ctx) return;
  const k = w / CW;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  paintMesh(ctx, w, h, card.mesh);
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.textBaseline = "alphabetic";
  const white: [number, number, number] = [255, 255, 255];
  const accent = parseColor(card.accent || "#ffffff");

  // Title and footer
  const small = sizeForCap(ctx, 400, family, 8.2, "H");
  ctx.font = fontStr(500, small, family);
  ctx.fillStyle = rgba(white, 0.94);
  const lines = (card.title || "").split("\n");
  lines.slice(0, 2).forEach((ln, i) => ctx!.fillText(ln, 17, 34 + i * 14));
  if (card.footer) {
    const footPx = sizeForCap(ctx, 400, family, 6.8, "H");
    ctx.font = fontStr(400, footPx, family);
    ctx.fillStyle = rgba(white, 0.85);
    ctx.fillText(card.footer, 17, 298);
  }

  const detail = card.detail || "none";
  const loadedImg = card.image ? imageCache.get(card.image) : undefined;
  const hasPhoto = Boolean(loadedImg && loadedImg.complete && loadedImg.naturalWidth > 0);

  // Subtle detail graphic under product / numeral
  if (detail === "ring") {
    const cx0 = 128;
    const cy0 = hasPhoto ? 148 : 156;
    for (let i = 0; i < 132; i++) {
      const a = (i / 132) * Math.PI * 2 - Math.PI / 2;
      const seedLen = 0.5 + 0.5 * Math.sin(i * 12.9898) * Math.sin(i * 4.1414 + 1.3);
      const top = 0.5 + 0.5 * Math.cos(a + Math.PI / 2);
      const len = 4 + 4.5 * Math.abs(seedLen) + 2 * top;
      const fade = 0.22 + 0.5 * top * top;
      ctx.strokeStyle = rgba(accent, fade);
      ctx.lineWidth = 1.0 + 0.7 * top;
      const r1 = hasPhoto ? 76 : 68;
      ctx.beginPath();
      ctx.moveTo(cx0 + Math.cos(a) * r1, cy0 + Math.sin(a) * r1);
      ctx.lineTo(cx0 + Math.cos(a) * (r1 + len), cy0 + Math.sin(a) * (r1 + len));
      ctx.stroke();
    }
  } else if (detail === "slider") {
    const xa = 20;
    const xb = 236;
    const y = hasPhoto ? 242 : 197.5;
    const kx = xa + (xb - xa) * 0.72;
    const lg = ctx.createLinearGradient(xa, 0, xb, 0);
    lg.addColorStop(0, rgba(accent, 0.18));
    lg.addColorStop(0.72, rgba(accent, 0.9));
    lg.addColorStop(1, rgba(accent, 0.35));
    ctx.fillStyle = lg;
    ctx.fillRect(xa, y - 0.6, xb - xa, 1.2);
    ctx.save();
    ctx.shadowColor = rgba(accent, 0.95);
    ctx.shadowBlur = 9 * k;
    ctx.fillStyle = rgba(white, 1);
    ctx.beginPath();
    ctx.arc(kx, y, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (detail === "wave") {
    const wy = hasPhoto ? 242 : 204;
    for (let i = 0; i < 56; i++) {
      const x = 43 + i * 3;
      const r1 = Math.abs(Math.sin(i * 1.7 + 0.4) * Math.cos(i * 0.53));
      const hh = 1.5 + 5.5 * r1;
      const mark = i === 23;
      ctx.fillStyle = mark ? rgba(accent, 0.95) : rgba(white, 0.3);
      ctx.fillRect(x, wy - (mark ? 7 : hh), mark ? 1.4 : 0.9, mark ? 14 : hh * 2);
    }
  } else if (detail === "cross") {
    ctx.fillStyle = rgba(white, 0.22);
    ctx.fillRect(128, 64, 0.7, 168);
    ctx.fillRect(18, 148, 220, 0.7);
  }

  // Real product photograph showcase when available
  if (hasPhoto && loadedImg) {
    const boxX = 24;
    const boxY = 58;
    const boxW = 208;
    const boxH = 166;

    // Frosted showcase frame inside the B-spline card
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.strokeStyle = rgba(accent, 0.55);
    ctx.lineWidth = 1.2;
    ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
    ctx.shadowBlur = 18 * k;
    ctx.shadowOffsetY = 6 * k;
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(boxX, boxY, boxW, boxH, 14);
    } else {
      ctx.rect(boxX, boxY, boxW, boxH);
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Draw crisp product photograph with aspect ratio preserved
    const pad = 12;
    const maxW = boxW - pad * 2;
    const maxH = boxH - pad * 2;
    const scale = Math.min(maxW / loadedImg.naturalWidth, maxH / loadedImg.naturalHeight);
    const dw = loadedImg.naturalWidth * scale;
    const dh = loadedImg.naturalHeight * scale;
    const dx = boxX + (boxW - dw) / 2;
    const dy = boxY + (boxH - dh) / 2;
    ctx.drawImage(loadedImg, dx, dy, dw, dh);

    // Price / value numeral at bottom-left above footer
    const priceCap = sizeForCap(ctx, 300, family, 20);
    const unitPx = priceCap * 0.42;
    const n0 = parseColor((card.numeral && card.numeral[0]) || "#ffffff");
    const n1 = parseColor((card.numeral && card.numeral[1]) || "#8cf6ff");
    const valueStr = card.unit === "RMB" ? `¥${card.value}` : card.value;
    ctx.save();
    ctx.font = fontStr(600, priceCap, family);
    const vw = ctx.measureText(valueStr).width;
    const grad = ctx.createLinearGradient(17, 0, 17 + vw, 0);
    grad.addColorStop(0, rgba(n0, 1));
    grad.addColorStop(1, rgba(n1, 1));
    ctx.fillStyle = grad;
    ctx.fillText(valueStr, 17, 276);
    if (card.unit && card.unit !== "RMB") {
      ctx.font = fontStr(400, unitPx, family);
      ctx.fillStyle = rgba(n1, 0.9);
      ctx.fillText(card.unit, 17 + vw + 4, 270);
    }
    ctx.restore();
    return;
  }

  // Standard Louis Studios Big Numeral when no photo is loaded yet
  const big = sizeForCap(ctx, 300, family, 44);
  const unitPx = big * 0.31;
  ctx.font = fontStr(300, big, family);
  const value = card.value || "";
  const vw = ctx.measureText(value).width;
  ctx.font = fontStr(300, unitPx, family);
  const uw = card.unit ? ctx.measureText(card.unit).width + 4 : 0;
  const centre = detail === "wave" ? 112 : detail === "cross" ? 106 : 127;
  const x0 = centre - (vw + uw) / 2 + (detail === "cross" ? uw / 2 : 0);
  const n0 = parseColor((card.numeral && card.numeral[0]) || "#ffffff");
  const n1 = parseColor((card.numeral && card.numeral[1]) || "#ffffff");
  const grad = ctx.createLinearGradient(x0, 0, x0 + vw, 0);
  grad.addColorStop(0, rgba(n0, 1));
  grad.addColorStop(1, rgba(n1, 1));

  ctx.save();
  ctx.shadowColor = rgba(n1, 0.35);
  ctx.shadowBlur = 10 * k;
  ctx.font = fontStr(300, big, family);
  ctx.fillStyle = grad;
  ctx.fillText(value, x0, 186);
  if (card.unit) {
    ctx.font = fontStr(300, unitPx, family);
    ctx.fillStyle = rgba(n1, 1);
    ctx.fillText(card.unit, x0 + vw + 4, 186 - 44 + unitPx * 0.72);
  }
  ctx.restore();
}

function glowShape(pose: Pose): [number, number, number] {
  const [px, pz, ps] = pose;
  const c = Math.cos(ps);
  const sn = Math.sin(ps);
  if (c <= 0.02) return [0, 1, 0];
  const A = px;
  const B = FOCAL + pz;
  const tNear = B - 0.5 * CW * Math.abs(sn);
  let m = 0;
  let mx = 0;
  let mxx = 0;
  for (let u = -360; u <= 360; u += 3) {
    const h = Math.exp(-((Math.abs(u - 9) / 138) ** 4));
    if (h < 0.003) continue;
    const k = u / 1.8 / FOCAL;
    const den = sn * k - c;
    if (Math.abs(den) < 1e-4) continue;
    const s = (A - B * k) / den;
    const t = B + s * sn;
    if (t < 4) continue;
    if ((u / 1.8 / FOCAL) * t * sn - t * c >= 0) continue;
    const dsdk = (B * c - A * sn) / (den * den);
    const soft = Math.min(Math.abs(dsdk / FOCAL) * 2.2, 40) + 0.5;
    const cov = Math.max(0, Math.min(1, (CW * 0.5 - Math.abs(s)) / soft + 0.5));
    if (cov <= 0) continue;
    const near = Math.min(1, FOCAL / t);
    const rel = Math.exp(-((Math.max(t - tNear, 0) / 36) ** 1.5));
    const w = cov * near * near * rel * c * h;
    m += w;
    mx += w * u;
    mxx += w * u * u;
  }
  if (m < 0.5) return [0, 1, 0];
  const mu = mx / m;
  const sd = Math.sqrt(Math.max(1, mxx / m - mu * mu));
  const r = Math.max(6, sd / 0.581);
  return [mu, r, (m * 3) / (1.813 * r)];
}

/* ------------------------------------------------------------------ */
/* WebGL2 Ray-Casted Lens Warp Shader Engine                          */
/* ------------------------------------------------------------------ */

const VERT = `#version 300 es
in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
precision highp sampler2DArray;
uniform sampler2DArray uTex;
uniform vec2 uRes;
uniform float uUnit;
uniform vec4 uPose[8];
uniform vec3 uGlowCol[8];
uniform vec3 uGlowShape[8];
uniform vec3 uBg;
uniform float uBgAlpha;
uniform float uWarp;
uniform float uMix;
out vec4 outColor;

const float F = ${FOCAL.toFixed(2)};
const float CW = ${CW.toFixed(1)};
const float CH = ${CH.toFixed(1)};
const float CR = ${CR.toFixed(1)};

float lensH(float a){
  if (a <= 232.0) return a;
  float k[9] = float[9](232.0, 238.0, 245.0, 253.0, 262.0, 275.0, 295.0, 325.0, 360.0);
  float d[9] = float[9](1.1759, 1.0671, 1.0156, 1.0965, 0.6487, 0.2700, -0.1991, -0.4782, -0.0318);
  float s = 232.0;
  for (int i = 0; i < 8; i++){
    if (a <= k[i]) break;
    float x = min(a, k[i+1]);
    float t = (x - k[i]) / (k[i+1] - k[i]);
    s += (x - k[i]) * mix(1.0, mix(d[i], d[i+1], t * 0.5), uWarp);
  }
  if (a > 360.0) s += (a - 360.0) * mix(1.0, d[8], uWarp);
  return s;
}

float lensS(float a){
  float t = clamp((a - 262.0) / 93.0, 0.0, 2.0);
  return 1.0 + uWarp * (0.42 * pow(t, 1.5) + 0.045 * smoothstep(320.0, 360.0, a));
}

float sdRound(vec2 p, vec2 b, float r){
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

vec4 shadeCard(vec4 pose, vec2 ps, float fx, float fy, out float depth){
  depth = 1e9;
  if (pose.w < 0.0) return vec4(0.0);
  float k = ps.x / F;
  float c = cos(pose.z), sn = sin(pose.z);
  float den = sn * k - c;
  if (abs(den) < 1e-5) return vec4(0.0);
  float A = pose.x, B = F + pose.y;
  float s = (A - B * k) / den;
  float t = B + s * sn;
  if (t < 4.0) return vec4(0.0);
  float y = t * ps.y / F;
  float dsdk = (B * c - A * sn) / (den * den);
  float fs = min(abs(dsdk / F) * fx, 48.0);
  float fyc = min(t / F * fy, 48.0);
  vec2 p = vec2(s, y);
  float d = sdRound(p, vec2(CW, CH) * 0.5, CR);
  vec2 q = abs(p) - vec2(CW, CH) * 0.5 + CR;
  vec2 n = q.x > q.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  if (q.x > 0.0 && q.y > 0.0) n = normalize(q);
  float fp = length(vec2(fs * n.x, fyc * n.y)) + 1e-4;
  if (d > fp) return vec4(0.0);
  float cov = clamp(0.5 - d / fp, 0.0, 1.0);
  if (cov <= 0.0) return vec4(0.0);
  vec2 uv = vec2(s / CW + 0.5, 0.5 - y / CH);
  vec4 tex = textureGrad(uTex, vec3(uv, pose.w), vec2(fs / CW, 0.0), vec2(0.0, fyc / CH));
  depth = t;
  return vec4(tex.rgb, 1.0) * cov;
}

vec4 scene(vec2 ps, float fx, float fy, int base){
  vec4 col[4];
  float dep[4];
  for (int i = 0; i < 4; i++) col[i] = shadeCard(uPose[base + i], ps, fx, fy, dep[i]);
  for (int i = 0; i < 3; i++)
    for (int j = 0; j < 3; j++)
      if (j < 3 - i && dep[j] > dep[j+1]) {
        float td = dep[j]; dep[j] = dep[j+1]; dep[j+1] = td;
        vec4 tc = col[j]; col[j] = col[j+1]; col[j+1] = tc;
      }
  vec4 acc = vec4(0.0);
  for (int i = 0; i < 4; i++) acc += (1.0 - acc.a) * col[i];
  return acc;
}

vec4 glowAt(vec2 pu, float halfH, int base){
  vec4 sum = vec4(0.0);
  float gH = min(halfH, 288.0);
  float dy = min(abs((gH - 11.0) - pu.y), abs(pu.y + (gH - 12.0)));
  if (dy > 40.0) return sum;
  for (int i = 0; i < 4; i++){
    vec3 sh = uGlowShape[base + i];
    if (sh.z <= 0.0) continue;
    float E = exp(-pow(abs(pu.x - sh.x) / sh.y, 4.0));
    if (E < 0.002) continue;
    float v = exp(-pow(dy / (18.5 * (0.45 + 0.55 * sqrt(E))), 3.0));
    float w = sh.z * E * v;
    sum += vec4(uGlowCol[base + i] * w, w);
  }
  return sum;
}

vec4 stageRgba(vec2 pu, float halfH, int base){
  vec4 g = glowAt(pu, halfH, base);
  if (uBgAlpha > 0.5) {
    if (g.a <= 0.0) return vec4(uBg, 1.0);
    float I = clamp(g.a, 0.0, 1.0);
    vec3 drop = uBg - g.rgb / g.a;
    return vec4(uBg - drop * pow(vec3(I), vec3(0.8, 1.6, 1.0)), 1.0);
  }
  if (g.a <= 0.0) return vec4(0.0);
  float a = clamp(g.a * 0.85, 0.0, 0.9);
  vec3 c = (g.rgb / max(g.a, 1e-4)) * a;
  return vec4(c, a);
}

vec4 render(vec2 pu, float halfH, int base){
  float au = min(abs(pu.x), 360.0);
  float px = 1.0 / uUnit;
  vec4 bg = stageRgba(pu, halfH, base);
  if (au < 236.0 || uWarp <= 0.0) {
    vec4 c = scene(pu, px, px, base);
    return vec4(c.rgb + (1.0 - c.a) * bg.rgb, c.a + (1.0 - c.a) * bg.a);
  }
  float e = 0.064 * uWarp * smoothstep(275.0, 360.0, au);
  float S0 = lensS(au);
  float sg = pu.x < 0.0 ? -1.0 : 1.0;
  float blur = 1.0 + 30.0 * pow(smoothstep(240.0, 340.0, au), 1.5) * uWarp;
  float fyb = 1.0 + 15.0 * smoothstep(280.0, 352.0, au) * uWarp;
  float gain = 1.0 + 0.17 * smoothstep(285.0, 350.0, au) * uWarp;
  vec3 acc;
  vec3 aCh;
  for (int ch = 0; ch < 3; ch++){
    float off = uWarp * (ch == 0 ? -20.92 : (ch == 1 ? 0.0 : 11.91));
    float h = lensH(au) + off * smoothstep(289.8, 344.9, au);
    float h0 = lensH(au - 0.5) + off * smoothstep(289.8, 344.9, au - 0.5);
    float h1 = lensH(au + 0.5) + off * smoothstep(289.8, 344.9, au + 0.5);
    float fx = px * max(abs(h1 - h0), 0.02) * blur;
    float S = S0 * (ch == 0 ? 1.0 + e : (ch == 1 ? 1.0 : 1.0 - e));
    vec4 c = scene(vec2(sg * h, pu.y / S), fx, px / S * fyb, base);
    c.rgb = min(c.rgb * gain, vec3(c.a));
    acc[ch] = (c.rgb + (1.0 - c.a) * bg.rgb)[ch];
    aCh[ch] = c.a + (1.0 - c.a) * bg.a;
  }
  float outA = clamp(max(max(aCh.r, aCh.g), aCh.b), 0.0, 1.0);
  return vec4(acc, outA);
}

void main(){
  vec2 fc = gl_FragCoord.xy;
  vec2 pu = (fc - 0.5 * uRes) / uUnit;
  float halfH = 0.5 * uRes.y / uUnit;
  vec4 col = render(pu, halfH, 0);
  if (uMix > 0.0) col = mix(col, render(pu, halfH, 4), uMix);
  outColor = col;
}`;

interface GLState {
  gl: WebGL2RenderingContext;
  prog: WebGLProgram;
  tex: WebGLTexture;
  loc: Record<string, WebGLUniformLocation | null>;
  layers: number;
  texW: number;
}

function createGL(canvas: HTMLCanvasElement): GLState | null {
  if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) {
    return null;
  }
  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    });
  } catch {
    return null;
  }
  if (!gl) return null;
  const sh = (type: number, src: string) => {
    const s = gl!.createShader(type)!;
    gl!.shaderSource(s, src);
    gl!.compileShader(s);
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
      console.warn(gl!.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const vs = sh(gl.VERTEX_SHADER, VERT);
  const fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, "aPos");
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(prog));
    return null;
  }
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture()!;
  const loc: Record<string, WebGLUniformLocation | null> = {};
  for (const n of [
    "uTex",
    "uRes",
    "uUnit",
    "uPose",
    "uGlowCol",
    "uGlowShape",
    "uBg",
    "uBgAlpha",
    "uWarp",
    "uMix",
  ]) {
    loc[n] = gl.getUniformLocation(prog, n);
  }
  const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
  (tex as unknown as { aniso: unknown }).aniso = aniso;
  return { gl, prog, tex, loc, layers: 0, texW: 0 };
}

function uploadCards(st: GLState, canvases: HTMLCanvasElement[]) {
  if (!canvases.length) return;
  const { gl, tex } = st;
  const w = canvases[0]!.width;
  const h = canvases[0]!.height;
  gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
  gl.texImage3D(
    gl.TEXTURE_2D_ARRAY,
    0,
    gl.RGBA8,
    w,
    h,
    canvases.length,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );
  canvases.forEach((cv, i) => {
    gl.texSubImage3D(
      gl.TEXTURE_2D_ARRAY,
      0,
      0,
      0,
      i,
      w,
      h,
      1,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      cv
    );
  });
  gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const an = (tex as unknown as { aniso: { TEXTURE_MAX_ANISOTROPY_EXT: number } | null }).aniso;
  if (an) gl.texParameterf(gl.TEXTURE_2D_ARRAY, an.TEXTURE_MAX_ANISOTROPY_EXT, 8);
  st.layers = canvases.length;
  st.texW = w;
}

/* ------------------------------------------------------------------ */
/* Canvas 2D fallback: 32-strip affine approximation                  */
/* ------------------------------------------------------------------ */

function drawFallback(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  unit: number,
  poses: { pose: Pose; layer: number }[],
  canvases: HTMLCanvasElement[],
  bg: string,
  transparentBg: boolean,
  glows: [number, number, number][]
) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  if (!transparentBg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }
  const gH = Math.min(h / 2 / unit, 288);
  for (const p of poses) {
    if (p.layer < 0) continue;
    const [mu, r, amp] = glowShape(p.pose);
    const a = Math.min(1, amp) * 0.9;
    if (a < 0.01) continue;
    const rx = r * 1.35 * unit;
    const col = glows[p.layer] || [127, 208, 240];
    const rgb = `${col[0]}, ${col[1]}, ${col[2]}`;
    for (const yy of [h / 2 - (gH - 11) * unit, h / 2 + (gH - 12) * unit]) {
      ctx.save();
      ctx.translate(w / 2 + mu * unit, yy);
      ctx.scale(1, (20 * unit) / rx);
      const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      rg.addColorStop(0, `rgba(${rgb}, ${a})`);
      rg.addColorStop(0.55, `rgba(${rgb}, ${a * 0.55})`);
      rg.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.fillStyle = rg;
      ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
      ctx.restore();
    }
  }
  const proj = (X: number, Zb: number, Y: number): [number, number] => {
    const D = FOCAL + Zb;
    return [w / 2 + ((X * FOCAL) / D) * unit, h / 2 - ((Y * FOCAL) / D) * unit];
  };
  const items = poses
    .filter((p) => p.layer >= 0)
    .map((p) => ({ ...p, depth: p.pose[1] }))
    .sort((a, b) => b.depth - a.depth);
  const strips = 32;
  const eps = 1.5 / Math.max(unit, 0.25);
  const half = CW / 2;
  const edgeY = (sv: number) => {
    const dx = Math.abs(sv) - (half - CR);
    if (dx <= 0) return CH / 2;
    return CH / 2 - CR + Math.sqrt(Math.max(0, CR * CR - Math.min(dx, CR) ** 2));
  };
  for (const it of items) {
    const [cx, zb, psi] = it.pose;
    const cv = canvases[it.layer];
    if (!cv) continue;
    const tpu = cv.width / CW;
    const cs = Math.cos(psi);
    const sn = Math.sin(psi);
    const at = (sv: number, y: number) => proj(cx + sv * cs, zb + sv * sn, y);
    for (let i = 0; i < strips; i++) {
      const s0 = -half + (CW * i) / strips - (i > 0 ? eps : 0);
      const s1 = -half + (CW * (i + 1)) / strips + (i < strips - 1 ? eps : 0);
      if (FOCAL + zb + s0 * sn < 10 || FOCAL + zb + s1 * sn < 10) continue;
      const n = Math.abs(s0) > half - CR - 1 || Math.abs(s1) > half - CR - 1 ? 6 : 1;
      ctx.save();
      ctx.beginPath();
      for (let k = 0; k <= n; k++) {
        const sv = Math.max(-half, Math.min(half, s0 + ((s1 - s0) * k) / n));
        const pt = at(sv, edgeY(sv));
        if (k === 0) ctx.moveTo(pt[0], pt[1]);
        else ctx.lineTo(pt[0], pt[1]);
      }
      for (let k = n; k >= 0; k--) {
        const sv = Math.max(-half, Math.min(half, s0 + ((s1 - s0) * k) / n));
        const pt = at(sv, -edgeY(sv));
        ctx.lineTo(pt[0], pt[1]);
      }
      ctx.closePath();
      ctx.clip();
      const sm = (s0 + s1) / 2;
      const tl = at(s0, CH / 2);
      const tr = at(s1, CH / 2);
      const mt = at(sm, CH / 2);
      const mb = at(sm, -CH / 2);
      const sx0 = (s0 + half) * tpu;
      const sw = (s1 - s0) * tpu;
      const ov = 1.025;
      const a = (tr[0] - tl[0]) / sw;
      const b = (tr[1] - tl[1]) / sw;
      const c = ((mb[0] - mt[0]) / cv.height) * ov;
      const d = ((mb[1] - mt[1]) / cv.height) * ov;
      const smx = (sm + half) * tpu;
      const ox = (mt[0] + mb[0]) / 2 - a * smx - c * (cv.height / 2);
      const oy = (mt[1] + mb[1]) / 2 - b * smx - d * (cv.height / 2);
      ctx.setTransform(a, b, c, d, ox, oy);
      const x0 = Math.max(0, sx0 - 1);
      const x1 = Math.min(cv.width, sx0 + sw + 1);
      ctx.drawImage(cv, x0, 0, x1 - x0, cv.height, x0, 0, x1 - x0, cv.height);
      ctx.restore();
    }
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

interface Live {
  P: number;
  from: number;
  to: number;
  t0: number;
  n: number;
  v: number;
  mode: "rest" | "spin" | "drag" | "spring" | "fade";
  nextAuto: number;
  autoPending: boolean;
  fadeFrom: number;
  fadeT0: number;
  dragX: number;
  dragP: number;
  downX: number;
  moved: boolean;
  lastT: number;
  visible: boolean;
  hiddenAt: number;
}

export function WarpCarousel({
  items,
  activeIndex,
  onActiveIndexChange,
  onInspectItem,
  cards,
  index,
  defaultIndex = 0,
  onIndexChange,
  autoplay = false,
  interval = 3.6667,
  step = 1,
  background = "transparent",
  glow,
  warp = 1,
  font = DEFAULT_FONT,
  seconds,
  ariaLabel = "Flagship digital hardware warp carousel",
  className,
  style,
}: WarpCarouselProps): React.JSX.Element {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  const resolvedCards = React.useMemo(() => {
    if (cards && cards.length) return cards;
    if (items && items.length) return mapItemsToWarpCards(items);
    return WARP_CAROUSEL_CARDS;
  }, [cards, items]);

  const list = React.useMemo(() => {
    const out: WarpCard[] = [];
    while (out.length < 4) out.push(...resolvedCards);
    return out;
  }, [resolvedCards]);

  const realCount = resolvedCards.length;
  const N = list.length;
  const stepN = Math.max(1, Math.round(step));
  const gap = Math.max(0.5, interval);

  const effectiveIndexProp = index !== undefined ? index : activeIndex;
  const controlled = effectiveIndexProp !== undefined;
  const [inner, setInner] = React.useState(defaultIndex);
  const current = controlled ? (effectiveIndexProp as number) : inner;
  const startIdx = React.useRef(current).current;

  const notifyIndexChange = React.useCallback(
    (nextIdx: number) => {
      const wrapped = mod(nextIdx, realCount);
      onIndexChange?.(wrapped);
      onActiveIndexChange?.(wrapped);
    },
    [onIndexChange, onActiveIndexChange, realCount]
  );

  const live = React.useRef<Live>({
    P: current,
    from: current,
    to: current,
    t0: 0,
    n: STEP_FRAMES,
    v: 0,
    mode: "rest",
    nextAuto: Infinity,
    autoPending: false,
    fadeFrom: current,
    fadeT0: 0,
    dragX: 0,
    dragP: 0,
    downX: 0,
    moved: false,
    lastT: 0,
    visible: true,
    hiddenAt: 0,
  });

  const props = React.useRef({
    notifyIndexChange,
    controlled,
    autoplay,
    gap,
    stepN,
    seconds,
    reduced,
    realCount,
  });
  props.current = {
    notifyIndexChange,
    controlled,
    autoplay,
    gap,
    stepN,
    seconds,
    reduced,
    realCount,
  };
  const handles = React.useRef<{ kick: () => void; draw: () => void }>({
    kick: () => {},
    draw: () => {},
  });

  const lastIndex = React.useRef(current);
  const request = React.useCallback((next: number) => {
    const p = props.current;
    p.notifyIndexChange(next);
    if (!p.controlled) setInner(next);
  }, []);

  React.useEffect(() => {
    const L = live.current;
    const prev = lastIndex.current;
    lastIndex.current = current;
    if (prev === current) return;
    let delta = current - prev;
    if (props.current.controlled && Math.abs(delta) > realCount / 2) {
      delta -= Math.sign(delta) * realCount;
    }
    const now = performance.now() / 1000;
    const fromAuto = L.autoPending;
    L.autoPending = false;
    if (props.current.reduced) {
      L.fadeFrom = L.P;
      L.P = Math.round(L.P) + delta;
      L.mode = "fade";
      L.fadeT0 = now;
    } else if (L.mode !== "spring") {
      const base = Math.round(L.P - DRIFT) + delta;
      L.from = L.P;
      L.to = base + DRIFT;
      L.t0 = now;
      L.n = fromAuto ? props.current.gap * 30 : STEP_FRAMES;
      L.mode = "spin";
    }
    if (!fromAuto) L.nextAuto = now + props.current.gap;
    handles.current.kick();
  }, [current, realCount]);

  React.useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const isJsdom =
      typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent);
    let gls: GLState | null = createGL(canvas);
    let ctx2d: CanvasRenderingContext2D | null = null;
    if (!gls && !isJsdom) {
      try {
        ctx2d = canvas.getContext("2d");
      } catch {
        ctx2d = null;
      }
    }
    let cardCanvases: HTMLCanvasElement[] = [];
    let texW = 0;
    let raf = 0;
    let disposed = false;
    const transparentBg = !background || background === "transparent";
    const bg = parseColor(background, [6, 8, 14]);
    const glowOverride = glow ? parseColor(glow) : null;
    const glowCols = list.map((c) =>
      glowOverride ? glowOverride : parseColor(c.glow || "#7fd0f0")
    );

    const paintAll = (w: number) => {
      if (isJsdom) return;
      cardCanvases = list.map((card) => {
        const cv = document.createElement("canvas");
        cv.width = w;
        cv.height = Math.round((w * CH) / CW);
        paintCard(cv, card, font);
        return cv;
      });
      texW = w;
      if (gls) uploadCards(gls, cardCanvases);
    };

    let W = 0;
    let H = 0;
    let unit = 1;
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min((typeof window !== "undefined" && window.devicePixelRatio) || 1, 2);
      W = Math.max(2, Math.round((r.width || 720) * dpr));
      H = Math.max(2, Math.round((r.height || 440) * dpr));
      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;
      unit = Math.min(W / 720, H / 440);
      const want = Math.min(1024, Math.max(256, Math.round(CW * unit * 1.25)));
      if (want !== texW) paintAll(want);
    };

    const poseSet = (P: number) => {
      const ids = Array.from({ length: N }, (_, c) => ({
        c,
        q: mod(c - P + N / 2, N) - N / 2,
      }))
        .sort((a, b) => Math.abs(a.q) - Math.abs(b.q))
        .slice(0, 4);
      return ids.map(({ c, q }) =>
        Math.abs(q) > 2.05
          ? { pose: [0, 0, 0] as Pose, layer: -1 }
          : { pose: poseAt(q), layer: c }
      );
    };

    const L = live.current;
    const progressAt = (now: number) => {
      const p = props.current;
      if (p.seconds !== undefined) {
        if (p.reduced) {
          const k = p.seconds < LEAD ? 0 : Math.floor((p.seconds - LEAD) / p.gap) + 1;
          return { P: startIdx + k * p.stepN, Pb: 0, mix: 0 };
        }
        return { P: autoplayProgress(p.seconds, startIdx, p.stepN, p.gap), Pb: 0, mix: 0 };
      }
      if (L.mode === "spin") {
        const f = (now - L.t0) * 30;
        L.P = L.from + (L.to - L.from) * spinN(f, L.n);
        if (f >= L.n) L.mode = "rest";
      } else if (L.mode === "spring") {
        const dt = Math.min(0.034, Math.max(0, now - L.lastT));
        L.lastT = now;
        const sub = 4;
        for (let i = 0; i < sub; i++) {
          const acc = -60 * (L.P - L.to) - 13 * L.v;
          L.v += (acc * dt) / sub;
          L.P += (L.v * dt) / sub;
        }
        if (Math.abs(L.P - L.to) < 4e-4 && Math.abs(L.v) < 3e-3) {
          L.P = L.to;
          L.v = 0;
          L.mode = "rest";
        }
      } else if (L.mode === "fade") {
        const m = Math.min(1, (now - L.fadeT0) / 0.45);
        if (m >= 1) L.mode = "rest";
        return { P: L.P, Pb: L.fadeFrom, mix: 1 - m * m * (3 - 2 * m) };
      }
      return { P: L.P, Pb: 0, mix: 0 };
    };

    const poseArr = new Float32Array(32);
    const glowArr = new Float32Array(24);
    const shapeArr = new Float32Array(24);
    const fill = (set: { pose: Pose; layer: number }[], off: number) => {
      set.forEach((s, i) => {
        const j = off + i;
        poseArr[j * 4] = s.pose[0];
        poseArr[j * 4 + 1] = s.pose[1];
        poseArr[j * 4 + 2] = s.pose[2];
        poseArr[j * 4 + 3] = s.layer;
        const gc = s.layer >= 0 ? glowCols[s.layer]! : [255, 255, 255];
        glowArr[j * 3] = gc[0] / 255;
        glowArr[j * 3 + 1] = gc[1] / 255;
        glowArr[j * 3 + 2] = gc[2] / 255;
        const gs = s.layer >= 0 ? glowShape(s.pose) : [0, 1, 0];
        shapeArr[j * 3] = gs[0];
        shapeArr[j * 3 + 1] = gs[1];
        shapeArr[j * 3 + 2] = gs[2];
      });
    };

    const draw = (now: number) => {
      if (disposed || isJsdom) return;
      const { P, Pb, mix } = progressAt(now);
      const setA = poseSet(P);
      if (gls) {
        const { gl, prog, loc } = gls;
        gl.viewport(0, 0, W, H);
        gl.useProgram(prog);
        fill(setA, 0);
        if (mix > 0) fill(poseSet(Pb), 4);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, gls.tex);
        gl.uniform1i(loc.uTex, 0);
        gl.uniform2f(loc.uRes, W, H);
        gl.uniform1f(loc.uUnit, unit);
        gl.uniform4fv(loc.uPose, poseArr);
        gl.uniform3fv(loc.uGlowCol, glowArr);
        gl.uniform3fv(loc.uGlowShape, shapeArr);
        gl.uniform3f(loc.uBg, bg[0] / 255, bg[1] / 255, bg[2] / 255);
        gl.uniform1f(loc.uBgAlpha, transparentBg ? 0.0 : 1.0);
        gl.uniform1f(loc.uWarp, Math.max(0, Math.min(1, warp)));
        gl.uniform1f(loc.uMix, mix);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      } else if (ctx2d) {
        const css = `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`;
        drawFallback(ctx2d, W, H, unit, setA, cardCanvases, css, transparentBg, glowCols);
        if (mix > 0) {
          ctx2d.globalAlpha = mix;
          drawFallback(
            ctx2d,
            W,
            H,
            unit,
            poseSet(Pb),
            cardCanvases,
            css,
            transparentBg,
            glowCols
          );
          ctx2d.globalAlpha = 1;
        }
      }
    };

    const loop = () => {
      raf = 0;
      if (disposed || !L.visible) return;
      const now = performance.now() / 1000;
      const p = props.current;
      if (
        p.seconds === undefined &&
        p.autoplay &&
        L.mode !== "drag" &&
        L.mode !== "spring" &&
        now >= L.nextAuto
      ) {
        L.nextAuto = Math.max(L.nextAuto + p.gap, now + p.gap * 0.5);
        L.autoPending = true;
        request(lastIndex.current + p.stepN);
      }
      draw(now);
      const busy = p.seconds === undefined && (L.mode !== "rest" || p.autoplay);
      if (busy) raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf && !disposed && L.visible) raf = requestAnimationFrame(loop);
    };

    handles.current = { kick, draw: () => draw(performance.now() / 1000) };

    const repaint = () => {
      if (disposed) return;
      texW = 0;
      resize();
      draw(performance.now() / 1000);
    };

    // Preload real product images and repaint card textures into WebGL2 TEXTURE_2D_ARRAY as soon as ready
    if (!isJsdom && typeof Image !== "undefined") {
      list.forEach((card) => {
        if (!card.image) return;
        const cached = imageCache.get(card.image);
        if (cached && cached.complete && cached.naturalWidth > 0) return;
        if (!cached) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          imageCache.set(card.image, img);
          img.onload = () => repaint();
          img.src = card.image;
        }
      });
    }

    const t0 = performance.now() / 1000;
    if (props.current.autoplay && !props.current.reduced && props.current.seconds === undefined) {
      L.from = current - props.current.stepN + DRIFT;
      L.to = current + DRIFT;
      L.t0 = t0 - REST_PHASE / 30;
      L.n = STEP_FRAMES;
      L.mode = "spin";
      L.P = L.from + (L.to - L.from) * spin(REST_PHASE);
      L.nextAuto = t0 + LEAD;
    } else {
      L.nextAuto = t0 + props.current.gap;
    }

    resize();
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            resize();
            draw(performance.now() / 1000);
          })
        : null;
    ro?.observe(wrap);

    const setVisible = (vis: boolean) => {
      const now = performance.now() / 1000;
      if (vis === L.visible) return;
      if (!vis) L.hiddenAt = now;
      else {
        const dt = now - L.hiddenAt;
        L.t0 += dt;
        L.fadeT0 += dt;
        L.nextAuto += dt;
        L.lastT = now;
      }
      L.visible = vis;
      if (vis) kick();
    };
    let inView = true;
    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((ents) => {
            inView = ents.some((e) => e.isIntersecting);
            setVisible(inView && document.visibilityState === "visible");
          })
        : null;
    io?.observe(wrap);
    const onVis = () => setVisible(inView && document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);

    let lost = false;
    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true;
    };
    const onRestored = () => {
      if (!lost) return;
      lost = false;
      gls = createGL(canvas);
      texW = 0;
      resize();
      kick();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    const fonts = (document as unknown as { fonts?: FontFaceSet }).fonts;
    fonts?.addEventListener?.("loadingdone", repaint);

    draw(t0);
    kick();
    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      fonts?.removeEventListener?.("loadingdone", repaint);
      if (gls) {
        gls.gl.deleteTexture(gls.tex);
        gls.gl.deleteProgram(gls.prog);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, background, glow, warp, font, N]);

  React.useEffect(() => {
    if (seconds !== undefined) handles.current.draw();
    else handles.current.kick();
  }, [seconds, autoplay, reduced]);

  /* ---------------- Hands-on Drag / Click / Keyboard Interaction ---------------- */
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (seconds !== undefined || e.button > 0) return;
    const L = live.current;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    L.mode = "drag";
    L.dragX = e.clientX;
    L.downX = e.clientX;
    L.dragP = L.P;
    L.v = 0;
    L.moved = false;
    L.lastT = performance.now() / 1000;
    handles.current.kick();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const L = live.current;
    if (L.mode !== "drag") return;
    const r = wrapRef.current!.getBoundingClientRect();
    const unitCss = Math.max(0.25, Math.min((r.width || 720) / 720, (r.height || 440) / 440));
    const now = performance.now() / 1000;
    const P = L.dragP - (e.clientX - L.dragX) / (unitCss * 300);
    const dt = Math.max(1 / 240, now - L.lastT);
    L.v = 0.6 * L.v + 0.4 * ((P - L.P) / dt);
    L.P = P;
    L.lastT = now;
    if (Math.abs(e.clientX - L.downX) > 5) L.moved = true;
    handles.current.draw();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const L = live.current;
    if (L.mode !== "drag") return;
    const now = performance.now() / 1000;
    L.nextAuto = now + gap;
    if (!L.moved) {
      L.mode = "rest";
      const r = wrapRef.current!.getBoundingClientRect();
      const unitCss = Math.max(0.25, Math.min((r.width || 720) / 720, (r.height || 440) / 440));
      const u = (e.clientX - r.left - r.width / 2) / unitCss;
      if (u > 152) {
        request(lastIndex.current + 1);
      } else if (u < -152) {
        request(lastIndex.current - 1);
      } else {
        // Clicked on the focal center card -> open 3D hardware inspection modal
        const activeIdx = mod(lastIndex.current, realCount);
        onInspectItem?.(activeIdx, wrapRef.current?.getBoundingClientRect() ?? null);
      }
      return;
    }
    if (now - L.lastT > 0.08) L.v = 0;
    const target = Math.round(L.P + L.v * 0.16);
    const from = Math.round(L.dragP - DRIFT);
    L.to = target;
    L.mode = "spring";
    L.lastT = now;
    const next = lastIndex.current + (target - from);
    if (next !== lastIndex.current) {
      lastIndex.current = next;
      const p = props.current;
      p.notifyIndexChange(next);
      if (!p.controlled) setInner(next);
    }
    handles.current.kick();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      request(lastIndex.current + (e.key === "ArrowRight" ? 1 : -1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onInspectItem?.(
        mod(lastIndex.current, realCount),
        wrapRef.current?.getBoundingClientRect() ?? null
      );
    }
  };

  const frontIndex = mod(current, realCount);
  const front = list[mod(current, N)];

  return (
    <div
      ref={wrapRef}
      data-slot="warp-carousel"
      className={className}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 380,
        maxHeight: 460,
        aspectRatio: "5 / 4",
        overflow: "hidden",
        background,
        touchAction: "pan-y",
        userSelect: "none",
        cursor: "grab",
        outline: "none",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        data-testid="warp-webgl-canvas"
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />

      {/* 无障碍与快捷点选语义触发器（指针事件穿透给底层 WebGL2 拖拽画布，仅在键盘/无障碍点击时触发） */}
      {items && items.length > 0 && (
        <div className="sr-only">
          {items.map((it, idx) => (
            <button
              key={it.id}
              type="button"
              aria-label={it.name}
              aria-pressed={idx === frontIndex}
              onClick={(ev) => {
                ev.stopPropagation();
                if (idx === frontIndex) {
                  onInspectItem?.(idx, wrapRef.current?.getBoundingClientRect() ?? null);
                } else {
                  request(idx);
                  onInspectItem?.(idx, wrapRef.current?.getBoundingClientRect() ?? null);
                }
              }}
            >
              {it.name}
            </button>
          ))}
        </div>
      )}

      <div
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clipPath: "inset(50%)",
        }}
      >
        {front
          ? `${front.title.replace("\n", " ")}: ${front.value}${front.unit || ""}. ${
              front.footer || ""
            }`
          : ""}
      </div>
    </div>
  );
}

export default WarpCarousel;
