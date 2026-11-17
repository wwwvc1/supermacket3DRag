package com.example.demo.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.demo.model.dto.CreateOrderDTO;
import com.example.demo.model.vo.OrderVO;

/**
 * 订单服务接口
 */
public interface OrderService {

    /**
     * 下单创建订单 (基于 Redisson 分布式锁严格控制并发与库存防超卖)
     *
     * @param userId 下单用户 ID
     * @param dto    订单项明细
     * @return 创建成功的订单详情 VO
     */
    OrderVO createOrder(Long userId, CreateOrderDTO dto);

    /**
     * 分页查询当前用户的历史订单
     *
     * @param userId 用户 ID
     * @param page   页码
     * @param size   每页数量
     * @return 订单分页
     */
    Page<OrderVO> listUserOrders(Long userId, int page, int size);

    /**
     * 根据订单流水号查询当前用户的订单详情
     *
     * @param userId  用户 ID
     * @param orderNo 唯一订单号
     * @return 订单详情 VO
     */
    OrderVO getOrderByNo(Long userId, String orderNo);

    /**
     * 取消待支付订单 (在 Redisson 分布式锁保护下安全回滚商品库存并广播实时库存恢复)
     *
     * @param userId  当前用户 ID
     * @param orderNo 待取消的订单号
     * @return 更新后的订单详情 VO
     */
    OrderVO cancelOrder(Long userId, String orderNo);
}
