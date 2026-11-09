package com.example.demo.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.result.Result;
import com.example.demo.entity.Product;
import com.example.demo.service.ProductService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 商品控制器：分页浏览与商品详情查询
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    /**
     * 分页浏览商品列表
     *
     * @param page     当前页码 (默认 1)
     * @param size     每页数量 (默认 10)
     * @param category 分类过滤
     * @param keyword  商品名关键字
     * @return 分页结果
     */
    @GetMapping
    public Result<Page<Product>> listProducts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword) {
        Page<Product> productPage = productService.listProducts(page, size, category, keyword);
        return Result.success(productPage);
    }

    /**
     * 查询商品详情 (经过 Redis 缓存/防穿透/防雪崩机制保护)
     *
     * @param id 商品主键 ID
     * @return 商品详细信息
     */
    @GetMapping("/{id}")
    public Result<Product> getProductById(@PathVariable Long id) {
        Product product = productService.getProductById(id);
        if (product == null) {
            throw new BusinessException(404, "商品不存在或已下架");
        }
        return Result.success(product);
    }
}
