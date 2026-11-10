package com.example.demo;

import com.example.demo.common.constant.RedisConstants;
import com.example.demo.common.result.Result;
import com.example.demo.controller.MerchantProductController;
import com.example.demo.controller.MerchantShelfController;
import com.example.demo.entity.Product;
import com.example.demo.entity.Shelf;
import com.example.demo.mapper.ProductMapper;
import com.example.demo.mapper.ShelfMapper;
import com.example.demo.model.dto.MerchantProductSaveDTO;
import com.example.demo.service.merchant.MerchantService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 商家后台管理商品与货架 CRUD 单元测试
 */
@SpringBootTest
class MerchantProductTest {

    @Autowired
    private MerchantService merchantService;

    @Autowired
    private MerchantProductController merchantProductController;

    @Autowired
    private MerchantShelfController merchantShelfController;

    @Autowired
    private ProductMapper productMapper;

    @Autowired
    private ShelfMapper shelfMapper;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Test
    @DisplayName("测试商家后台录入商品并绑定 3D 货架、修改库存与上下架状态")
    void testMerchantProductLifecycle() {
        // 1. 查询一个存在的货架 (例如 A01)
        List<Shelf> shelves = shelfMapper.selectList(null);
        assertNotNull(shelves);
        assertFalse(shelves.isEmpty());
        Shelf testShelf = shelves.get(0);

        // 2. 商家新增商品
        MerchantProductSaveDTO createDTO = new MerchantProductSaveDTO();
        createDTO.setName("商家自测阳光玫瑰葡萄-" + System.currentTimeMillis());
        createDTO.setCategory("生鲜果蔬");
        createDTO.setPrice(new BigDecimal("39.90"));
        createDTO.setStock(50);
        createDTO.setDescription("商家后台自测商品，产地直采");
        createDTO.setShelfId(testShelf.getId());
        createDTO.setStatus("ON_SHELF");

        Result<Product> createResult = merchantProductController.createProduct(createDTO);
        assertNotNull(createResult);
        assertEquals(200, createResult.getCode());

        Product savedProduct = createResult.getData();
        assertNotNull(savedProduct.getId());
        assertEquals("ON_SHELF", savedProduct.getStatus());
        assertEquals(testShelf.getId(), savedProduct.getShelfId());

        Long productId = savedProduct.getId();

        // 预设 Redis 缓存模拟高频读取
        String cacheKey = RedisConstants.PRODUCT_CACHE_PREFIX + productId;
        redisTemplate.opsForValue().set(cacheKey, "{\"id\":" + productId + "}");

        // 3. 快捷修改库存
        Result<Void> stockResult = merchantProductController.updateProductStock(productId, 10);
        assertNotNull(stockResult);
        assertEquals(200, stockResult.getCode());

        Product updatedStockProduct = productMapper.selectById(productId);
        assertEquals(10, updatedStockProduct.getStock());
        // 校验 Redis 缓存已被同步清除
        assertNull(redisTemplate.opsForValue().get(cacheKey), "修改库存后必须清除 Redis 缓存保证一致性");

        // 4. 下架商品
        Result<Void> offShelfResult = merchantProductController.updateProductStatus(productId, "OFF_SHELF");
        assertNotNull(offShelfResult);
        assertEquals(200, offShelfResult.getCode());

        Product offShelfProduct = productMapper.selectById(productId);
        assertEquals("OFF_SHELF", offShelfProduct.getStatus());

        // 5. 重新上架商品
        Result<Void> onShelfResult = merchantProductController.updateProductStatus(productId, "ON_SHELF");
        assertNotNull(onShelfResult);
        assertEquals(200, onShelfResult.getCode());

        Product onShelfProduct = productMapper.selectById(productId);
        assertEquals("ON_SHELF", onShelfProduct.getStatus());
    }

    @Test
    @DisplayName("测试商家后台查询全场 3D 货架列表")
    void testMerchantListShelves() {
        Result<List<Shelf>> result = merchantShelfController.listShelves();
        assertNotNull(result);
        assertEquals(200, result.getCode());

        List<Shelf> shelves = result.getData();
        assertNotNull(shelves);
        assertFalse(shelves.isEmpty());

        for (Shelf shelf : shelves) {
            assertNotNull(shelf.getId());
            assertNotNull(shelf.getShelfCode());
            assertNotNull(shelf.getName());
            assertNotNull(shelf.getPositionX());
            assertNotNull(shelf.getPositionY());
            assertNotNull(shelf.getPositionZ());
        }
    }
}
