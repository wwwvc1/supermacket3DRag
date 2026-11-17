package com.example.demo.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.demo.common.constant.RedisConstants;
import com.example.demo.common.exception.BusinessException;
import com.example.demo.entity.CartItem;
import com.example.demo.entity.OrderItem;
import com.example.demo.entity.Orders;
import com.example.demo.entity.Product;
import com.example.demo.mapper.CartItemMapper;
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
    private final CartItemMapper cartItemMapper;
    private final RedissonClient redissonClient;
    private final StringRedisTemplate redisTemplate;
    private final SupermarketEventPublisher eventPublisher;

    public OrderServiceImpl(OrderMapper orderMapper,
                            OrderItemMapper orderItemMapper,
                            ProductMapper productMapper,
                            CartItemMapper cartItemMapper,
                            RedissonClient redissonClient,
                            StringRedisTemplate redisTemplate,
                            SupermarketEventPublisher eventPublisher) {
        this.orderMapper = orderMapper;
        this.orderItemMapper = orderItemMapper;
        this.productMapper = productMapper;
        this.cartItemMapper = cartItemMapper;
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

            // 生成唯一订单号并保存订单 (预设支付宝沙箱待支付标题与状态)
            String orderNo = "ORD" + System.currentTimeMillis() + ThreadLocalRandom.current().nextInt(1000, 9999);
            String subject = buildPaySubject(orderItemsToSave);
            Orders order = new Orders(orderNo, userId, totalAmount, "PENDING");
            order.setPaymentMethod("UNPAID");
            order.setPaySubject(subject);
            orderMapper.insert(order);

            // 保存订单明细项并汇总本次已购买的商品 ID
            List<OrderItemVO> itemVOList = new ArrayList<>();
            List<Long> purchasedProductIds = new ArrayList<>();
            for (OrderItem orderItem : orderItemsToSave) {
                orderItem.setOrderId(order.getId());
                orderItemMapper.insert(orderItem);
                purchasedProductIds.add(orderItem.getProductId());

                itemVOList.add(new OrderItemVO(
                        orderItem.getId(),
                        orderItem.getProductId(),
                        orderItem.getProductName(),
                        orderItem.getPrice(),
                        orderItem.getQuantity()
                ));
            }

            // 下单成功后自动清理用户购物车中对应已购买商品
            if (!purchasedProductIds.isEmpty() && userId != null) {
                cartItemMapper.delete(new LambdaQueryWrapper<CartItem>()
                        .eq(CartItem::getUserId, userId)
                        .in(CartItem::getProductId, purchasedProductIds));
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
            return toOrderVO(order, itemVOList);

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
            List<OrderItemVO> itemVOList = loadOrderItemVOs(order.getId());
            voList.add(toOrderVO(order, itemVOList));
        }

        Page<OrderVO> resultPage = new Page<>(ordersPage.getCurrent(), ordersPage.getSize(), ordersPage.getTotal());
        resultPage.setRecords(voList);
        return resultPage;
    }

    @Override
    public OrderVO getOrderByNo(Long userId, String orderNo) {
        if (orderNo == null || orderNo.isBlank()) {
            throw new BusinessException(400, "订单编号不能为空");
        }
        Orders order = orderMapper.selectOne(new LambdaQueryWrapper<Orders>()
                .eq(Orders::getOrderNo, orderNo.trim()));
        if (order == null || !order.getUserId().equals(userId)) {
            throw new BusinessException(404, "订单不存在或无权查看: " + orderNo);
        }
        return toOrderVO(order, loadOrderItemVOs(order.getId()));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderVO cancelOrder(Long userId, String orderNo) {
        if (orderNo == null || orderNo.isBlank()) {
            throw new BusinessException(400, "订单编号不能为空");
        }
        Orders order = orderMapper.selectOne(new LambdaQueryWrapper<Orders>()
                .eq(Orders::getOrderNo, orderNo.trim()));
        if (order == null || !order.getUserId().equals(userId)) {
            throw new BusinessException(404, "订单不存在或无权操作: " + orderNo);
        }
        if ("PAID".equalsIgnoreCase(order.getStatus())) {
            throw new BusinessException(400, "已支付订单暂不支持直接取消，后续可通过支付宝退款接口原路退回");
        }
        if ("CANCELLED".equalsIgnoreCase(order.getStatus())) {
            return toOrderVO(order, loadOrderItemVOs(order.getId()));
        }

        List<OrderItem> items = orderItemMapper.selectList(new LambdaQueryWrapper<OrderItem>()
                .eq(OrderItem::getOrderId, order.getId())
                .orderByAsc(OrderItem::getProductId));

        List<RLock> acquiredLocks = new ArrayList<>();
        List<long[]> restoredProducts = new ArrayList<>();
        try {
            for (OrderItem item : items) {
                String lockKey = RedisConstants.ORDER_LOCK_PREFIX + item.getProductId();
                RLock lock = redissonClient.getLock(lockKey);
                boolean locked = lock.tryLock(
                        RedisConstants.LOCK_WAIT_TIME_SECONDS,
                        RedisConstants.LOCK_LEASE_TIME_SECONDS,
                        TimeUnit.SECONDS
                );
                if (!locked) {
                    throw new BusinessException(429, "库存锁定繁忙，请稍后重试取消订单");
                }
                acquiredLocks.add(lock);

                productMapper.restoreStock(item.getProductId(), item.getQuantity());
                redisTemplate.delete(RedisConstants.PRODUCT_CACHE_PREFIX + item.getProductId());

                Product latest = productMapper.selectById(item.getProductId());
                if (latest != null) {
                    restoredProducts.add(new long[]{latest.getId(), latest.getStock()});
                }
            }

            order.setStatus("CANCELLED");
            order.setUpdatedAt(LocalDateTime.now());
            orderMapper.updateById(order);

            for (long[] entry : restoredProducts) {
                try {
                    eventPublisher.publishInventoryChanged(entry[0], (int) entry[1]);
                } catch (Exception e) {
                    log.warn("取消订单 [{}] 触发 WebSocket 库存回滚广播失败: {}", orderNo, e.getMessage());
                }
            }

            log.info("用户 [{}] 已取消待支付订单 [{}]，已安全释放 {} 项商品库存", userId, orderNo, restoredProducts.size());
            return toOrderVO(order, toItemVOs(items));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException(500, "取消订单操作被意外中断");
        } finally {
            for (RLock lock : acquiredLocks) {
                if (lock.isHeldByCurrentThread()) {
                    lock.unlock();
                }
            }
        }
    }

    /**
     * 组装支付收银台订单标题
     */
    private String buildPaySubject(List<OrderItem> items) {
        if (items == null || items.isEmpty()) {
            return "KORA Tactile Archive 精选订单";
        }
        String first = items.get(0).getProductName();
        return items.size() > 1
                ? "KORA · " + first + " 等 " + items.size() + " 件藏品"
                : "KORA · " + first;
    }

    private List<OrderItemVO> loadOrderItemVOs(Long orderId) {
        List<OrderItem> items = orderItemMapper.selectList(new LambdaQueryWrapper<OrderItem>()
                .eq(OrderItem::getOrderId, orderId));
        return toItemVOs(items);
    }

    private List<OrderItemVO> toItemVOs(List<OrderItem> items) {
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
        return itemVOList;
    }

    private OrderVO toOrderVO(Orders order, List<OrderItemVO> itemVOList) {
        OrderVO vo = new OrderVO(
                order.getId(),
                order.getOrderNo(),
                order.getUserId(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getCreatedAt(),
                itemVOList
        );
        vo.setPaymentMethod(order.getPaymentMethod());
        vo.setTradeNo(order.getTradeNo());
        vo.setPaidAt(order.getPaidAt());
        vo.setPaySubject(order.getPaySubject());
        return vo;
    }
}
