package com.example.demo.service.merchant;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.demo.entity.Product;
import com.example.demo.entity.Shelf;
import com.example.demo.model.dto.MerchantProductSaveDTO;

import java.util.List;

/**
 * 商户后台管理服务接口
 */
public interface MerchantService {

    /**
     * 商户分页查询店内商品
     */
    Page<Product> listProducts(int page, int size, String keyword, String status);

    /**
     * 商户创建新商品 (绑定 3D 货架)
     */
    Product createProduct(MerchantProductSaveDTO dto);

    /**
     * 商户编辑商品信息
     */
    Product updateProduct(Long id, MerchantProductSaveDTO dto);

    /**
     * 商品上下架状态切换
     */
    void updateProductStatus(Long id, String status);

    /**
     * 快速调整商品库存 (自动清理 Redis 缓存并向全场 3D 客户端广播 WebSocket 变动事件)
     */
    void updateProductStock(Long id, Integer newStock);

    /**
     * 获取所有 3D 货架点位
     */
    List<Shelf> listShelves();

    /**
     * 创建或更新 3D 货架空间点位与注视点
     */
    Shelf saveShelf(Shelf shelf);
}
