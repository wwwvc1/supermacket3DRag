package com.example.demo.service.rag.tool;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.entity.Product;
import com.example.demo.mapper.ProductMapper;
import dev.langchain4j.agent.tool.Tool;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * 挂载供智能体 (LangChain4j Agent) 动态调用的电商商品查询工具箱 (支持中英文品牌别名双向检索)
 */
@Component
public class EcommerceTools {

    private static final Map<String, List<String>> BILINGUAL_ALIASES = Map.ofEntries(
            Map.entry("三星", List.of("Samsung", "Galaxy")),
            Map.entry("华为", List.of("HUAWEI", "Mate")),
            Map.entry("保时捷", List.of("Porsche")),
            Map.entry("苹果", List.of("Apple", "iPhone", "苹果")),
            Map.entry("大疆", List.of("DJI", "Mavic", "Osmo")),
            Map.entry("无人机", List.of("Drone", "Mavic", "DJI")),
            Map.entry("云台", List.of("Gimbal", "Osmo")),
            Map.entry("茅台", List.of("茅台")),
            Map.entry("五粮液", List.of("五粮液")),
            Map.entry("红酒", List.of("Beringer", "赤霞珠", "干红")),
            Map.entry("葡萄酒", List.of("Beringer", "赤霞珠")),
            Map.entry("烟斗", List.of("Briar", "烟斗")),
            Map.entry("卫衣", List.of("Hoodie", "sweatshirt")),
            Map.entry("衬衫", List.of("Oxford", "shirt")),
            Map.entry("衬衣", List.of("Oxford", "shirt")),
            Map.entry("毛衣", List.of("cardigan", "Knit")),
            Map.entry("短袖", List.of("tee", "polo")),
            Map.entry("T恤", List.of("tee")),
            Map.entry("手机", List.of("手机数码"))
    );

    private static final Set<String> GENERIC_CATEGORY_TERMS = Set.of("手机数码", "手机");

    private final ProductMapper productMapper;

    public EcommerceTools(ProductMapper productMapper) {
        this.productMapper = productMapper;
    }

    /**
     * 展开中文提问中的自然语言寒暄词并附加中英双语品牌词根
     */
    public static Set<String> expandKeywords(String rawText) {
        Set<String> terms = new LinkedHashSet<>();
        if (rawText == null || rawText.isBlank()) {
            return terms;
        }
        String cleaned = rawText
                .replaceAll("(你好|请问|店里|目前|现在|在售的|有什么|有哪些|多少钱|价格|库存|查询|看看|推荐|一下|吗|呢|[？?！!。，、])", " ")
                .trim();

        if (!cleaned.isBlank()) {
            for (String token : cleaned.split("\\s+")) {
                if (token.length() >= 2) {
                    terms.add(token);
                }
            }
        }

        for (Map.Entry<String, List<String>> entry : BILINGUAL_ALIASES.entrySet()) {
            if (rawText.contains(entry.getKey())) {
                terms.add(entry.getKey());
                terms.addAll(entry.getValue());
            }
        }
        if (terms.isEmpty() && !rawText.trim().isEmpty()) {
            terms.add(rawText.trim());
        }
        return terms;
    }

    /**
     * 按关键词与双语别名匹配强度对候选商品排序（品牌/品名命中优先于泛类目命中，其次按库存降序）
     */
    public static List<Product> rankByRelevance(List<Product> candidates, String rawKeyword, Set<String> expandedTerms) {
        if (candidates == null || candidates.size() <= 1) {
            return candidates == null ? List.of() : candidates;
        }
        String normalizedRaw = rawKeyword == null ? "" : rawKeyword.trim().toLowerCase(Locale.ROOT);
        return candidates.stream()
                .sorted(Comparator
                        .<Product>comparingInt(p -> scoreProduct(p, normalizedRaw, expandedTerms))
                        .reversed()
                        .thenComparing(p -> p.getStock() == null ? 0 : p.getStock(), Comparator.reverseOrder()))
                .toList();
    }

    private static int scoreProduct(Product p, String normalizedRaw, Set<String> expandedTerms) {
        String name = p.getName() == null ? "" : p.getName().toLowerCase(Locale.ROOT);
        String category = p.getCategory() == null ? "" : p.getCategory().toLowerCase(Locale.ROOT);
        String desc = p.getDescription() == null ? "" : p.getDescription().toLowerCase(Locale.ROOT);

        int score = 0;
        if (!normalizedRaw.isEmpty() && name.contains(normalizedRaw)) {
            score += 20;
        }
        if (expandedTerms != null) {
            for (String term : expandedTerms) {
                if (term == null || term.isBlank()) {
                    continue;
                }
                String t = term.toLowerCase(Locale.ROOT);
                boolean isGeneric = GENERIC_CATEGORY_TERMS.contains(term);
                if (name.contains(t)) {
                    score += isGeneric ? 2 : 8;
                } else if (category.contains(t)) {
                    score += isGeneric ? 1 : 4;
                } else if (desc.contains(t)) {
                    score += 2;
                }
            }
        }
        return score;
    }

    /**
     * 根据商品名称或关键字模糊查询商城内实时商品信息与库存
     *
     * @param keyword 商品名称或关键词
     * @return 格式化后的商品详情及实时库存价格说明
     */
    @Tool("根据商品名称或关键词查询商城在售商品实时库存、售价与基本信息")
    public String queryProductByName(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return "未提供有效的商品查询关键词。";
        }

        Set<String> searchTerms = expandKeywords(keyword);
        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Product::getStatus, "ON_SHELF");
        wrapper.and(w -> {
            boolean first = true;
            for (String term : searchTerms) {
                if (!first) {
                    w.or();
                }
                w.like(Product::getName, term)
                        .or().like(Product::getCategory, term)
                        .or().like(Product::getDescription, term);
                first = false;
            }
        });

        List<Product> products = rankByRelevance(productMapper.selectList(wrapper), keyword, searchTerms)
                .stream()
                .limit(5)
                .toList();

        if (products.isEmpty()) {
            return "商城中暂未检索到与【" + keyword + "】相关的商品。";
        }

        StringBuilder sb = new StringBuilder("查询到以下相关商品实时信息：\n");
        for (Product p : products) {
            sb.append(String.format("- 【%s】(编号:%d) 售价: ¥%s, 当前剩余库存: %d件, 描述: %s\n",
                    p.getName(), p.getId(), p.getPrice(), p.getStock(), p.getDescription()));
        }
        return sb.toString();
    }

    /**
     * 根据商品唯一 ID 查询详情
     *
     * @param productId 商品 ID
     * @return 商品详情
     */
    @Tool("根据商品唯一ID查询详细规格、价格与库存")
    public String queryProductDetail(Long productId) {
        if (productId == null) {
            return "商品 ID 不能为空。";
        }
        Product p = productMapper.selectById(productId);
        if (p == null) {
            return "未找到 ID 为 " + productId + " 的商品。";
        }
        return String.format("【%s】(分类: %s) 现价: ¥%s, 库存量: %d, 详细介绍: %s",
                p.getName(), p.getCategory(), p.getPrice(), p.getStock(), p.getDescription());
    }
}
