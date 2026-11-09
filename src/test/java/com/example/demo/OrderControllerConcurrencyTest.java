package com.example.demo;

import com.example.demo.entity.Product;
import com.example.demo.mapper.ProductMapper;
import com.example.demo.model.dto.CreateOrderDTO;
import com.example.demo.model.dto.OrderItemDTO;
import com.example.demo.service.OrderService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class OrderControllerConcurrencyTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private ProductMapper productMapper;

    @Test
    @DisplayName("Redisson 分布式锁高并发防超卖压测：10 线程并发争抢 3 件库存")
    void testOrderConcurrencyWithRedissonLock() throws InterruptedException {
        // 1. 初始化一件秒杀商品，设定初始库存仅为 3 件
        Product seckillProduct = new Product(
                null,
                "限量秒杀商品-" + System.currentTimeMillis(),
                "秒杀专区",
                new BigDecimal("99.00"),
                3,
                "高并发测试库存超卖商品"
        );
        productMapper.insert(seckillProduct);
        Long productId = seckillProduct.getId();

        int threadCount = 10;
        ExecutorService executorService = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            final long userId = 1000L + i;
            executorService.submit(() -> {
                readyLatch.countDown();
                try {
                    // 等待所有线程准备就绪，同时发令起跑
                    startLatch.await();

                    CreateOrderDTO orderDTO = new CreateOrderDTO(List.of(new OrderItemDTO(productId, 1)));
                    orderService.createOrder(userId, orderDTO);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failCount.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await();
        // 瞬间并发触发
        startLatch.countDown();
        doneLatch.await();
        executorService.shutdown();

        // 2. 严格断言并发结果
        assertEquals(3, successCount.get(), "在 Redisson 锁保护下，仅能成功创建 3 笔订单");
        assertEquals(7, failCount.get(), "其余 7 个并发请求应被安全拦截");

        // 3. 校验数据库最终剩余库存准确为 0，绝对无负库存
        Product finalProduct = productMapper.selectById(productId);
        assertNotNull(finalProduct);
        assertEquals(0, finalProduct.getStock(), "数据库最终库存必须准确为 0，无任何超卖");
    }
}
