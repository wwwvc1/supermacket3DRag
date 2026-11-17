# KORA × TACTILE ARCHIVE 3D Flagship Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy frontend with a unified Vite + React + TypeScript 4-scene spatial flagship store featuring the 21st.dev 45° chromatic shockwave shader, the tactile physics-driven `product-rail-gallery.tsx` 3D hanger rail and 360° lift-and-spin stage, Kora's iridescent liquid RAG oracle and minimalist studio console, and all 8 official GSAP skills.

**Architecture:** A single persistent Three.js WebGL `<canvas>` (`WebGLStage`) sits beneath a 4-scene React viewport controlled by `GSAP Observer` and `CustomEase` (`01 OPTICAL PORTAL`, `02 TACTILE ARCHIVE`, `03 NEURAL ATELIER`, `04 STUDIO CONSOLE`). Scene 02 mounts `/src/components/ui/product-rail-gallery.tsx` (`ClothingRailHero`) wired to both the 10 curated 21st.dev garments and live Spring Boot `/api/supermarket/scene` products, syncing real-time WebSocket (`/ws/supermarket`) inventory mutations to hanger tags and driving the 3D spotlight below via `gsap.quickTo`.

**Tech Stack:** React 18, TypeScript 5, Vite 5, Tailwind CSS 3 (shadcn `/src/components/ui` convention), Three.js (`^0.170.0`), GSAP (`gsap` + `@gsap/react` with `useGSAP`, `Observer`, `Flip`, `SplitText`, `ScrambleTextPlugin`, `CustomEase`), Lucide React, Vitest + React Testing Library + jsdom.

**Spec:** `docs/superpowers/specs/2026-11-16-kora-tactile-3d-flagship-design.md` (and reference component `docs/superpowers/specs/references/product-rail-gallery.reference.tsx`)

## Global Constraints

- Zero legacy UI: completely remove all Vue files in `frontend-supermarket/src` and never use `bg-slate-900/85 backdrop-blur-2xl` glassmorphism cards or supermarket box shelves.
- Component path requirement: `ClothingRailHero` and `RAIL_DEMO_ITEMS` must live at `frontend-supermarket/src/components/ui/product-rail-gallery.tsx`.
- GSAP registration requirement: register `useGSAP`, `Observer`, `Flip`, `SplitText`, `ScrambleTextPlugin`, and `CustomEase` once at app initialization via `gsap.registerPlugin(...)` from the public `gsap` and `@gsap/react` packages (no `.npmrc` token).
- Palette & typography tokens: background `#000000` (`--color-background: #000000`), foreground `#FFFFFF` (`--color-foreground: #FFFFFF`), Kora lavender `#C8C3F2` (hover `#DDD9FB`), mint `#A8E6CF`, emerald `#00FF66`, shockwave cyan `#00F0FF`, sold-out crimson `#FF2A54`.
- Dev server & proxy: Vite port `5173`, proxying `/api` to `http://localhost:8080` and `/ws` to `ws://localhost:8080`.

## Review Focus

1. **Backend offline or empty shelf list when loading Scene 02**: If `/api/supermarket/scene` fails or returns 0 products, `buildRailCollections` must still return `COLLECTION 01 · ATELIER GARMENTS` (`RAIL_DEMO_ITEMS`) without crashing or rendering an empty rail.
2. **WebSocket `INVENTORY_CHANGED` event with `stock: 0` or `isOutOfStock: true`**: `applyInventoryEventToCollections` must update matching items' `stock` to `0`, `outOfStock` to `true`, and `tag` to `"SOLD OUT"` while leaving non-matching items untouched.
3. **Wheel / touch scrolling inside scrollable panels or open modals**: `shouldIgnoreSceneWheel` must return `true` when the 3D `Detail` modal or `BagDrawer` is open, or when the event target is inside a `[data-scrollable="true"]` container or `<input>`/`<textarea>`, preventing `GSAP Observer` from accidentally switching scenes.
4. **Non-positive or out-of-range price/stock values on backend products**: `productToRailGarment` must clamp negative stock to `0`, mark `stock <= 0` or `status === 'OFF_SHELF'` as `outOfStock: true` with `tag: "SOLD OUT"`, and format positive prices as `¥<integer or 2-decimal>`.
5. **Headless / non-WebGL browser environment (e.g. jsdom tests or GPU-disabled client)**: `WebGLStage` must catch WebGL context creation failure gracefully and render a fallback obsidian backdrop without throwing an unhandled exception.

---

### Task 1: React + TypeScript + GSAP Scaffolding & Domain Rail Adapter

**Files:**
- Modify: `frontend-supermarket/package.json`
- Modify: `frontend-supermarket/vite.config.ts`
- Modify: `frontend-supermarket/tsconfig.json`
- Modify: `frontend-supermarket/tailwind.config.js`
- Modify: `frontend-supermarket/index.html`
- Create: `frontend-supermarket/src/index.css`
- Create: `frontend-supermarket/src/lib/gsap.ts`
- Create: `frontend-supermarket/src/types/domain.ts`
- Create: `frontend-supermarket/src/lib/rail-adapter.ts`
- Create: `frontend-supermarket/src/api/client.ts`
- Test: `frontend-supermarket/src/lib/__tests__/rail-adapter.test.ts`

**Interfaces:**
- Consumes: `docs/superpowers/specs/references/product-rail-gallery.reference.tsx` (`GarmentKind`, `RailGarment` shape)
- Produces:
  - `frontend-supermarket/src/types/domain.ts`:
    - `export type GarmentKind = "tee" | "knit" | "hoodie" | "shirt" | "jacket" | "coat"`
    - `export interface RailGarmentItem { id: string; name: string; description?: string; kind?: GarmentKind; color?: string; trim?: string; image?: string; backImage?: string; sideImage?: string; tag?: string; details?: string[]; productId?: number; price?: number; stock?: number; outOfStock?: boolean; shelfCode?: string; zone?: string }`
    - `export interface RailCollection { id: string; code: string; title: string; subtitle: string; accentColor: string; items: RailGarmentItem[] }`
    - Backend DTOs: `Product`, `SceneShelf`, `SupermarketScene`, `InventoryEvent`, `CartItem`, `OrderVO`, `ChatResponse`, `SourceCitation`, `KnowledgeDocument`
  - `frontend-supermarket/src/lib/rail-adapter.ts`:
    - `export function productToRailGarment(product: Product, index: number, shelf?: Pick<SceneShelf, "shelfCode" | "zone">): RailGarmentItem`
    - `export function buildRailCollections(demoItems: RailGarmentItem[], scene: SupermarketScene | null): RailCollection[]`
    - `export function applyInventoryEventToCollections(collections: RailCollection[], event: InventoryEvent): RailCollection[]`
  - `frontend-supermarket/src/lib/gsap.ts`:
    - `export function ensureGsapRegistered(): void`
    - `export { gsap, useGSAP, Observer, Flip, SplitText, ScrambleTextPlugin, CustomEase }`

- [ ] **Step 1: Replace Vue dependencies with React 18, `@gsap/react`, `lucide-react`, and `@testing-library/react` in `frontend-supermarket/package.json` and configure `vite.config.ts` (`@/` alias + jsdom test environment)**

Update `frontend-supermarket/package.json` dependencies to `react: "^18.3.1"`, `react-dom: "^18.3.1"`, `gsap: "^3.13.0"`, `@gsap/react: "^2.1.2"`, `three: "^0.170.0"`, `lucide-react: "^0.460.0"`, `axios: "^1.7.7"`, and devDependencies `@vitejs/plugin-react: "^4.3.4"`, `@types/react: "^18.3.12"`, `@types/react-dom: "^18.3.1"`, `@testing-library/react: "^16.1.0"`, `@testing-library/jest-dom: "^6.6.3"`, `jsdom: "^25.0.1"`. Remove old Vue files under `frontend-supermarket/src`. Install dependencies with `npm install`.

- [ ] **Step 2: Write the failing test in `frontend-supermarket/src/lib/__tests__/rail-adapter.test.ts`**

```typescript
import { describe, expect, it } from "vitest";
import {
  applyInventoryEventToCollections,
  buildRailCollections,
  productToRailGarment,
} from "../rail-adapter";
import type { InventoryEvent, Product, RailGarmentItem, SupermarketScene } from "../../types/domain";

const MOCK_DEMO: RailGarmentItem[] = [
  { id: "bone-tee", name: "Heavyweight tee · Bone", kind: "tee", color: "#EFEBE2", tag: "$48", price: 348, stock: 12, productId: 101 },
];

describe("rail-adapter", () => {
  it("converts active backend product to RailGarmentItem with price tag and details", () => {
    const p: Product = {
      id: 7,
      shelfId: 2,
      name: "Sony WH-1000XM5",
      category: "数码音频",
      price: 2499,
      stock: 15,
      status: "ON_SHELF",
      description: "Flagship noise cancelling headphones",
    };
    const item = productToRailGarment(p, 0, { shelfCode: "B01", zone: "数码区" });
    expect(item.productId).toBe(7);
    expect(item.tag).toBe("¥2499");
    expect(item.outOfStock).toBe(false);
    expect(item.details).toContain("B01 · 数码区");
    expect(item.details).toContain("STOCK 15");
  });

  it("marks zero/negative stock or OFF_SHELF product as SOLD OUT (Review Focus #4)", () => {
    const p: Product = {
      id: 8,
      shelfId: 1,
      name: "Sold Out Coat",
      category: "服饰",
      price: 1299,
      stock: -3,
      status: "OFF_SHELF",
    };
    const item = productToRailGarment(p, 5);
    expect(item.stock).toBe(0);
    expect(item.outOfStock).toBe(true);
    expect(item.tag).toBe("SOLD OUT");
  });

  it("always preserves Atelier Demo collection when backend scene is null or empty (Review Focus #1)", () => {
    const colsNull = buildRailCollections(MOCK_DEMO, null);
    expect(colsNull).toHaveLength(1);
    expect(colsNull[0]?.id).toBe("atelier-01");
    expect(colsNull[0]?.items).toHaveLength(1);
  });

  it("updates stock and SOLD OUT tag on WebSocket INVENTORY_CHANGED event (Review Focus #2)", () => {
    const scene: SupermarketScene = {
      storeName: "KORA",
      totalShelves: 1,
      initialCamera: { spawnX: 0, spawnY: 2, spawnZ: 8, lookAtX: 0, lookAtY: 1, lookAtZ: 0 },
      sceneBounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20, height: 8 },
      shelves: [
        {
          id: 2,
          shelfCode: "B01",
          name: "Digital Archive",
          zone: "Tech",
          positionX: 0,
          positionY: 0,
          positionZ: 0,
          rotationY: 0,
          cameraTargetX: 0,
          cameraTargetY: 1.5,
          cameraTargetZ: 2,
          status: "NORMAL",
          products: [
            { id: 42, shelfId: 2, name: "Kora Jacket", category: "Apparel", price: 890, stock: 5, status: "ON_SHELF" },
          ],
        },
      ],
    };
    const initial = buildRailCollections(MOCK_DEMO, scene);
    const ev: InventoryEvent = {
      event: "INVENTORY_CHANGED",
      productId: 42,
      productName: "Kora Jacket",
      stock: 0,
      isOutOfStock: true,
      shelfId: 2,
      shelfCode: "B01",
      shelfStatus: "OUT_OF_STOCK",
      timestamp: Date.now(),
    };
    const updated = applyInventoryEventToCollections(initial, ev);
    const target = updated[1]?.items.find((i) => i.productId === 42);
    expect(target?.stock).toBe(0);
    expect(target?.outOfStock).toBe(true);
    expect(target?.tag).toBe("SOLD OUT");
    expect(updated[0]?.items[0]?.tag).toBe("$48");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm --prefix frontend-supermarket test -- --run src/lib/__tests__/rail-adapter.test.ts`
Expected: FAIL with module `../rail-adapter` not found.

- [ ] **Step 4: Implement `src/types/domain.ts`, `src/lib/gsap.ts`, `src/lib/rail-adapter.ts`, `src/api/client.ts`, and `src/index.css`**

Implement the exact signatures from the Interfaces block. In `rail-adapter.ts`, cycle `KINDS = ["tee", "knit", "hoodie", "shirt", "jacket", "coat"]` and Kora palette colors `["#C8C3F2", "#A8E6CF", "#EFEBE2", "#A3D3EB", "#DE9C31", "#B05139", "#758151"]` for backend products.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm --prefix frontend-supermarket test -- --run src/lib/__tests__/rail-adapter.test.ts`
Expected: PASS (4 passed).

---

### Task 2: Tactile 3D Product Rail Component (`/src/components/ui/product-rail-gallery.tsx`)

**Files:**
- Create: `frontend-supermarket/src/components/ui/product-rail-gallery.tsx`
- Test: `frontend-supermarket/src/components/ui/__tests__/product-rail-gallery.test.tsx`

**Interfaces:**
- Consumes: `docs/superpowers/specs/references/product-rail-gallery.reference.tsx`, `RailGarmentItem` from `src/types/domain.ts`
- Produces:
  - `export type GarmentKind = "tee" | "knit" | "hoodie" | "shirt" | "jacket" | "coat"`
  - `export type RailGarment = RailGarmentItem`
  - `export interface ClothingRailHeroProps extends React.ComponentProps<"section">` (includes `items: RailGarment[]`, `onOpenChange?: (index: number | null) => void`, `onActiveItemChange?: (item: RailGarment | null, normalizedX: number) => void`, `renderDetailActions?: (item: RailGarment) => React.ReactNode`)
  - `export const RAIL_DEMO_ITEMS: RailGarment[]` (the 10 21st.dev garments enriched with `productId`, `price`, `stock: 18`, `outOfStock: false`)
  - `export function ClothingRailHero(props: ClothingRailHeroProps): React.JSX.Element`
  - `export default ClothingRailHero`

- [ ] **Step 1: Write the failing test in `frontend-supermarket/src/components/ui/__tests__/product-rail-gallery.test.tsx`**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ClothingRailHero, { RAIL_DEMO_ITEMS } from "../product-rail-gallery";

describe("ClothingRailHero", () => {
  it("renders all 10 RAIL_DEMO_ITEMS on the rail with hang-tags and opens 3D spin detail on keyboard/click", () => {
    const onOpenChange = vi.fn();
    render(
      <ClothingRailHero
        items={RAIL_DEMO_ITEMS}
        eyebrow="COLLECTION 01"
        heading="Tactile Archive Rail"
        caption="Brush along the rail"
        onOpenChange={onOpenChange}
        renderDetailActions={(item) => <button type="button">ADD TO BAG · {item.name}</button>}
      />
    );

    expect(screen.getByText("Tactile Archive Rail")).toBeInTheDocument();
    const firstGarment = screen.getByRole("button", { name: RAIL_DEMO_ITEMS[0]!.name });
    expect(firstGarment).toBeInTheDocument();

    // Trigger keyboard detail open (detail === 0 in click handler)
    fireEvent.click(firstGarment, { detail: 0 });
    expect(onOpenChange).toHaveBeenCalledWith(0);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(`ADD TO BAG · ${RAIL_DEMO_ITEMS[0]!.name}`)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend-supermarket test -- --run src/components/ui/__tests__/product-rail-gallery.test.tsx`
Expected: FAIL with module `../product-rail-gallery` not found.

- [ ] **Step 3: Implement `frontend-supermarket/src/components/ui/product-rail-gallery.tsx`**

Copy the complete implementation from `docs/superpowers/specs/references/product-rail-gallery.reference.tsx`, export `RAIL_DEMO_ITEMS` (with `productId: 1..10`, `price`, `stock`), add `onActiveItemChange` notifications inside `choose(index)` so the 3D spotlight in Scene 02 tracks the active hanger, render sold-out crimson styling on the hang-tag when `item.outOfStock` is true, and render `renderDetailActions?.(item)` inside the `Detail` dialog column. Guard `ResizeObserver` and `Element.prototype.animate` in `Detail` so jsdom tests run cleanly.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend-supermarket test -- --run src/components/ui/__tests__/product-rail-gallery.test.tsx`
Expected: PASS.

---

### Task 3: Unified Persistent WebGL Stage (`WebGLStage.tsx` & Shaders)

**Files:**
- Create: `frontend-supermarket/src/components/stage/shaders.ts`
- Create: `frontend-supermarket/src/components/stage/WebGLStage.tsx`
- Test: `frontend-supermarket/src/components/stage/__tests__/shaders.test.ts`

**Interfaces:**
- Consumes: `src/lib/gsap.ts`
- Produces:
  - `frontend-supermarket/src/components/stage/shaders.ts`:
    - `export const DESIGNALI_FRAGMENT_SHADER: string` (contains `mod(uv.x + uv.y, 0.2)` and `fract(t - 0.01 * float(j) + float(i) * 0.01) * 5.0 - length(uv)`)
    - `export const KORA_STAGE_VERTEX_SHADER: string`
    - `export const KORA_BLOB_FRAGMENT_SHADER: string`
    - `export function computeSceneWeights(activeScene: number): [number, number, number, number]`
    - `export function hexToNormalizedRgb(hex: string): [number, number, number]`
  - `frontend-supermarket/src/components/stage/WebGLStage.tsx`:
    - `export interface WebGLStageProps { activeScene: 0 | 1 | 2 | 3; spotlightX: number; spotlightColor: string; oracleActive: boolean }`
    - `export function WebGLStage(props: WebGLStageProps): React.JSX.Element`

- [ ] **Step 1: Write the failing test in `frontend-supermarket/src/components/stage/__tests__/shaders.test.ts`**

```typescript
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import {
  DESIGNALI_FRAGMENT_SHADER,
  computeSceneWeights,
  hexToNormalizedRgb,
} from "../shaders";
import { WebGLStage } from "../WebGLStage";

describe("WebGLStage & shaders", () => {
  it("includes exact 21st.dev 45-degree slatted chromatic wave formula in DESIGNALI_FRAGMENT_SHADER", () => {
    expect(DESIGNALI_FRAGMENT_SHADER).toContain("mod(uv.x + uv.y, 0.2)");
    expect(DESIGNALI_FRAGMENT_SHADER).toContain("fract(t - 0.01 * float(j) + float(i) * 0.01) * 5.0 - length(uv)");
  });

  it("computes normalized one-hot scene weights and parses hex colors", () => {
    expect(computeSceneWeights(0)).toEqual([1, 0, 0, 0]);
    expect(computeSceneWeights(2)).toEqual([0, 0, 1, 0]);
    const [r, g, b] = hexToNormalizedRgb("#C8C3F2");
    expect(r).toBeCloseTo(200 / 255, 2);
    expect(g).toBeCloseTo(195 / 255, 2);
    expect(b).toBeCloseTo(242 / 255, 2);
  });

  it("renders gracefully without throwing when WebGL context is unavailable in jsdom (Review Focus #5)", () => {
    const { container } = render(
      React.createElement(WebGLStage, {
        activeScene: 0,
        spotlightX: 0,
        spotlightColor: "#C8C3F2",
        oracleActive: false,
      })
    );
    expect(container.querySelector("[data-webgl-stage]")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend-supermarket test -- --run src/components/stage/__tests__/shaders.test.ts`
Expected: FAIL with module `../shaders` not found.

- [ ] **Step 3: Implement `src/components/stage/shaders.ts` and `src/components/stage/WebGLStage.tsx`**

Implement the unified Three.js stage in `WebGLStage.tsx`:
- Scene 01 plane mesh running `DESIGNALI_FRAGMENT_SHADER` (`uScene1Weight`).
- Scene 02 perspective wireframe floor + wet-floor reflective plane + volumetric spotlight cone tracking `spotlightX` and `spotlightColor` via `gsap.quickTo`.
- Scene 03 iridescent noise-displaced icosahedron blob (`KORA_BLOB_FRAGMENT_SHADER`) whose displacement frequency scales up when `oracleActive` is true.
- Scene 04 subtle dark architectural grid.
- Wrap `new THREE.WebGLRenderer(...)` in `try / catch` so headless environments without a WebGL context still render the `[data-webgl-stage]` container cleanly.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend-supermarket test -- --run src/components/stage/__tests__/shaders.test.ts`
Expected: PASS.

---

### Task 4: Four-Scene Kora Experience, Editorial Chrome & Full App Assembly

*(Completed)*

---

### Task 5: Horizon Tech Table 3D Component (`/src/components/ui/tech-table-gallery.tsx`)

**Files:**
- Create: `frontend-supermarket/src/components/ui/tech-table-gallery.tsx`
- Test: `frontend-supermarket/src/components/ui/__tests__/tech-table-gallery.test.tsx`

**Interfaces:**
- Consumes: `RailGarmentItem` from `src/types/domain.ts`, `src/lib/gsap.ts`
- Produces:
  - `export type TechDeviceKind = "phone" | "headphones" | "laptop" | "watch" | "dac" | "camera"`
  - `export const TECH_TABLE_DEMO_ITEMS: RailGarmentItem[]` (6 flagship digital devices with front screen wake-up art, back optics/chassis art, and exploded internal chip layer art)
  - `export interface TechTableHeroProps { items: RailGarmentItem[]; onActiveItemChange?: (item: RailGarmentItem | null, normalizedX: number) => void; onOpenChange?: (index: number | null) => void; renderDetailActions?: (item: RailGarmentItem) => React.ReactNode; selectedItemId?: string | null }`
  - `export function TechTableHero(props: TechTableHeroProps): React.JSX.Element`

- [ ] **Step 1: Write the failing test in `frontend-supermarket/src/components/ui/__tests__/tech-table-gallery.test.tsx`**
- [ ] **Step 2: Run test to verify it fails (RED)**
- [ ] **Step 3: Implement `frontend-supermarket/src/components/ui/tech-table-gallery.tsx` (Sequential laser scanline + magnetic dock entrance, pointer-brush screen wake-up & tilt physics, FLIP magnetic lift into 1400px 3D stage with `DISPLAY WAKE` / `OPTICS BACK` / `X-RAY EXPLODED` 3-layer `translateZ` modes)**
- [ ] **Step 4: Run test to verify it passes (GREEN)**

---

### Task 6: Vitrine Pedestal Gallery 3D Component (`/src/components/ui/vitrine-pedestal-gallery.tsx`)

**Files:**
- Create: `frontend-supermarket/src/components/ui/vitrine-pedestal-gallery.tsx`
- Test: `frontend-supermarket/src/components/ui/__tests__/vitrine-pedestal-gallery.test.tsx`

**Interfaces:**
- Consumes: `RailGarmentItem` from `src/types/domain.ts`, `src/lib/gsap.ts`
- Produces:
  - `export type VitrineObjectKind = "parfum" | "chronograph" | "sculpture" | "kettle" | "orb" | "turntable"`
  - `export const VITRINE_DEMO_ITEMS: RailGarmentItem[]` (6 museum-grade luxury objects displayed inside glass bell vitrines)
  - `export interface VitrineGalleryHeroProps { items: RailGarmentItem[]; onActiveItemChange?: (item: RailGarmentItem | null, normalizedX: number) => void; onOpenChange?: (index: number | null) => void; renderDetailActions?: (item: RailGarmentItem) => React.ReactNode; selectedItemId?: string | null }`
  - `export function VitrineGalleryHero(props: VitrineGalleryHeroProps): React.JSX.Element`

- [ ] **Step 1: Write the failing test in `frontend-supermarket/src/components/ui/__tests__/vitrine-pedestal-gallery.test.tsx`**
- [ ] **Step 2: Run test to verify it fails (RED)**
- [ ] **Step 3: Implement `frontend-supermarket/src/components/ui/vitrine-pedestal-gallery.tsx` (Spotlight ignition + glass bell hood descent entrance, spring-physics glass bell lift on hover, unseal-and-elevate FLIP transition into 3D Turntable stage with `OBVERSE` / `INSCRIPTION` / `TURNTABLE AUTO-SPIN` modes)**
- [ ] **Step 4: Run test to verify it passes (GREEN)**

---

### Task 7: Six-Scene Panoramic Theater Upgrade (`WebGLStage`, `EditorialChrome`, `App.tsx`)

**Files:**
- Modify: `frontend-supermarket/src/components/stage/shaders.ts`
- Modify: `frontend-supermarket/src/components/stage/WebGLStage.tsx`
- Modify: `frontend-supermarket/src/components/chrome/EditorialChrome.tsx`
- Modify: `frontend-supermarket/src/components/scenes/TactileArchiveScene.tsx`
- Modify: `frontend-supermarket/src/App.tsx`
- Modify: `frontend-supermarket/src/__tests__/app-flow.test.tsx`

- [ ] **Step 1: Update `app-flow.test.tsx` to assert 6-scene navigation (`01 Optical portal`, `02 Garment rail`, `03 Tech table`, `04 Vitrine gallery`, `05 Neural atelier`, `06 Studio console`), showroom quick-switching, and 3D inspection in each showroom**
- [ ] **Step 2: Run test to verify it fails (RED)**
- [ ] **Step 3: Upgrade `WebGLStage`, `EditorialChrome`, `TactileArchiveScene`, and `App.tsx` to the 6-scene architecture with showroom quick-switcher bar and real-time inventory sync across all 3 showrooms**
- [ ] **Step 4: Run full Vitest suite and production build to verify all tests pass (GREEN)**
