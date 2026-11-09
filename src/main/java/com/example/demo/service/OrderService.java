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
}
