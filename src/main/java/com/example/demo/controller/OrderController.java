package com.example.demo.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.demo.common.result.Result;
import com.example.demo.model.dto.CreateOrderDTO;
import com.example.demo.model.vo.OrderVO;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.OrderService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 订单控制器
 */
@RestController
@RequestMapping("/api/order")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * 下单创建订单 (由 Redisson 分布式锁严格防超卖)
     */
    @PostMapping("/create")
    public Result<OrderVO> createOrder(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                       @RequestBody CreateOrderDTO dto) {
        OrderVO orderVO = orderService.createOrder(userPrincipal.getUserId(), dto);
        return Result.success(orderVO);
    }

    /**
     * 分页查询当前用户的所有订单
     */
    @GetMapping("/my-orders")
    public Result<Page<OrderVO>> listUserOrders(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                @RequestParam(defaultValue = "1") int page,
                                                @RequestParam(defaultValue = "10") int size) {
        Page<OrderVO> orderPage = orderService.listUserOrders(userPrincipal.getUserId(), page, size);
        return Result.success(orderPage);
    }
}
