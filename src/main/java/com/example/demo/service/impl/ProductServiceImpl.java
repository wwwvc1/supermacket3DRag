package com.example.demo.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.demo.common.constant.RedisConstants;
import com.example.demo.entity.Product;
import com.example.demo.mapper.ProductMapper;
import com.example.demo.service.ProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

/**
 * 商品业务逻辑实现类 (含 Redis 缓存防穿透与防雪崩高并发保护)
 */
@Service
public class ProductServiceImpl implements ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductServiceImpl.class);

    private final ProductMapper productMapper;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public ProductServiceImpl(ProductMapper productMapper, StringRedisTemplate redisTemplate) {
        this.productMapper = productMapper;
        this.redisTemplate = redisTemplate;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public Page<Product> listProducts(int page, int size, String category, String keyword) {
        Page<Product> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<Product> queryWrapper = new LambdaQueryWrapper<>();

        if (category != null && !category.isBlank()) {
            queryWrapper.eq(Product::getCategory, category.trim());
        }
        if (keyword != null && !keyword.isBlank()) {
            queryWrapper.like(Product::getName, keyword.trim());
        }
        queryWrapper.orderByDesc(Product::getId);

        return productMapper.selectPage(pageParam, queryWrapper);
    }

    @Override
    public Product getProductById(Long id) {
        if (id == null) {
            return null;
        }

        String cacheKey = RedisConstants.PRODUCT_CACHE_PREFIX + id;

        try {
            // 1. 读取 Redis 缓存
            String cachedJson = redisTemplate.opsForValue().get(cacheKey);

            if (cachedJson != null) {
                // 缓存命中：检查是否为空值标记（防穿透设计）
                if (RedisConstants.NULL_CACHE_VALUE.equals(cachedJson)) {
                    log.debug("Redis 缓存防穿透拦截：商品 ID [{}] 命中空值缓存", id);
                    return null;
                }
                log.debug("Redis 缓存命中：商品 ID [{}]", id);
                return objectMapper.readValue(cachedJson, Product.class);
            }
        } catch (Exception e) {
            log.error("读取 Redis 缓存异常，降级直查数据库: {}", e.getMessage());
        }

        // 2. 缓存未命中，回源查询数据库
        log.info("Redis 缓存未命中，查询 MySQL 数据库，商品 ID [{}]", id);
        Product product = productMapper.selectById(id);

        try {
            if (product == null) {
                // 数据库无记录：写入短 TTL 的空值标记，防御高频不存在 ID 的恶意穿透
                redisTemplate.opsForValue().set(
                        cacheKey,
                        RedisConstants.NULL_CACHE_VALUE,
                        RedisConstants.NULL_CACHE_TTL_SECONDS,
                        TimeUnit.SECONDS
                );
                log.info("商品 ID [{}] 不存在，已向 Redis 写入空值标记 (TTL: {}s)", id, RedisConstants.NULL_CACHE_TTL_SECONDS);
                return null;
            }

            // 数据库存在：计算防雪崩随机抖动过期时间 (基准 3600s + 0~300s 随机)
            long jitter = ThreadLocalRandom.current().nextInt(0, RedisConstants.TTL_JITTER_MAX_SECONDS);
            long totalTtl = RedisConstants.PRODUCT_BASE_TTL_SECONDS + jitter;

            String jsonToCache = objectMapper.writeValueAsString(product);
            redisTemplate.opsForValue().set(cacheKey, jsonToCache, totalTtl, TimeUnit.SECONDS);
            log.info("商品 ID [{}] 已成功缓存至 Redis (总 TTL: {}s, 包含抖动: {}s)", id, totalTtl, jitter);
        } catch (Exception e) {
            log.error("写入 Redis 缓存异常: {}", e.getMessage());
        }

        return product;
    }

    @Override
    public void updateProduct(Product product) {
        if (product == null || product.getId() == null) {
            return;
        }
        productMapper.updateById(product);
        // 双写一致性：更新数据库后主动淘汰缓存
        String cacheKey = RedisConstants.PRODUCT_CACHE_PREFIX + product.getId();
        redisTemplate.delete(cacheKey);
        log.info("商品 ID [{}] 已更新，已主动淘汰 Redis 缓存", product.getId());
    }
}
