package com.example.demo.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.demo.entity.Product;

/**
 * 商品业务服务接口
 */
public interface ProductService {

    /**
     * 分页查询商品列表
     *
     * @param page     页码
     * @param size     每页数量
     * @param category 分类过滤 (可选)
     * @param keyword  关键词搜索 (可选)
     * @return 分页结果
     */
    Page<Product> listProducts(int page, int size, String category, String keyword);

    /**
     * 查询商品详情 (基于 Redis Cache-Aside 模式，内置防穿透与防雪崩机制)
     *
     * @param id 商品主键 ID
     * @return 商品实体 (若不存在返回 null)
     */
    Product getProductById(Long id);

    /**
     * 更新商品信息 (同步清理缓存)
     *
     * @param product 商品实体
     */
    void updateProduct(Product product);
}
