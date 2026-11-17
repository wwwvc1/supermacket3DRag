package com.example.demo.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.common.exception.BusinessException;
import com.example.demo.config.AlipaySandboxProperties;
import com.example.demo.entity.Orders;
import com.example.demo.mapper.OrderMapper;
import com.example.demo.model.vo.AlipayConfigStatusVO;
import com.example.demo.model.vo.AlipayPayCreateVO;
import com.example.demo.model.vo.OrderVO;
import com.example.demo.service.OrderService;
import com.example.demo.service.PaymentService;
import com.example.demo.service.payment.AlipayRsa2Signer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeMap;

/**
 * 支付与支付宝沙箱结算业务实现类
 * <p>同时支持【支付宝沙箱真实 RSA2 签名表单跳转】与【沙箱预演闭环模式】，便于零外部密钥时先完成全链路联调，后续填入 APPID/密钥即无缝切换。</p>
 */
@Service
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);
    private static final DateTimeFormatter ALIPAY_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final OrderMapper orderMapper;
    private final OrderService orderService;
    private final AlipaySandboxProperties alipayProperties;
    private final ObjectMapper objectMapper;

    public PaymentServiceImpl(OrderMapper orderMapper,
                              OrderService orderService,
                              AlipaySandboxProperties alipayProperties) {
        this.orderMapper = orderMapper;
        this.orderService = orderService;
        this.alipayProperties = alipayProperties;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public AlipayConfigStatusVO getAlipayConfigStatus() {
        boolean configured = alipayProperties.isFullyConfigured();
        return new AlipayConfigStatusVO(
                alipayProperties.isEnabled(),
                configured,
                alipayProperties.isSandboxSimulationEnabled(),
                configured ? "ALIPAY_SANDBOX" : "SANDBOX_SIMULATION",
                alipayProperties.getGatewayUrl(),
                alipayProperties.getSignType()
        );
    }

    @Override
    public AlipayPayCreateVO createAlipayOrder(Long userId, String orderNo) {
        if (orderNo == null || orderNo.isBlank()) {
            throw new BusinessException(400, "订单编号不能为空");
        }
        Orders order = orderMapper.selectOne(new LambdaQueryWrapper<Orders>()
                .eq(Orders::getOrderNo, orderNo.trim()));
        if (order == null || !order.getUserId().equals(userId)) {
            throw new BusinessException(404, "订单不存在或无权支付: " + orderNo);
        }
        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new BusinessException(400, "当前订单状态不可发起支付: " + order.getStatus());
        }

        String subject = (order.getPaySubject() != null && !order.getPaySubject().isBlank())
                ? order.getPaySubject()
                : "KORA Tactile Archive · " + order.getOrderNo();
        String amountStr = order.getTotalAmount().setScale(2, RoundingMode.HALF_UP).toPlainString();

        AlipayPayCreateVO vo = new AlipayPayCreateVO();
        vo.setOrderNo(order.getOrderNo());
        vo.setSubject(subject);
        vo.setTotalAmount(order.getTotalAmount());
        vo.setGatewayUrl(alipayProperties.getGatewayUrl());
        vo.setNotifyUrl(alipayProperties.getNotifyUrl());
        vo.setReturnUrl(alipayProperties.getReturnUrl());

        if (alipayProperties.isFullyConfigured()) {
            String formHtml = buildSignedAlipayPageForm(order.getOrderNo(), amountStr, subject);
            vo.setConfigured(true);
            vo.setMode("ALIPAY_SANDBOX");
            vo.setPayFormHtml(formHtml);
            vo.setMessage("已生成支付宝沙箱 RSA2 加签支付表单，正在跳转沙箱收银台");
            log.info("订单 [{}] 已生成支付宝沙箱真实签名表单, 金额: ¥{}", orderNo, amountStr);
        } else {
            vo.setConfigured(false);
            vo.setMode("SANDBOX_SIMULATION");
            vo.setPayFormHtml(null);
            vo.setMessage("当前处于支付宝沙箱预演模式（填入 application.yaml 中的 alipay.app-id 与密钥即可自动切换为真实沙箱网关）");
            log.info("订单 [{}] 进入支付宝沙箱预演收银台, 金额: ¥{}", orderNo, amountStr);
        }

        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderVO sandboxConfirmPay(Long userId, String orderNo) {
        if (!alipayProperties.isSandboxSimulationEnabled()) {
            throw new BusinessException(403, "当前环境未开启沙箱预演付款通道，请通过真实支付宝沙箱网关完成付款");
        }
        if (orderNo == null || orderNo.isBlank()) {
            throw new BusinessException(400, "订单编号不能为空");
        }

        Orders order = orderMapper.selectOne(new LambdaQueryWrapper<Orders>()
                .eq(Orders::getOrderNo, orderNo.trim()));
        if (order == null || !order.getUserId().equals(userId)) {
            throw new BusinessException(404, "订单不存在或无权操作: " + orderNo);
        }
        if ("CANCELLED".equalsIgnoreCase(order.getStatus())) {
            throw new BusinessException(400, "订单已取消，请重新下单后支付");
        }

        if ("PENDING".equalsIgnoreCase(order.getStatus())) {
            String simTradeNo = "ALIPAY_SANDBOX_" + System.currentTimeMillis();
            order.setStatus("PAID");
            order.setPaymentMethod("ALIPAY_SANDBOX_SIM");
            order.setTradeNo(simTradeNo);
            order.setPaidAt(LocalDateTime.now());
            order.setUpdatedAt(LocalDateTime.now());
            orderMapper.updateById(order);
            log.info("订单 [{}] 完成支付宝沙箱预演付款，沙箱交易流水号: [{}]", orderNo, simTradeNo);
        }

        return orderService.getOrderByNo(userId, order.getOrderNo());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public String handleAlipayNotify(Map<String, String> params) {
        if (params == null || params.isEmpty()) {
            return "failure";
        }

        // 若已配置真实支付宝沙箱密钥，则严格执行 RSA2 公钥验签
        if (alipayProperties.isFullyConfigured()) {
            boolean verified = AlipayRsa2Signer.verify(params, alipayProperties.getAlipayPublicKey());
            if (!verified) {
                log.warn("支付宝异步回调验签失败，已拒绝处理: out_trade_no={}", params.get("out_trade_no"));
                return "failure";
            }
            String callbackAppId = params.get("app_id");
            if (callbackAppId != null && !callbackAppId.equals(alipayProperties.getAppId())) {
                log.warn("支付宝回调 app_id 不匹配: expected={}, actual={}", alipayProperties.getAppId(), callbackAppId);
                return "failure";
            }
        } else {
            log.warn("未启用真实支付宝密钥却收到 /notify 请求，拒绝未验签回调");
            return "failure";
        }

        String outTradeNo = params.get("out_trade_no");
        String tradeNo = params.get("trade_no");
        String tradeStatus = params.get("trade_status");
        String totalAmount = params.get("total_amount");

        if (outTradeNo == null || (!"TRADE_SUCCESS".equals(tradeStatus) && !"TRADE_FINISHED".equals(tradeStatus))) {
            return "success";
        }

        Orders order = orderMapper.selectOne(new LambdaQueryWrapper<Orders>()
                .eq(Orders::getOrderNo, outTradeNo.trim()));
        if (order == null) {
            log.warn("支付宝异步回调订单不存在: {}", outTradeNo);
            return "failure";
        }

        if (totalAmount != null) {
            try {
                BigDecimal callbackAmt = new BigDecimal(totalAmount);
                if (order.getTotalAmount().compareTo(callbackAmt) != 0) {
                    log.warn("支付宝回调金额与订单金额不一致: order={}, expected={}, actual={}",
                            outTradeNo, order.getTotalAmount(), totalAmount);
                    return "failure";
                }
            } catch (NumberFormatException e) {
                return "failure";
            }
        }

        // 幂等更新：仅当订单仍为 PENDING 时推进至 PAID
        if ("PENDING".equalsIgnoreCase(order.getStatus())) {
            order.setStatus("PAID");
            order.setPaymentMethod("ALIPAY_SANDBOX");
            order.setTradeNo(tradeNo);
            order.setPaidAt(LocalDateTime.now());
            order.setUpdatedAt(LocalDateTime.now());
            orderMapper.updateById(order);
            log.info("支付宝沙箱异步回调确认支付成功: orderNo={}, tradeNo={}", outTradeNo, tradeNo);
        }

        return "success";
    }

    /**
     * 构造符合支付宝开放平台 alipay.trade.page.pay 规范的自动提交 HTML 表单
     */
    private String buildSignedAlipayPageForm(String outTradeNo, String totalAmount, String subject) {
        Map<String, Object> bizContentMap = new LinkedHashMap<>();
        bizContentMap.put("out_trade_no", outTradeNo);
        bizContentMap.put("product_code", "FAST_INSTANT_TRADE_PAY");
        bizContentMap.put("total_amount", totalAmount);
        bizContentMap.put("subject", subject);

        String bizContentJson;
        try {
            bizContentJson = objectMapper.writeValueAsString(bizContentMap);
        } catch (Exception e) {
            throw new BusinessException(500, "序列化支付宝业务参数失败: " + e.getMessage());
        }

        Map<String, String> params = new TreeMap<>();
        params.put("app_id", alipayProperties.getAppId());
        params.put("method", "alipay.trade.page.pay");
        params.put("format", alipayProperties.getFormat());
        params.put("return_url", alipayProperties.getReturnUrl());
        params.put("charset", alipayProperties.getCharset());
        params.put("sign_type", alipayProperties.getSignType());
        params.put("timestamp", LocalDateTime.now().format(ALIPAY_TIME_FORMATTER));
        params.put("version", "1.0");
        params.put("notify_url", alipayProperties.getNotifyUrl());
        params.put("biz_content", bizContentJson);

        String sign = AlipayRsa2Signer.sign(params, alipayProperties.getPrivateKey());
        params.put("sign", sign);

        StringBuilder html = new StringBuilder();
        html.append("<form id=\"alipay_sandbox_form\" name=\"alipay_sandbox_form\" action=\"")
                .append(HtmlUtils.htmlEscape(alipayProperties.getGatewayUrl()))
                .append("?charset=").append(HtmlUtils.htmlEscape(alipayProperties.getCharset()))
                .append("\" method=\"POST\">");
        for (Map.Entry<String, String> entry : params.entrySet()) {
            html.append("<input type=\"hidden\" name=\"")
                    .append(HtmlUtils.htmlEscape(entry.getKey()))
                    .append("\" value=\"")
                    .append(HtmlUtils.htmlEscape(entry.getValue()))
                    .append("\"/>");
        }
        html.append("</form>");
        return html.toString();
    }
}
