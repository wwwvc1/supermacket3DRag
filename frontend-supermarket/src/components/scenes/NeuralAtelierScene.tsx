/**
 * 第 05 幕 · NEURAL ATELIER（Kora 液态虹彩 AI 买手 · RAG 知识库问答 & AI 3D 空间巡航导购舱）
 * - 模式一：RAG KNOWLEDGE ORACLE (/api/rag/chat) — 多轮记忆、实时商品 @Tool 检索与精准文档溯源引用
 * - 模式二：AI SPATIAL ROUTE (/api/supermarket/guide/route) — 自由文本购物清单实体识别与最近邻空间导购路线，一键直飞展厅单品
 */
import React, { useState } from "react";
import { ArrowUpRight, Compass, FileText, MapPin, Sparkles } from "lucide-react";
import { apiClient } from "../../api/client";
import type { GuideRouteResponseVO, SourceCitation } from "../../types/domain";

export interface NeuralAtelierSceneProps {
  active: boolean;
  onOracleBusyChange: (busy: boolean) => void;
  onJumpToProductId?: (productId: number) => void;
}

interface DialogueEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceCitation[];
  isError?: boolean;
}

const CURATED_PROMPTS = [
  "Apple iPhone 16 支持多大功率的无线快充？退换货政策如何？",
  "目前在售的旗舰数码与典藏商品有哪些？请结合实时库存推荐。",
  "冷链生鲜与有机乳品的配送保障标准是什么？",
];

const CURATED_ROUTES = [
  "我想买一瓶茅台、一部三星手机和一件卫衣",
  "帮我找一台大疆无人机、一块苹果手表和一箱纯牛奶",
];

export function NeuralAtelierScene({
  active,
  onOracleBusyChange,
  onJumpToProductId,
}: NeuralAtelierSceneProps): React.JSX.Element {
  const [mode, setMode] = useState<"rag" | "route">("rag");
  const [sessionId] = useState(() => `kora_oracle_${Date.now()}`);
  const [question, setQuestion] = useState("");
  const [routeInput, setRouteInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<GuideRouteResponseVO | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const [entries, setEntries] = useState<DialogueEntry[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to the KORA Neural Atelier. Ask anything about garment specifications, digital hardware, care standards, or live archive availability — backed by real LangChain4j RAG & MySQL telemetry.",
    },
  ]);

  if (!active) {
    return <div className="hidden" aria-hidden="true" />;
  }

  async function submitPrompt(rawText?: string) {
    const q = (rawText ?? question).trim();
    if (!q || loading) return;

    const userMsg: DialogueEntry = { id: `u_${Date.now()}`, role: "user", content: q };
    setEntries((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);
    onOracleBusyChange(true);

    try {
      const res = await apiClient.ragChat(sessionId, q);
      setEntries((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: "assistant",
          content: res.answer,
          sources: res.sources,
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "无法连接到后端 RAG 服务 (/api/rag/chat)";
      setEntries((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: "assistant",
          content: `RAG 服务端调用失败：${msg}。请确认 Spring Boot (localhost:8080) 已启动并完成文档向量入库。`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      onOracleBusyChange(false);
    }
  }

  async function submitRoutePlan(rawText?: string) {
    const listText = (rawText ?? routeInput).trim();
    if (!listText || loading) return;

    setRouteInput(listText);
    setRouteError(null);
    setLoading(true);
    onOracleBusyChange(true);

    try {
      const res = await apiClient.planGuideRoute(listText);
      setRouteResult(res);
    } catch (err) {
      setRouteError(err instanceof Error ? err.message : "AI 空间导购服务调用失败");
    } finally {
      setLoading(false);
      onOracleBusyChange(false);
    }
  }

  return (
    <section
      data-testid="scene-03-oracle"
      className="relative mx-auto grid h-full w-full max-w-6xl grid-cols-1 items-center gap-8 px-6 pt-20 pb-20 md:grid-cols-12"
    >
      {/* 左栏：标题、模式切换与策展提示词 */}
      <div className="flex flex-col justify-between md:col-span-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-[#C8C3F2]">
            SCENE 05 / NEURAL ATELIER
          </p>
          <h2 className="mt-2 text-4xl font-semibold leading-none tracking-tight text-white sm:text-5xl">
            Ask the{" "}
            <span className="kora-serif-italic font-normal text-[#C8C3F2]">
              iridescent
            </span>{" "}
            oracle.
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-white/60">
            Powered by LangChain4j multi-turn memory, @Tool live MySQL inventory lookup,
            and nearest-neighbor 3D spatial routing.
          </p>

          <div className="mt-5 inline-flex gap-2">
            <button
              type="button"
              onClick={() => setMode("rag")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition ${
                mode === "rag"
                  ? "bg-[#C8C3F2] font-semibold text-black"
                  : "border border-white/20 text-white/65 hover:text-white"
              }`}
            >
              <Sparkles className="size-3" />
              <span>RAG ORACLE CHAT</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("route")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition ${
                mode === "route"
                  ? "bg-[#A8E6CF] font-semibold text-black"
                  : "border border-white/20 text-white/65 hover:text-white"
              }`}
            >
              <Compass className="size-3" />
              <span>AI 3D ROUTE PLANNER</span>
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
            {mode === "rag" ? "CURATED RAG INQUIRIES" : "SAMPLE SHOPPING LISTS"}
          </p>
          {(mode === "rag" ? CURATED_PROMPTS : CURATED_ROUTES).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => (mode === "rag" ? submitPrompt(p) : submitRoutePlan(p))}
              className="flex w-full items-center justify-between border-b border-white/15 py-2.5 text-left text-xs text-white/75 transition hover:border-[#C8C3F2] hover:text-[#C8C3F2]"
            >
              <span className="truncate pr-3">{p}</span>
              <ArrowUpRight className="size-3.5 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* 右栏：RAG 多轮问答面板 OR AI 3D 巡航路线规划面板 */}
      <div className="flex h-[min(68vh,560px)] flex-col justify-between rounded-2xl border border-white/15 bg-black/80 p-6 md:col-span-7">
        {mode === "rag" ? (
          <>
            <div data-scrollable="true" className="flex-1 space-y-6 overflow-y-auto pr-2">
              {entries.map((entry) => (
                <article key={entry.id} className="space-y-2 border-b border-white/10 pb-5">
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                    <span>{entry.role === "user" ? "VISITOR INQUIRY" : "KORA ORACLE RESPONSE"}</span>
                    {entry.role === "assistant" && (
                      <span className={entry.isError ? "text-[#FF2A54]" : "text-[#A8E6CF]"}>
                        {entry.isError ? "BACKEND UNREACHABLE" : "LIVE BACKEND RAG"}
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">
                    {entry.content}
                  </p>

                  {entry.sources && entry.sources.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {entry.sources.map((src) => (
                        <div
                          key={`${entry.id}_${src.citationIndex}`}
                          className="rounded-xl border border-white/12 bg-white/[0.03] p-3"
                        >
                          <div className="flex items-center justify-between font-mono text-[10px] text-[#C8C3F2]">
                            <span className="inline-flex items-center gap-1 truncate">
                              <FileText className="size-3 shrink-0" />
                              <span>
                                [引用{src.citationIndex}: {src.fileName} {src.pageNumber}]
                              </span>
                            </span>
                            <span className="text-[#A8E6CF]">
                              {(src.similarityScore * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="mt-1.5 line-clamp-2 font-mono text-[10px] leading-relaxed text-white/55">
                            {src.contentSnippet}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}

              {loading && (
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] text-[#C8C3F2]">
                  <Sparkles className="size-4 animate-spin" />
                  <span>QUERYING VECTOR ARCHIVE & TOOLS...</span>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitPrompt();
              }}
              className="mt-4 flex items-end gap-4 border-t border-white/15 pt-4"
            >
              <label className="flex-1">
                <span className="block font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                  INQUIRE / ARCHIVE KNOWLEDGE BASE
                </span>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask about specs, stock, or return policies..."
                  className="mt-1 w-full border-0 border-b border-white/25 bg-transparent pb-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#C8C3F2]"
                />
              </label>
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#C8C3F2] px-5 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-[#DDD9FB] disabled:opacity-40"
              >
                <span>ASK</span>
                <ArrowUpRight className="size-3.5" />
              </button>
            </form>
          </>
        ) : (
          <>
            <div data-scrollable="true" className="flex-1 space-y-4 overflow-y-auto pr-2">
              {routeError && (
                <div className="rounded-xl border border-[#FF2A54]/50 bg-[#FF2A54]/10 p-3 font-mono text-xs text-[#FF2A54]">
                  {routeError}
                </div>
              )}

              {!routeResult && !loading && (
                <div className="py-12 text-center">
                  <Compass className="mx-auto mb-3 size-8 text-[#A8E6CF]/70" />
                  <p className="text-sm text-white/70">
                    输入自然语言购物清单，AI 导购机器人将结合 3D 货架坐标规划最近邻巡航动线。
                  </p>
                </div>
              )}

              {loading && (
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] text-[#A8E6CF]">
                  <Sparkles className="size-4 animate-spin" />
                  <span>PLANNING 3D NEAREST-NEIGHBOR ROUTE...</span>
                </div>
              )}

              {routeResult && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#A8E6CF]/30 bg-[#A8E6CF]/5 p-4 text-xs leading-relaxed text-white/85">
                    {routeResult.summary}
                  </div>
                  <div className="space-y-2.5">
                    {routeResult.waypoints.map((wp) => (
                      <div
                        key={`${wp.step}_${wp.productId}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/[0.03] p-3.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 font-mono text-[10px] text-[#A8E6CF]">
                            <MapPin className="size-3" />
                            <span>
                              STOP {wp.step} · {wp.shelfCode} · {wp.zone}
                            </span>
                            <span className={wp.outOfStock ? "text-[#FF2A54]" : "text-white/55"}>
                              ({wp.outOfStock ? "SOLD OUT" : `${wp.stock} PCS`})
                            </span>
                          </div>
                          <p className="mt-1 truncate text-sm font-medium text-white">
                            {wp.productName} · ¥{Number(wp.price).toFixed(2)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-white/55">{wp.guideSpeech}</p>
                        </div>
                        {onJumpToProductId && (
                          <button
                            type="button"
                            onClick={() => onJumpToProductId(wp.productId)}
                            className="shrink-0 rounded-full border border-[#A8E6CF]/50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#A8E6CF] transition hover:bg-[#A8E6CF] hover:text-black"
                          >
                            直飞展品
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitRoutePlan();
              }}
              className="mt-4 flex items-end gap-4 border-t border-white/15 pt-4"
            >
              <label className="flex-1">
                <span className="block font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                  SHOPPING LIST / AI SPATIAL GUIDE
                </span>
                <input
                  type="text"
                  value={routeInput}
                  onChange={(e) => setRouteInput(e.target.value)}
                  placeholder="例如：我想买一瓶茅台、一部三星手机和一件卫衣"
                  className="mt-1 w-full border-0 border-b border-white/25 bg-transparent pb-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#A8E6CF]"
                />
              </label>
              <button
                type="submit"
                disabled={loading || !routeInput.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#A8E6CF] px-5 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-[#c5f0df] disabled:opacity-40"
              >
                <span>PLAN</span>
                <Compass className="size-3.5" />
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
