package com.example.demo.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.demo.common.constant.RedisConstants;
import com.example.demo.common.exception.BusinessException;
import com.example.demo.entity.OrderItem;
import com.example.demo.entity.Orders;
import com.example.demo.entity.Product;
import com.example.demo.mapper.OrderItemMapper;
import com.example.demo.mapper.OrderMapper;
import com.example.demo.mapper.ProductMapper;
import com.example.demo.model.dto.CreateOrderDTO;
import com.example.demo.model.dto.OrderItemDTO;
import com.example.demo.model.vo.OrderItemVO;
import com.example.demo.model.vo.OrderVO;
import com.example.demo.service.OrderService;
import com.example.demo.websocket.SupermarketEventPublisher;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

/**
 * 订单业务实现类 (集成 Redisson 分布式锁防商品超卖 & 3D 数字孪生超市库存实时联动)
 */
@Service
public class OrderServiceImpl implements OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderServiceImpl.class);

    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final ProductMapper productMapper;
    private final RedissonClient redissonClient;
    private final StringRedisTemplate redisTemplate;
    private final SupermarketEventPublisher eventPublisher;

    public OrderServiceImpl(OrderMapper orderMapper,
                            OrderItemMapper orderItemMapper,
                            ProductMapper productMapper,
                            RedissonClient redissonClient,
                            StringRedisTemplate redisTemplate,
                            SupermarketEventPublisher eventPublisher) {
        this.orderMapper = orderMapper;
        this.orderItemMapper = orderItemMapper;
        this.productMapper = productMapper;
        this.redissonClient = redissonClient;
        this.redisTemplate = redisTemplate;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderVO createOrder(Long userId, CreateOrderDTO dto) {
        if (dto == null || dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new BusinessException(400, "订单商品列表不能为空");
        }

        // 按商品 ID 升序排序，避免并发多商品锁定时的死锁发生
        List<OrderItemDTO> sortedItems = new ArrayList<>(dto.getItems());
        sortedItems.sort(Comparator.comparing(OrderItemDTO::getProductId));

        List<RLock> acquiredLocks = new ArrayList<>();
        List<OrderItem> orderItemsToSave = new ArrayList<>();
        List<long[]> deductedProducts = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        try {
            // 依次获取每个商品的 Redisson 分布式锁
            for (OrderItemDTO itemDto : sortedItems) {
                if (itemDto.getQuantity() == null || itemDto.getQuantity() <= 0) {
                    throw new BusinessException(400, "购买数量必须大于0");
                }

                String lockKey = RedisConstants.ORDER_LOCK_PREFIX + itemDto.getProductId();
                RLock lock = redissonClient.getLock(lockKey);

                log.info("用户 [{}] 尝试获取商品 [{}] 分布式锁: {}", userId, itemDto.getProductId(), lockKey);
                boolean locked = lock.tryLock(
                        RedisConstants.LOCK_WAIT_TIME_SECONDS,
                        RedisConstants.LOCK_LEASE_TIME_SECONDS,
                        TimeUnit.SECONDS
                );

                if (!locked) {
                    log.warn("用户 [{}] 获取商品 [{}] 分布式锁超时", userId, itemDto.getProductId());
                    throw new BusinessException(429, "当前商品争抢火爆，请稍后再试");
                }

                acquiredLocks.add(lock);

                // 在锁的保护下校验库存并执行原子扣减
                Product product = productMapper.selectById(itemDto.getProductId());
                if (product == null) {
                    throw new BusinessException(404, "商品不存在，ID: " + itemDto.getProductId());
                }
                if (product.getStock() < itemDto.getQuantity()) {
                    log.warn("商品 [{}] 库存不足，当前库存: {}, 请求购买量: {}",
                            product.getName(), product.getStock(), itemDto.getQuantity());
                    throw new BusinessException(400, "商品库存不足: " + product.getName() + "，剩余: " + product.getStock());
                }

                // 原子扣减库存
                int rows = productMapper.deductStock(product.getId(), itemDto.getQuantity());
                if (rows <= 0) {
                    log.warn("商品 [{}] 原子扣减失败 (并发冲突导致库存不足)", product.getName());
                    throw new BusinessException(400, "商品库存不足，购买失败: " + product.getName());
                }

                // 主动清理该商品的 Redis 缓存，保证数据一致性
                redisTemplate.delete(RedisConstants.PRODUCT_CACHE_PREFIX + product.getId());

                int remainingStock = product.getStock() - itemDto.getQuantity();
                deductedProducts.add(new long[]{product.getId(), remainingStock});

                BigDecimal subtotal = product.getPrice().multiply(new BigDecimal(itemDto.getQuantity()));
                totalAmount = totalAmount.add(subtotal);

                OrderItem orderItem = new OrderItem(
                        null,
                        product.getId(),
                        product.getName(),
                        product.getPrice(),
                        itemDto.getQuantity()
                );
                orderItemsToSave.add(orderItem);
            }

            // 生成唯一订单号并保存订单
            String orderNo = "ORD" + System.currentTimeMillis() + ThreadLocalRandom.current().nextInt(1000, 9999);
            Orders order = new Orders(orderNo, userId, totalAmount, "PENDING");
            orderMapper.insert(order);

            // 保存订单明细项
            List<OrderItemVO> itemVOList = new ArrayList<>();
            for (OrderItem orderItem : orderItemsToSave) {
                orderItem.setOrderId(order.getId());
                orderItemMapper.insert(orderItem);

                itemVOList.add(new OrderItemVO(
                        orderItem.getId(),
                        orderItem.getProductId(),
                        orderItem.getProductName(),
                        orderItem.getPrice(),
                        orderItem.getQuantity()
                ));
            }

            // 3D 数字孪生超市库存实时变动广播与货架状态联动
            for (long[] item : deductedProducts) {
                try {
                    eventPublisher.publishInventoryChanged(item[0], (int) item[1]);
                } catch (Exception e) {
                    log.warn("订单 [{}] 触发 3D 超市实时库存广播异常: {}", orderNo, e.getMessage());
                }
            }

            log.info("用户 [{}] 成功下单，订单编号: [{}], 总金额: [{}]", userId, orderNo, totalAmount);
            return new OrderVO(
                    order.getId(),
                    order.getOrderNo(),
                    order.getUserId(),
                    order.getTotalAmount(),
                    order.getStatus(),
                    order.getCreatedAt(),
                    itemVOList
            );

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException(500, "订单处理被意外中断");
        } finally {
            // 安全释放所有已持有的 Redisson 锁
            for (RLock lock : acquiredLocks) {
                if (lock.isHeldByCurrentThread()) {
                    lock.unlock();
                    log.info("安全释放分布式锁: {}", lock.getName());
                }
            }
        }
    }

    @Override
    public Page<OrderVO> listUserOrders(Long userId, int page, int size) {
        Page<Orders> pageParam = new Page<>(page, size);
        Page<Orders> ordersPage = orderMapper.selectPage(pageParam, new LambdaQueryWrapper<Orders>()
                .eq(Orders::getUserId, userId)
                .orderByDesc(Orders::getId));

        List<OrderVO> voList = new ArrayList<>();
        for (Orders order : ordersPage.getRecords()) {
            List<OrderItem> items = orderItemMapper.selectList(new LambdaQueryWrapper<OrderItem>()
                    .eq(OrderItem::getOrderId, order.getId()));

            List<OrderItemVO> itemVOList = new ArrayList<>();
            for (OrderItem item : items) {
                itemVOList.add(new OrderItemVO(
                        item.getId(),
                        item.getProductId(),
                        item.getProductName(),
                        item.getPrice(),
                        item.getQuantity()
                ));
            }

            voList.add(new OrderVO(
                    order.getId(),
                    order.getOrderNo(),
                    order.getUserId(),
                    order.getTotalAmount(),
                    order.getStatus(),
                    order.getCreatedAt(),
                    itemVOList
            ));
        }

        Page<OrderVO> resultPage = new Page<>(ordersPage.getCurrent(), ordersPage.getSize(), ordersPage.getTotal());
        resultPage.setRecords(voList);
        return resultPage;
    }
}
