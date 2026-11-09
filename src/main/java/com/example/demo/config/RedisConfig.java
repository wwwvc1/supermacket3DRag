package com.example.demo.config;

import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * Redis 与 Redisson 分布式锁核心配置类
 */
@Configuration
public class RedisConfig {

    @Value("${redisson.address:redis://127.0.0.1:6379}")
    private String redissonAddress;

    @Value("${redisson.password:}")
    private String redissonPassword;

    /**
     * 配置 RedissonClient 单机模式客户端
     */
    @Bean(destroyMethod = "shutdown")
    public RedissonClient redissonClient() {
        Config config = new Config();
        var singleServerConfig = config.useSingleServer()
                .setAddress(redissonAddress)
                .setTimeout(3000)
                .setConnectionPoolSize(16)
                .setConnectionMinimumIdleSize(4);

        if (redissonPassword != null && !redissonPassword.isBlank()) {
            singleServerConfig.setPassword(redissonPassword);
        }

        return Redisson.create(config);
    }

    /**
     * 配置 StringRedisTemplate 便于缓存高频文本与 JSON 字符串
     */
    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory redisConnectionFactory) {
        return new StringRedisTemplate(redisConnectionFactory);
    }
}
