package com.example.demo.common.constant;

/**
 * 系统 Redis 键前缀与高并发缓存常量
 */
public final class RedisConstants {

    private RedisConstants() {
    }

    /**
     * 商品详情缓存 Key 前缀 (ecommerce:product:{id})
     */
    public static final String PRODUCT_CACHE_PREFIX = "ecommerce:product:";

    /**
     * 防穿透空值缓存标记
     */
    public static final String NULL_CACHE_VALUE = "{}";

    /**
     * 防穿透空值缓存 TTL (60 秒)
     */
    public static final long NULL_CACHE_TTL_SECONDS = 60L;

    /**
     * 商品详情基准缓存 TTL (3600 秒 = 1 小时)
     */
    public static final long PRODUCT_BASE_TTL_SECONDS = 3600L;

    /**
     * 防雪崩随机抖动时间最大上限 (300 秒 = 5 分钟)
     */
    public static final int TTL_JITTER_MAX_SECONDS = 300;

    /**
     * 订单商品扣减库存 Redisson 分布式锁 Key 前缀 (lock:order:product:{productId})
     */
    public static final String ORDER_LOCK_PREFIX = "lock:order:product:";

    /**
     * 分布式锁最大等待时间 (秒)
     */
    public static final long LOCK_WAIT_TIME_SECONDS = 5L;

    /**
     * 分布式锁最长租约自动释放时间 (秒)
     */
    public static final long LOCK_LEASE_TIME_SECONDS = 10L;
}
