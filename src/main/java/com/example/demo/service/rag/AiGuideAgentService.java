package com.example.demo.service.rag;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.entity.Product;
import com.example.demo.entity.Shelf;
import com.example.demo.mapper.ProductMapper;
import com.example.demo.mapper.ShelfMapper;
import com.example.demo.model.dto.GuideRouteRequestDTO;
import com.example.demo.model.vo.GuideRouteResponseVO;
import com.example.demo.model.vo.WaypointVO;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * AI 导购机器人服务：购物清单实体提取、店内商品匹配与 3D 空间最优就近漫游路径拓扑规划
 */
@Service
public class AiGuideAgentService {

    private static final Logger log = LoggerFactory.getLogger(AiGuideAgentService.class);

    private final ProductMapper productMapper;
    private final ShelfMapper shelfMapper;
    private final ChatLanguageModel chatLanguageModel;

    public AiGuideAgentService(ProductMapper productMapper,
                               ShelfMapper shelfMapper,
                               ChatLanguageModel chatLanguageModel) {
        this.productMapper = productMapper;
        this.shelfMapper = shelfMapper;
        this.chatLanguageModel = chatLanguageModel;
    }

    /**
     * 接收用户自由文本购物清单，进行智能商品匹配与空间航路点拓扑排序
     *
     * @param request 购物清单入参
     * @return 排序后的 3D 飞掠航路点序列与导购解说
     */
    public GuideRouteResponseVO planRoute(GuideRouteRequestDTO request) {
        String text = (request != null && request.getShoppingListText() != null)
                ? request.getShoppingListText().trim()
                : "";

        if (text.isBlank()) {
            return new GuideRouteResponseVO("您的购物清单为空，请输入想购买的商品（如：纯牛奶、苹果、耳机等）。",
                    0, List.of(), List.of());
        }

        // 1. 提取清单中独立的物品名称实体
        List<String> itemKeywords = extractItemKeywords(text);
        log.info("从用户清单中提取出的商品意图关键词: {}", itemKeywords);

        // 2. 匹配店内在售商品与关联的 3D 货架
        List<MatchedCandidate> candidates = new ArrayList<>();
        List<String> unmatchedItems = new ArrayList<>();
        Set<Long> matchedProductIds = new HashSet<>();

        for (String keyword : itemKeywords) {
            String cleanWord = keyword.trim();
            if (cleanWord.isBlank()) {
                continue;
            }

            List<Product> products = productMapper.selectList(new LambdaQueryWrapper<Product>()
                    .eq(Product::getStatus, "ON_SHELF")
                    .like(Product::getName, cleanWord)
                    .orderByDesc(Product::getStock));

            if (products.isEmpty()) {
                // 按品类或简单分词再次检索
                products = productMapper.selectList(new LambdaQueryWrapper<Product>()
                        .eq(Product::getStatus, "ON_SHELF")
                        .like(Product::getCategory, cleanWord));
            }

            // 若仍未命中且词长大于 2，尝试剥离常见修饰词（如“降噪”、“无线”、“红富士”等）或截取末尾核心词根检索
            if (products.isEmpty() && cleanWord.length() > 2) {
                String stripped = cleanWord.replaceAll("^(降噪|无线|头戴|智能|电竞|客制化|有机|红富士|便携|全脂|台式|游戏)", "");
                if (!stripped.isBlank() && stripped.length() >= 2) {
                    products = productMapper.selectList(new LambdaQueryWrapper<Product>()
                            .eq(Product::getStatus, "ON_SHELF")
                            .and(w -> w.like(Product::getName, stripped).or().like(Product::getCategory, stripped))
                            .orderByDesc(Product::getStock));
                }
                if (products.isEmpty() && cleanWord.length() >= 4) {
                    String suffix = cleanWord.substring(cleanWord.length() - 2);
                    products = productMapper.selectList(new LambdaQueryWrapper<Product>()
                            .eq(Product::getStatus, "ON_SHELF")
                            .and(w -> w.like(Product::getName, suffix).or().like(Product::getCategory, suffix))
                            .orderByDesc(Product::getStock));
                }
            }

            if (!products.isEmpty()) {
                Product target = products.getFirst();
                if (!matchedProductIds.contains(target.getId())) {
                    matchedProductIds.add(target.getId());

                    Shelf shelf = target.getShelfId() != null ? shelfMapper.selectById(target.getShelfId()) : null;
                    candidates.add(new MatchedCandidate(cleanWord, target, shelf));
                }
            } else {
                unmatchedItems.add(cleanWord);
            }
        }

        if (candidates.isEmpty()) {
            return new GuideRouteResponseVO(
                    "很抱歉，超市当前暂未检索到您清单中的商品，建议咨询人工客服或搜索其他在售商品。",
                    0, List.of(), unmatchedItems
            );
        }

        // 3. 基于最近邻欧氏距离（Nearest Neighbor Euclidean Distance）对 3D 货架坐标进行路径拓扑排序
        List<MatchedCandidate> sortedCandidates = optimizeTourRoute(candidates);

        // 4. 组装航路点数据结构并生成导购解说
        List<WaypointVO> waypoints = new ArrayList<>();
        int step = 1;
        for (MatchedCandidate c : sortedCandidates) {
            Product p = c.product;
            Shelf s = c.shelf;

            WaypointVO wp = new WaypointVO();
            wp.setStep(step++);
            wp.setProductId(p.getId());
            wp.setProductName(p.getName());
            wp.setPrice(p.getPrice());
            wp.setStock(p.getStock());
            wp.setOutOfStock(p.getStock() == null || p.getStock() <= 0);

            if (s != null) {
                wp.setShelfId(s.getId());
                wp.setShelfCode(s.getShelfCode());
                wp.setShelfName(s.getName());
                wp.setZone(s.getZone());
                wp.setPositionX(s.getPositionX());
                wp.setPositionY(s.getPositionY());
                wp.setPositionZ(s.getPositionZ());
                wp.setCameraTargetX(s.getCameraTargetX());
                wp.setCameraTargetY(s.getCameraTargetY());
                wp.setCameraTargetZ(s.getCameraTargetZ());
            } else {
                wp.setShelfCode("UNASSIGNED");
                wp.setShelfName("中心推荐区");
                wp.setZone("全场导购区");
                wp.setPositionX(0.0);
                wp.setPositionY(0.0);
                wp.setPositionZ(0.0);
                wp.setCameraTargetX(0.0);
                wp.setCameraTargetY(1.5);
                wp.setCameraTargetZ(2.0);
            }

            wp.setGuideSpeech(String.format("第 %d 站到达【%s】，为您找到【%s】，售价 ¥%s，%s",
                    wp.getStep(),
                    wp.getZone() != null ? wp.getZone() : "推荐区",
                    p.getName(),
                    p.getPrice(),
                    wp.isOutOfStock() ? "⚠️当前库存已售罄，货架已标红警示！" : "当前库存充足，可直接点击卡片加购。"));

            waypoints.add(wp);
        }

        // 5. 生成开场白与路线总览
        StringBuilder summaryBuilder = new StringBuilder();
        summaryBuilder.append(String.format("您好！AI 导购已为您规划了包含 %d 个货架站点的最优空间巡航路线。", waypoints.size()));
        summaryBuilder.append("我们将依次飞往：");
        for (int i = 0; i < waypoints.size(); i++) {
            summaryBuilder.append(waypoints.get(i).getZone()).append("（").append(waypoints.get(i).getProductName()).append("）");
            if (i < waypoints.size() - 1) {
                summaryBuilder.append(" ➜ ");
            }
        }
        summaryBuilder.append("。请点击屏幕下方的巡航按钮开始沉浸式运镜！");

        if (!unmatchedItems.isEmpty()) {
            summaryBuilder.append("（注：清单中的「").append(String.join("、", unmatchedItems)).append("」暂未在店内匹配到，已为您跳过）");
        }

        return new GuideRouteResponseVO(summaryBuilder.toString(), waypoints.size(), waypoints, unmatchedItems);
    }

    /**
     * 空间拓扑路径优化：从超市原点 (0, 0, 0) 开始，按贪心最近邻算法排序货架三维坐标，避免相机走回头路
     */
    private List<MatchedCandidate> optimizeTourRoute(List<MatchedCandidate> candidates) {
        List<MatchedCandidate> remaining = new ArrayList<>(candidates);
        List<MatchedCandidate> sorted = new ArrayList<>();

        double currentX = 0.0;
        double currentZ = 0.0;

        while (!remaining.isEmpty()) {
            MatchedCandidate bestNext = null;
            double minDistanceSq = Double.MAX_VALUE;

            for (MatchedCandidate candidate : remaining) {
                double targetX = (candidate.shelf != null && candidate.shelf.getPositionX() != null)
                        ? candidate.shelf.getPositionX() : 0.0;
                double targetZ = (candidate.shelf != null && candidate.shelf.getPositionZ() != null)
                        ? candidate.shelf.getPositionZ() : 0.0;

                double dx = targetX - currentX;
                double dz = targetZ - currentZ;
                double distSq = dx * dx + dz * dz;

                if (distSq < minDistanceSq) {
                    minDistanceSq = distSq;
                    bestNext = candidate;
                }
            }

            if (bestNext != null) {
                sorted.add(bestNext);
                remaining.remove(bestNext);
                currentX = (bestNext.shelf != null && bestNext.shelf.getPositionX() != null)
                        ? bestNext.shelf.getPositionX() : currentX;
                currentZ = (bestNext.shelf != null && bestNext.shelf.getPositionZ() != null)
                        ? bestNext.shelf.getPositionZ() : currentZ;
            } else {
                break;
            }
        }

        return sorted;
    }

    /**
     * 从自由文本中提取商品意图词列表 (大模型识别 + 智能规则降级兜底)
     */
    private List<String> extractItemKeywords(String text) {
        try {
            String prompt = "你是一个专业超市购物清单解析器。用户输入了购物需求：「" + text + "」。" +
                    "请提取出用户想要购买的实体商品名称列表，仅以逗号分隔输出（例如：牛奶, 苹果, 键盘），不要输出任何多余的标点和解释。";

            String response = chatLanguageModel.generate(
                    List.of(SystemMessage.from("你是一个精确的商品词提取工具"), UserMessage.from(prompt))
            ).content().text();

            if (response != null && !response.isBlank()) {
                String[] items = response.replaceAll("[，、；;]", ",").split(",");
                List<String> list = new ArrayList<>();
                for (String it : items) {
                    String clean = it.trim().replaceAll("^[0-9一二两三四五六七八九十]+[个盒瓶斤件箱包双条副支把台]?\\s*", "");
                    if (!clean.isBlank() && clean.length() >= 2) {
                        list.add(clean);
                    }
                }
                if (!list.isEmpty()) {
                    return list;
                }
            }
        } catch (Exception e) {
            log.warn("大模型解析购物清单异常或处于测试环境，切换为本地分词提取兜底: {}", e.getMessage());
        }

        // 本地规则分词兜底
        String sanitized = text.replaceAll("[我想买来点需要要一二两三四五六七八九十个盒瓶斤件箱包双条副支把台以及还要并和，、。？！?!]", " ");
        String[] words = sanitized.split("\\s+");
        List<String> result = new ArrayList<>();
        for (String w : words) {
            String clean = w.trim();
            if (!clean.isBlank() && clean.length() >= 2) {
                result.add(clean);
            }
        }
        if (result.isEmpty()) {
            result.addAll(Arrays.asList(text.split("[,\\s+，、]")));
        }
        return result;
    }

    private static class MatchedCandidate {
        String keyword;
        Product product;
        Shelf shelf;

        MatchedCandidate(String keyword, Product product, Shelf shelf) {
            this.keyword = keyword;
            this.product = product;
            this.shelf = shelf;
        }
    }
}
