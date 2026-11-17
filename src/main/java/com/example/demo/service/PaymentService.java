package com.example.demo.service;

import com.example.demo.model.vo.AlipayConfigStatusVO;
import com.example.demo.model.vo.AlipayPayCreateVO;
import com.example.demo.model.vo.OrderVO;

import java.util.Map;

/**
 * 支付与支付宝沙箱结算服务接口
 */
public interface PaymentService {

    /**
     * 获取当前支付宝沙箱配置就绪状态 (预演模式 / 真实沙箱网关模式)
     */
    AlipayConfigStatusVO getAlipayConfigStatus();

    /**
     * 为待支付订单创建支付宝沙箱收银台请求 (已配置密钥时返回完整 RSA2 加签跳转表单)
     *
     * @param userId  当前登录用户 ID
     * @param orderNo 唯一订单号
     * @return 收银台创建结果
     */
    AlipayPayCreateVO createAlipayOrder(Long userId, String orderNo);

    /**
     * 本地沙箱预演一键确认支付 (模拟支付宝异步回调将订单推进至 PAID 状态)
     *
     * @param userId  当前登录用户 ID
     * @param orderNo 唯一订单号
     * @return 更新后的订单详情
     */
    OrderVO sandboxConfirmPay(Long userId, String orderNo);

    /**
     * 处理支付宝沙箱服务器异步回调通知 (notify_url)
     *
     * @param params 回调表单参数
     * @return "success" 或 "failure"
     */
    String handleAlipayNotify(Map<String, String> params);
}
