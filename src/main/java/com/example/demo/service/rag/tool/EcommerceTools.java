package com.example.demo.service.rag.tool;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.entity.Product;
import com.example.demo.mapper.ProductMapper;
import dev.langchain4j.agent.tool.Tool;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 挂载供智能体 (LangChain4j Agent) 动态调用的电商商品查询工具箱
 */
@Component
public class EcommerceTools {

    private final ProductMapper productMapper;

    public EcommerceTools(ProductMapper productMapper) {
        this.productMapper = productMapper;
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

        List<Product> products = productMapper.selectList(new LambdaQueryWrapper<Product>()
                .like(Product::getName, keyword.trim())
                .last("LIMIT 5"));

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
