/**
 * 第 06 幕 · STUDIO CONSOLE（Kora 极简奢华编辑风商户与知识库实时调控中枢）
 * - 实时对接后端 /api/merchant/products、/api/merchant/shelves 与 /api/rag/documents
 * - 支持库存实时同步（触发 Redisson 缓存清理 + WebSocket 全场 3D 广播）、上下架切换 (ON_SHELF / OFF_SHELF)、上新商品绑定展厅
 * - 支持 RAG 文档上传入库与 Embedding 策略热切换 (ONNX LOCAL / CLOUD API)
 */
import React, { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, FileText, Plus, RefreshCw, Upload } from "lucide-react";
import { apiClient } from "../../api/client";
import type {
  EmbeddingProvider,
  InventoryEvent,
  KnowledgeDocument,
  Product,
  ProductStatus,
  RailCollection,
  SceneShelf,
} from "../../types/domain";

export interface StudioConsoleSceneProps {
  active: boolean;
  collections: RailCollection[];
  onLocalInventoryChange: (event: InventoryEvent) => void;
  onRefreshScene?: () => Promise<unknown>;
  onNotify: (message: string) => void;
}

export function StudioConsoleScene({
  active,
  collections,
  onLocalInventoryChange,
  onRefreshScene,
  onNotify,
}: StudioConsoleSceneProps): React.JSX.Element {
  const [merchantProducts, setMerchantProducts] = useState<Product[]>([]);
  const [shelves, setShelves] = useState<SceneShelf[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [backendSynced, setBackendSynced] = useState(false);

  const [draftStocks, setDraftStocks] = useState<Record<number, number>>({});
  const [embeddingProvider, setEmbeddingProvider] = useState<EmbeddingProvider>("local");
  const [uploading, setUploading] = useState(false);

  // 新建商品表单状态
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("高定选品");
  const [newPrice, setNewPrice] = useState("299");
  const [newStock, setNewStock] = useState("20");
  const [newShelfId, setNewShelfId] = useState<string>("9");
  const [newStage, setNewStage] = useState("STAGE_TECH");
  const [newImageUrl, setNewImageUrl] = useState("/products/dji-osmo-mobile.png");

  const loadConsoleData = useCallback(async () => {
    try {
      const [prodPage, shelfList, docList] = await Promise.all([
        apiClient.listMerchantProducts(1, 50),
        apiClient.listMerchantShelves(),
        apiClient.listDocuments(),
      ]);
      setMerchantProducts(prodPage.records ?? []);
      setShelves(shelfList ?? []);
      setDocuments(docList ?? []);
      setBackendSynced(true);
    } catch {
      setBackendSynced(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    loadConsoleData();
  }, [active, loadConsoleData]);

  if (!active) {
    return <div className="hidden" aria-hidden="true" />;
  }

  // 当已连接后端时直接渲染 MySQL 权威商品分页（含 OFF_SHELF）；离线单测环境下展示 collections 快照
  const displayRows: {
    id: number;
    name: string;
    stock: number;
    status: ProductStatus;
    priceTag: string;
    subtitle: string;
    dotColor: string;
  }[] = backendSynced
    ? merchantProducts.map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock ?? 0,
        status: p.status,
        priceTag: `¥${Number(p.price).toFixed(2)}`,
        subtitle: `${p.showroomStage || p.category} · 货架 #${p.shelfId ?? "未绑定"} · ${p.status}`,
        dotColor: p.colorHex || (p.status === "OFF_SHELF" ? "#FF2A54" : "#A8E6CF"),
      }))
    : collections.flatMap((col) =>
        col.items.map((item, idx) => ({
          id: item.productId ?? idx + 1,
          name: item.name,
          stock: item.stock ?? 18,
          status: (item.outOfStock ? "OFF_SHELF" : "ON_SHELF") as ProductStatus,
          priceTag: item.tag ?? "¥68",
          subtitle: `${col.title} · TAG ${item.tag ?? ""}`,
          dotColor: item.color ?? "#C8C3F2",
        }))
      );

  async function applyStockUpdate(productId: number, productName: string, nextStock: number) {
    const safeStock = Math.max(0, Math.floor(Number(nextStock) || 0));
    try {
      await apiClient.updateMerchantStock(productId, safeStock);
      setMerchantProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: safeStock } : p))
      );
      onLocalInventoryChange({
        event: "INVENTORY_CHANGED",
        productId,
        productName,
        stock: safeStock,
        isOutOfStock: safeStock <= 0,
        shelfId: 1,
        shelfCode: "LIVE",
        shelfStatus: safeStock <= 0 ? "OUT_OF_STOCK" : "NORMAL",
        timestamp: Date.now(),
      });
      await loadConsoleData();
      await onRefreshScene?.();
      onNotify(
        safeStock <= 0
          ? `LIVE SYNC · ${productName} 已清零 (0 PCS) — 展厅已触发售罄标红`
          : `LIVE SYNC · ${productName} 库存已同步更新为 ${safeStock} PCS`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "修改库存失败，请检查后端服务";
      onNotify(`库存同步失败：${msg}`);
    }
  }

  async function toggleStatus(productId: number, productName: string, currentStatus: ProductStatus) {
    const nextStatus: ProductStatus = currentStatus === "ON_SHELF" ? "OFF_SHELF" : "ON_SHELF";
    try {
      await apiClient.updateMerchantStatus(productId, nextStatus);
      await loadConsoleData();
      await onRefreshScene?.();
      onNotify(`商品 [${productName}] 已切换为 ${nextStatus}`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "切换上下架状态失败");
    }
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await apiClient.createMerchantProduct({
        name: newName.trim(),
        category: newCategory.trim() || "精选藏品",
        price: Number(newPrice) || 99,
        stock: Math.max(0, Math.floor(Number(newStock) || 0)),
        status: "ON_SHELF",
        shelfId: Number(newShelfId) || null,
        showroomStage: newStage,
        imageUrl: newImageUrl.trim() || undefined,
        backImageUrl: newImageUrl.trim() || undefined,
      });
      setNewName("");
      setShowCreateForm(false);
      await loadConsoleData();
      await onRefreshScene?.();
      onNotify(`新商品 [${newName.trim()}] 已保存至 MySQL 并挂载至展厅`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "创建商品失败");
    }
  }

  async function handleToggleEmbedding(next: EmbeddingProvider) {
    try {
      await apiClient.switchEmbedding(next);
      setEmbeddingProvider(next);
      onNotify(`EMBEDDING 引擎已热切换为 ${next.toUpperCase()}`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "切换 Embedding 引擎失败");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const doc = await apiClient.uploadDocument(file);
      await loadConsoleData();
      onNotify(`文档已切片向量化入库 · ${doc.fileName} (${doc.chunkCount ?? 1} 切片)`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : `文档解析入库失败：${file.name}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <section
      data-testid="scene-04-atelier"
      className="relative mx-auto grid h-full w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 pt-20 pb-20 md:grid-cols-12"
    >
      {/* 左栏：Kora 标题、RAG 引擎热切换与知识库文档状态 */}
      <div className="space-y-5 md:col-span-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-[#C8C3F2]">
            SCENE 06 / STUDIO CONSOLE
          </p>
          <h2 className="mt-2 text-4xl font-semibold leading-none tracking-tight text-white sm:text-5xl">
            Let&apos;s curate{" "}
            <span className="kora-serif-italic font-normal text-[#C8C3F2]">
              something rare.
            </span>
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-white/60">
            Live MySQL + Redisson inventory telemetry & RAG knowledge ingestion. Any mutation
            immediately invalidates Redis cache and broadcasts via WebSocket.
          </p>
        </div>

        {/* RAG Embedding 引擎切换与文档上传 */}
        <div className="space-y-4 border-t border-white/15 pt-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/50">
              EMBEDDING STRATEGY
            </span>
            <div className="inline-flex gap-2">
              {(["local", "online"] as const).map((prov) => (
                <button
                  key={prov}
                  type="button"
                  onClick={() => handleToggleEmbedding(prov)}
                  className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] transition ${
                    embeddingProvider === prov
                      ? "bg-[#C8C3F2] font-semibold text-black"
                      : "border border-white/20 text-white/60 hover:text-white"
                  }`}
                >
                  {prov === "local" ? "ONNX LOCAL" : "CLOUD API"}
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between border-b border-white/25 py-3 text-xs text-white/80 transition hover:border-[#C8C3F2] hover:text-[#C8C3F2]">
            <span className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.2em]">
              <Upload className="size-3.5" />
              <span>{uploading ? "INDEXING DOCUMENT..." : "INGEST RAG DOCUMENT (.PDF / .MD / .DOCX)"}</span>
            </span>
            <ArrowUpRight className="size-4" />
            <input
              type="file"
              accept=".pdf,.md,.docx,.png,.jpg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* 已入库知识文档列表 */}
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/45">
              INDEXED KNOWLEDGE DOCUMENTS ({documents.length})
            </p>
            {documents.length === 0 ? (
              <p className="font-mono text-[10px] text-white/35">
                {backendSynced ? "尚未上传文档，可上方选择 PDF/MD/Word 上传入库" : "等待后端连接 /api/rag/documents"}
              </p>
            ) : (
              <div data-scrollable="true" className="max-h-24 space-y-1 overflow-y-auto pr-1">
                {documents.slice(0, 6).map((doc, idx) => (
                  <div
                    key={doc.id ?? `${doc.fileName}_${idx}`}
                    className="flex items-center justify-between font-mono text-[10px] text-white/70"
                  >
                    <span className="inline-flex items-center gap-1.5 truncate pr-2">
                      <FileText className="size-3 text-[#C8C3F2]" />
                      <span className="truncate">{doc.fileName}</span>
                    </span>
                    <span className="shrink-0 text-[#A8E6CF]">{doc.chunkCount ?? 1} CHUNKS</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 右栏：极简无框线实时库存调控 + 新建商品矩阵 */}
      <div className="flex h-[min(68vh,560px)] flex-col rounded-2xl border border-white/15 bg-black/85 p-6 md:col-span-7">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white/50">
          <span>LIVE INVENTORY MATRIX ({displayRows.length})</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full border border-[#C8C3F2]/50 px-2.5 py-1 text-[9px] text-[#C8C3F2] transition hover:bg-[#C8C3F2] hover:text-black"
            >
              <Plus className="size-3" />
              <span>{showCreateForm ? "收起上新" : "上新商品"}</span>
            </button>
            <button
              type="button"
              onClick={loadConsoleData}
              className="inline-flex items-center gap-1 text-[#00FF66] hover:text-white"
              title="刷新后端商品数据"
            >
              <RefreshCw className="size-3" />
              <span>{backendSynced ? "MYSQL SYNCED" : "OFFLINE CACHE"}</span>
            </button>
          </div>
        </div>

        {/* 快速新建商品面板 (/api/merchant/products) */}
        {showCreateForm && (
          <form
            onSubmit={handleCreateProduct}
            className="mb-4 grid grid-cols-2 gap-2.5 rounded-xl border border-white/15 bg-white/[0.03] p-3.5 text-xs"
          >
            <input
              type="text"
              required
              placeholder="商品名称 (如 Leica Q3)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="col-span-2 border-0 border-b border-white/25 bg-transparent pb-1 text-white outline-none focus:border-[#C8C3F2]"
            />
            <input
              type="text"
              placeholder="品类"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="border-0 border-b border-white/25 bg-transparent pb-1 text-white outline-none focus:border-[#C8C3F2]"
            />
            <input
              type="number"
              step="0.01"
              placeholder="价格"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="border-0 border-b border-white/25 bg-transparent pb-1 text-white outline-none focus:border-[#C8C3F2]"
            />
            <select
              value={newStage}
              onChange={(e) => setNewStage(e.target.value)}
              className="border-0 border-b border-white/25 bg-black pb-1 text-white outline-none"
            >
              <option value="STAGE_RAIL">STAGE I · 服饰滑轨</option>
              <option value="STAGE_TECH">STAGE II · 数码转盘</option>
              <option value="STAGE_VITRINE">STAGE III · 玻璃展柜</option>
              <option value="STORE_GENERAL">通用超市货架</option>
            </select>
            <select
              value={newShelfId}
              onChange={(e) => setNewShelfId(e.target.value)}
              className="border-0 border-b border-white/25 bg-black pb-1 text-white outline-none"
            >
              {shelves.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.shelfCode} · {s.zone}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="图片路径 (如 /products/dji-osmo-mobile.png)"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="border-0 border-b border-white/25 bg-transparent pb-1 text-white outline-none focus:border-[#C8C3F2]"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                placeholder="库存"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="w-16 border-0 border-b border-white/25 bg-transparent pb-1 text-center text-white outline-none"
              />
              <button
                type="submit"
                className="flex-1 rounded-full bg-[#A8E6CF] py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-black"
              >
                发布上架
              </button>
            </div>
          </form>
        )}

        <div data-scrollable="true" className="flex-1 divide-y divide-white/10 overflow-y-auto pr-2">
          {displayRows.map((row) => {
            const draft = draftStocks[row.id] ?? row.stock;
            const soldOut = row.stock <= 0 || row.status === "OFF_SHELF";

            return (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: row.dotColor }}
                    />
                    <span className="truncate text-sm font-medium text-white">
                      {row.name}
                    </span>
                    <span
                      className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] ${
                        soldOut ? "text-[#FF2A54]" : "text-[#A8E6CF]"
                      }`}
                    >
                      {row.status === "OFF_SHELF"
                        ? "[OFF SHELF]"
                        : row.stock <= 0
                        ? "[SOLD OUT]"
                        : `[${row.stock} PCS]`}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                    #{row.id} · {row.subtitle} · {row.priceTag}
                  </p>
                </div>

                {/* 库存编辑 + 上下架开关 + 同步按钮 */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    aria-label={`Stock for ${row.name}`}
                    value={draft}
                    onChange={(e) =>
                      setDraftStocks((prev) => ({
                        ...prev,
                        [row.id]: Number.parseInt(e.target.value || "0", 10),
                      }))
                    }
                    className="w-14 border-0 border-b border-white/30 bg-transparent pb-1 text-center font-mono text-xs text-white outline-none focus:border-[#C8C3F2]"
                  />
                  <button
                    type="button"
                    onClick={() => toggleStatus(row.id, row.name, row.status)}
                    className="rounded-full border border-white/25 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/75 transition hover:border-white hover:text-white"
                  >
                    {row.status === "ON_SHELF" ? "下架" : "上架"}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyStockUpdate(row.id, row.name, 0)}
                    className="rounded-full border border-[#FF2A54]/50 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#FF2A54] transition hover:bg-[#FF2A54] hover:text-black"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => applyStockUpdate(row.id, row.name, draft)}
                    className="inline-flex items-center gap-1 rounded-full bg-[#C8C3F2] px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-[#DDD9FB]"
                  >
                    <span>SYNC</span>
                    <ArrowUpRight className="size-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
