/**
 * 后端商品与 3D 三大展厅（Garment Rail / Horizon Tech Table / Vitrine Gallery）领域转换适配器
 * - Stage I (Garment Rail) 对接后端 id 101..110 (货架 R01)，严格保留 10 件高定服饰视觉资产并实时同步后端库存与价格
 * - Stage II (Horizon Tech Table) 对接后端 id 201..205 及新增 STAGE_TECH 商品 (货架 T01)
 * - Stage III (Vitrine Gallery) 对接后端 id 301..306 及新增 STAGE_VITRINE 商品 (货架 V01)
 * - 兼容保留 STORE_GENERAL (id 1..7) 货架商品为补充档次系列，支持 WebSocket 实时库存与 SOLD OUT 联动
 */
import type {
  GarmentKind,
  InventoryEvent,
  Product,
  RailCollection,
  RailGarmentItem,
  SceneShelf,
  SupermarketScene,
} from "../types/domain";

const GARMENT_KINDS: GarmentKind[] = ["tee", "knit", "hoodie", "shirt", "jacket", "coat"];

const KORA_FABRIC_PALETTE = [
  "#C8C3F2", // Kora Lilac
  "#A8E6CF", // Mint Pastel
  "#EFEBE2", // Bone Ivory
  "#A3D3EB", // Sky Oxford
  "#DE9C31", // Ochre Gold
  "#B05139", // Dusty Brick
  "#758151", // Olive Lambswool
  "#CCB2E0", // Soft Lavender
];

/**
 * 格式化商品价格标签
 */
export function formatPriceTag(price: number): string {
  const safePrice = Number.isFinite(price) && price > 0 ? price : 0;
  return Number.isInteger(safePrice) ? `¥${safePrice}` : `¥${safePrice.toFixed(2)}`;
}

/**
 * 将后端单个商品转换为展厅单品 RailGarmentItem
 */
export function productToRailGarment(
  product: Product,
  index: number,
  shelf?: Pick<SceneShelf, "shelfCode" | "zone">
): RailGarmentItem {
  const clampedStock = Math.max(0, Math.floor(Number(product.stock) || 0));
  const isSoldOut = clampedStock <= 0 || product.status === "OFF_SHELF";
  const kind = GARMENT_KINDS[Math.abs(index) % GARMENT_KINDS.length] ?? "tee";
  const color =
    product.colorHex ||
    KORA_FABRIC_PALETTE[Math.abs(product.id + index) % KORA_FABRIC_PALETTE.length] ||
    "#C8C3F2";

  const details: string[] = [];
  if (product.category) {
    details.push(product.category);
  }
  if (shelf?.shelfCode && shelf?.zone) {
    details.push(`${shelf.shelfCode} · ${shelf.zone}`);
  } else if (shelf?.shelfCode) {
    details.push(shelf.shelfCode);
  }
  details.push(isSoldOut ? "SOLD OUT" : `STOCK ${clampedStock}`);

  return {
    id: `store-product-${product.id}`,
    productId: product.id,
    name: product.name,
    description:
      product.description ||
      `${product.category || "精选藏品"} · 实时数字孪生档案编号 #${String(product.id).padStart(3, "0")}`,
    kind,
    color,
    image: product.imageUrl || undefined,
    backImage: product.backImageUrl || product.imageUrl || undefined,
    sideImage: product.sideImageUrl || undefined,
    price: Number(product.price) || 0,
    stock: clampedStock,
    outOfStock: isSoldOut,
    tag: isSoldOut ? "SOLD OUT" : formatPriceTag(Number(product.price) || 0),
    details,
    shelfCode: shelf?.shelfCode,
    zone: shelf?.zone,
  };
}

/**
 * 合并静态高定展示模板项与后端实时商品数据（保留高清多视角摄影与视觉标签，覆盖为真实 DB 价格/库存/上下架状态）
 */
function mergeStageItemsWithBackend(
  fallbackItems: RailGarmentItem[],
  defaultBaseId: number,
  backendEntries: { product: Product; shelf: SceneShelf }[]
): RailGarmentItem[] {
  const usedBackendIds = new Set<number>();

  const merged: RailGarmentItem[] = fallbackItems.map((demo, idx) => {
    const expectedProductId = demo.productId ?? defaultBaseId + idx;
    const match = backendEntries.find(
      (entry) => entry.product.id === expectedProductId || entry.product.name === demo.name
    );

    if (!match) {
      return {
        ...demo,
        productId: expectedProductId,
        price: demo.price ?? (Number(String(demo.tag ?? "").replace(/[^0-9.]/g, "")) || 68),
        stock: demo.stock ?? 18,
        outOfStock: demo.outOfStock ?? false,
      };
    }

    usedBackendIds.add(match.product.id);
    const liveStock = Math.max(0, Math.floor(Number(match.product.stock) || 0));
    const livePrice = Number(match.product.price) || demo.price || 0;
    const isSoldOut = liveStock <= 0 || match.product.status === "OFF_SHELF";
    const keepDollarTag = typeof demo.tag === "string" && demo.tag.startsWith("$");

    return {
      ...demo,
      productId: match.product.id,
      name: match.product.name || demo.name,
      description: match.product.description || demo.description,
      image: match.product.imageUrl || demo.image,
      backImage: match.product.backImageUrl || match.product.imageUrl || demo.backImage,
      sideImage: match.product.sideImageUrl || demo.sideImage,
      color: match.product.colorHex || demo.color,
      price: livePrice,
      stock: liveStock,
      outOfStock: isSoldOut,
      tag: isSoldOut
        ? "SOLD OUT"
        : keepDollarTag
        ? `$${Math.round(livePrice)}`
        : formatPriceTag(livePrice),
      shelfCode: match.shelf.shelfCode || demo.shelfCode,
      zone: match.shelf.zone || demo.zone,
    };
  });

  // 追加商户通过后台新建并挂载到该展厅的新商品
  backendEntries.forEach((entry, idx) => {
    if (usedBackendIds.has(entry.product.id)) return;
    merged.push(
      productToRailGarment(entry.product, merged.length + idx, {
        shelfCode: entry.shelf.shelfCode,
        zone: entry.shelf.zone,
      })
    );
  });

  return merged;
}

/**
 * 组装滑轨系列列表（保持向后兼容与单测契约）
 */
export function buildRailCollections(
  demoItems: RailGarmentItem[],
  scene: SupermarketScene | null
): RailCollection[] {
  const allEntries: { product: Product; shelf: SceneShelf }[] = [];
  if (scene && Array.isArray(scene.shelves)) {
    scene.shelves.forEach((shelf) => {
      (shelf.products ?? []).forEach((product) => {
        allEntries.push({ product, shelf });
      });
    });
  }

  const railEntries = allEntries.filter(
    ({ product, shelf }) => product.showroomStage === "STAGE_RAIL" || shelf.shelfCode === "R01"
  );

  const collections: RailCollection[] = [
    {
      id: "atelier-01",
      code: "EDITION 01",
      title: "ATELIER GARMENTS",
      subtitle: "Ten pieces on the brushed chrome rail · Real MySQL & Redisson Lock Backed",
      accentColor: "#C8C3F2",
      items: mergeStageItemsWithBackend(demoItems, 101, railEntries),
    },
  ];

  const generalEntries = allEntries.filter(
    ({ product, shelf }) =>
      product.showroomStage !== "STAGE_RAIL" &&
      product.showroomStage !== "STAGE_TECH" &&
      product.showroomStage !== "STAGE_VITRINE" &&
      shelf.shelfCode !== "R01" &&
      shelf.shelfCode !== "T01" &&
      shelf.shelfCode !== "V01"
  );

  if (generalEntries.length > 0) {
    collections.push({
      id: "live-store-all",
      code: "EDITION 02",
      title: "LIVE STORE ARCHIVE",
      subtitle: `${scene?.storeName || "KORA"} · Real-Time Inventory & Redisson Lock Protected`,
      accentColor: "#A8E6CF",
      items: generalEntries
        .slice(0, 12)
        .map(({ product, shelf }, idx) =>
          productToRailGarment(product, idx, {
            shelfCode: shelf.shelfCode,
            zone: shelf.zone,
          })
        ),
    });
  }

  return collections;
}

/**
 * 组装全部三大 3D 展厅的系列集合，全量绑定真实后端数据与多视角图片
 */
export function buildAllShowroomCollections(
  railDemoItems: RailGarmentItem[],
  techDemoItems: RailGarmentItem[],
  vitrineDemoItems: RailGarmentItem[],
  scene: SupermarketScene | null
): RailCollection[] {
  const railCols = buildRailCollections(railDemoItems, scene);

  const allEntries: { product: Product; shelf: SceneShelf }[] = [];
  if (scene && Array.isArray(scene.shelves)) {
    scene.shelves.forEach((shelf) => {
      (shelf.products ?? []).forEach((product) => {
        allEntries.push({ product, shelf });
      });
    });
  }

  const techEntries = allEntries.filter(
    ({ product, shelf }) => product.showroomStage === "STAGE_TECH" || shelf.shelfCode === "T01"
  );
  const vitrineEntries = allEntries.filter(
    ({ product, shelf }) =>
      product.showroomStage === "STAGE_VITRINE" || shelf.shelfCode === "V01"
  );

  return [
    ...railCols,
    {
      id: "tech-table-02",
      code: "STAGE II",
      title: "HORIZON TECH TABLE",
      subtitle: "WebGL2 Warp Carousel · Flagship Digital Hardware",
      accentColor: "#00F0FF",
      items: mergeStageItemsWithBackend(techDemoItems, 201, techEntries),
    },
    {
      id: "vitrine-gallery-03",
      code: "STAGE III",
      title: "VITRINE GALLERY",
      subtitle: "Refractive Glass Bell Pedestals · Rare Objects",
      accentColor: "#A8E6CF",
      items: mergeStageItemsWithBackend(vitrineDemoItems, 301, vitrineEntries),
    },
  ];
}

/**
 * 响应 WebSocket INVENTORY_CHANGED 广播，不可变更新所有展厅系列中对应商品的库存与吊牌
 */
export function applyInventoryEventToCollections(
  collections: RailCollection[],
  event: InventoryEvent
): RailCollection[] {
  const nextStock = Math.max(0, Math.floor(Number(event.stock) || 0));
  const soldOut = Boolean(event.isOutOfStock) || nextStock <= 0;

  return collections.map((col) => ({
    ...col,
    items: col.items.map((item) => {
      if (item.productId !== event.productId) {
        return item;
      }
      const basePrice = item.price ?? 0;
      const keepDollarTag = col.id === "atelier-01" && typeof item.tag === "string" && item.tag.startsWith("$");
      const updatedDetails = (item.details ?? []).map((d) =>
        d.startsWith("STOCK ") || d === "SOLD OUT" ? (soldOut ? "SOLD OUT" : `STOCK ${nextStock}`) : d
      );
      return {
        ...item,
        stock: nextStock,
        outOfStock: soldOut,
        tag: soldOut ? "SOLD OUT" : keepDollarTag ? `$${Math.round(basePrice)}` : formatPriceTag(basePrice),
        details: updatedDetails,
      };
    }),
  }));
}
