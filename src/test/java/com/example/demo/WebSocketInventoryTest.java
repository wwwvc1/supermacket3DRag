package com.example.demo;

import com.example.demo.entity.Product;
import com.example.demo.entity.Shelf;
import com.example.demo.mapper.ProductMapper;
import com.example.demo.mapper.ShelfMapper;
import com.example.demo.websocket.SupermarketEventPublisher;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 3D 超市实时 WebSocket 库存广播与货架售罄标红联动单元测试
 */
@SpringBootTest
class WebSocketInventoryTest {

    @Autowired
    private SupermarketEventPublisher eventPublisher;

    @Autowired
    private ShelfMapper shelfMapper;

    @Autowired
    private ProductMapper productMapper;

    @Test
    @DisplayName("测试商品售罄时货架自动联动标红 OUT_OF_STOCK 及补货恢复 NORMAL")
    void testInventoryZeroTriggersShelfOutOfStock() {
        // 1. 创建一个独立的专属测试货架
        Shelf testShelf = new Shelf(
                null,
                "TEST_WS_01",
                "WebSocket测试专区",
                "生鲜区",
                5.0, 0.0, 5.0, 0.0,
                5.0, 1.6, 7.0,
                "NORMAL"
        );
        shelfMapper.insert(testShelf);
        Long shelfId = testShelf.getId();
        assertNotNull(shelfId);

        // 2. 在该货架上放置一件仅剩 1 件库存的测试商品
        Product testProduct = new Product(
                null,
                "测试告罄商品-" + System.currentTimeMillis(),
                "生鲜区",
                new BigDecimal("9.90"),
                1,
                "用于测试货架售罄联动"
        );
        testProduct.setShelfId(shelfId);
        testProduct.setStatus("ON_SHELF");
        productMapper.insert(testProduct);
        Long productId = testProduct.getId();

        // 3. 模拟库存扣减归零，触发事件发布
        testProduct.setStock(0);
        productMapper.updateById(testProduct);

        assertDoesNotThrow(() -> {
            eventPublisher.publishInventoryChanged(productId, 0);
        }, "在无活跃 WebSocket 客户端连接情况下，广播必须优雅处理不抛异常");

        // 校验货架状态已自动联动更新为 OUT_OF_STOCK
        Shelf updatedShelf = shelfMapper.selectById(shelfId);
        assertNotNull(updatedShelf);
        assertEquals("OUT_OF_STOCK", updatedShelf.getStatus(), "当货架上所有在架商品售罄时，货架必须标记为 OUT_OF_STOCK");

        // 4. 模拟补货，库存恢复为 20
        testProduct.setStock(20);
        productMapper.updateById(testProduct);

        assertDoesNotThrow(() -> {
            eventPublisher.publishInventoryChanged(productId, 20);
        });

        // 校验货架状态已恢复为 NORMAL
        Shelf restoredShelf = shelfMapper.selectById(shelfId);
        assertNotNull(restoredShelf);
        assertEquals("NORMAL", restoredShelf.getStatus(), "商品补货后，货架状态必须恢复为 NORMAL");
    }
}
