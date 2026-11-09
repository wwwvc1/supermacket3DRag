package com.example.demo;

import com.example.demo.common.constant.RedisConstants;
import com.example.demo.entity.Product;
import com.example.demo.service.ProductService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ProductControllerTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Test
    @DisplayName("测试商品详情 Cache-Aside 缓存防穿透与防雪崩机制")
    void testProductCacheAndProtections() {
        Long testId = 1L;
        String cacheKey = RedisConstants.PRODUCT_CACHE_PREFIX + testId;

        // 清理原有缓存
        redisTemplate.delete(cacheKey);

        // 1. 首次查询：触发数据库回源与防雪崩随机 TTL 写入
        Product product = productService.getProductById(testId);
        assertNotNull(product);
        assertEquals(testId, product.getId());

        // 验证 Redis 中已生成缓存
        String cachedJson = redisTemplate.opsForValue().get(cacheKey);
        assertNotNull(cachedJson);
        assertTrue(cachedJson.contains("iPhone"));

        // 验证防雪崩机制：TTL 必须大于基准 3600 秒
        Long expireSeconds = redisTemplate.getExpire(cacheKey, TimeUnit.SECONDS);
        assertNotNull(expireSeconds);
        assertTrue(expireSeconds >= RedisConstants.PRODUCT_BASE_TTL_SECONDS,
                "TTL 应包含防雪崩随机抖动时间: " + expireSeconds);

        // 2. 二次查询：直接命中缓存
        Product cachedProduct = productService.getProductById(testId);
        assertNotNull(cachedProduct);
        assertEquals(product.getName(), cachedProduct.getName());

        // 3. 验证防缓存穿透机制：查询一个根本不存在的商品 ID
        Long nonExistentId = 999999999L;
        String nonExistentKey = RedisConstants.PRODUCT_CACHE_PREFIX + nonExistentId;
        redisTemplate.delete(nonExistentKey);

        Product nullProduct = productService.getProductById(nonExistentId);
        assertNull(nullProduct, "不存在的商品应当返回 null");

        // 验证 Redis 中是否成功写入了防穿透空值标记
        String nullCacheVal = redisTemplate.opsForValue().get(nonExistentKey);
        assertEquals(RedisConstants.NULL_CACHE_VALUE, nullCacheVal);

        // 验证防穿透空值的 TTL 不超过 60 秒
        Long nullExpire = redisTemplate.getExpire(nonExistentKey, TimeUnit.SECONDS);
        assertNotNull(nullExpire);
        assertTrue(nullExpire > 0 && nullExpire <= RedisConstants.NULL_CACHE_TTL_SECONDS);
    }
}
