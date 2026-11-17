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
