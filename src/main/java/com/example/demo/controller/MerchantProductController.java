package com.example.demo.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.demo.common.result.Result;
import com.example.demo.entity.Product;
import com.example.demo.model.dto.MerchantProductSaveDTO;
import com.example.demo.service.merchant.MerchantService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 商户后台商品管理控制器
 */
@RestController
@RequestMapping("/api/merchant/products")
public class MerchantProductController {

    private final MerchantService merchantService;

    public MerchantProductController(MerchantService merchantService) {
        this.merchantService = merchantService;
    }

    /**
     * 商户分页查询店内商品
     */
    @GetMapping
    public Result<Page<Product>> listProducts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        Page<Product> productPage = merchantService.listProducts(page, size, keyword, status);
        return Result.success(productPage);
    }

    /**
     * 商户创建新商品 (绑定 3D 货架)
     */
    @PostMapping
    public Result<Product> createProduct(@RequestBody MerchantProductSaveDTO dto) {
        Product product = merchantService.createProduct(dto);
        return Result.success(product);
    }

    /**
     * 商户修改商品信息
     */
    @PutMapping("/{id}")
    public Result<Product> updateProduct(@PathVariable Long id, @RequestBody MerchantProductSaveDTO dto) {
        Product product = merchantService.updateProduct(id, dto);
        return Result.success(product);
    }

    /**
     * 切换商品上下架状态
     */
    @PutMapping("/{id}/status")
    public Result<Void> updateProductStatus(@PathVariable Long id, @RequestParam String status) {
        merchantService.updateProductStatus(id, status);
        return Result.success();
    }

    /**
     * 快速修改商品库存 (自动向全场 3D 客户端广播 WebSocket 变动事件)
     */
    @PutMapping("/{id}/stock")
    public Result<Void> updateProductStock(@PathVariable Long id, @RequestParam Integer stock) {
        merchantService.updateProductStock(id, stock);
        return Result.success();
    }
}
