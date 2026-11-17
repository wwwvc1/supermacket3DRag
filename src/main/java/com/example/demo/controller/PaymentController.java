package com.example.demo.controller;

import com.example.demo.common.result.Result;
import com.example.demo.model.dto.AlipayPayRequestDTO;
import com.example.demo.model.vo.AlipayConfigStatusVO;
import com.example.demo.model.vo.AlipayPayCreateVO;
import com.example.demo.model.vo.OrderVO;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.OrderService;
import com.example.demo.service.PaymentService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 支付与支付宝沙箱接入控制器
 */
@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private final PaymentService paymentService;
    private final OrderService orderService;

    public PaymentController(PaymentService paymentService, OrderService orderService) {
        this.paymentService = paymentService;
        this.orderService = orderService;
    }

    /**
     * 获取当前支付宝沙箱配置就绪状态 (前端据此展示预演收银台或真实沙箱网关)
     */
    @GetMapping("/alipay/config-status")
    public Result<AlipayConfigStatusVO> getAlipayConfigStatus() {
        return Result.success(paymentService.getAlipayConfigStatus());
    }

    /**
     * 发起支付宝沙箱支付 (生成收银台表单或预演结算凭据)
     */
    @PostMapping("/alipay/create")
    public Result<AlipayPayCreateVO> createAlipayOrder(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                       @RequestBody AlipayPayRequestDTO request) {
        AlipayPayCreateVO vo = paymentService.createAlipayOrder(userPrincipal.getUserId(), request.getOrderNo());
        return Result.success(vo);
    }

    /**
     * 沙箱预演一键完成支付 (模拟支付宝沙箱回调完成闭环付款)
     */
    @PostMapping("/alipay/sandbox-confirm")
    public Result<OrderVO> sandboxConfirmPay(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                             @RequestBody AlipayPayRequestDTO request) {
        OrderVO updatedOrder = paymentService.sandboxConfirmPay(userPrincipal.getUserId(), request.getOrderNo());
        return Result.success(updatedOrder);
    }

    /**
     * 支付宝沙箱服务器异步回调接口 (notify_url，返回纯文本 "success" / "failure")
     */
    @PostMapping("/alipay/notify")
    public String handleAlipayNotify(@RequestParam Map<String, String> params) {
        return paymentService.handleAlipayNotify(params);
    }

    /**
     * 轮询查询订单支付结果
     */
    @GetMapping("/orders/{orderNo}")
    public Result<OrderVO> queryOrderPaymentStatus(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                   @PathVariable String orderNo) {
        return Result.success(orderService.getOrderByNo(userPrincipal.getUserId(), orderNo));
    }
}
