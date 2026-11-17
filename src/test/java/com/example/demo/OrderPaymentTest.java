package com.example.demo;

import com.example.demo.common.result.Result;
import com.example.demo.controller.OrderController;
import com.example.demo.controller.PaymentController;
import com.example.demo.entity.Product;
import com.example.demo.mapper.ProductMapper;
import com.example.demo.model.dto.AlipayPayRequestDTO;
import com.example.demo.model.dto.CreateOrderDTO;
import com.example.demo.model.dto.LoginDTO;
import com.example.demo.model.dto.OrderItemDTO;
import com.example.demo.model.vo.AlipayConfigStatusVO;
import com.example.demo.model.vo.AlipayPayCreateVO;
import com.example.demo.model.vo.LoginVO;
import com.example.demo.model.vo.OrderVO;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.UserService;
import com.example.demo.service.payment.AlipayRsa2Signer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 订单生命周期、401 安全拦截、展厅种子同步与支付宝沙箱预接入完整闭环测试
 */
@SpringBootTest
class OrderPaymentTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private UserService userService;

    @Autowired
    private OrderController orderController;

    @Autowired
    private PaymentController paymentController;

    @Autowired
    private ProductMapper productMapper;

    @Test
    @DisplayName("校验展厅 02/03/04 种子商品已通过 DatabaseSchemaSyncRunner 与 data.sql 完整落库")
    void testShowroomProductsSyncedInDatabase() {
        Product garment = productMapper.selectById(101L);
        Product tech = productMapper.selectById(201L);
        Product vitrine = productMapper.selectById(301L);

        assertNotNull(garment, "Stage I 服装商品 101 必须存在于数据库");
        assertEquals("STAGE_RAIL", garment.getShowroomStage());
        assertNotNull(tech, "Stage II 数码商品 201 必须存在于数据库");
        assertEquals("STAGE_TECH", tech.getShowroomStage());
        assertEquals("/products/samsung-s22-ultra.png", tech.getImageUrl());
        assertNotNull(vitrine, "Stage III 典藏展柜商品 301 必须存在于数据库");
        assertEquals("STAGE_VITRINE", vitrine.getShowroomStage());
        assertEquals("/products/moutai-feitian.jpg", vitrine.getImageUrl());
    }

    @Test
    @DisplayName("校验未登录访问受保护接口返回标准 HTTP 401 JSON，携带 JWT /api/auth/me 正常返回用户信息")
    void testSecurityUnauthorizedJsonAndAuthMe() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        mockMvc.perform(post("/api/payment/alipay/create")
                        .contentType("application/json")
                        .content("{\"orderNo\":\"ORD123\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(401));

        LoginVO login = userService.login(new LoginDTO("testuser", "123456"));
        assertNotNull(login.getToken());

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + login.getToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.username").value("testuser"));
    }

    @Test
    @DisplayName("测试下单 -> 支付宝沙箱收银台创建 -> 沙箱预演支付成功 -> 取消待支付订单库存回滚全闭环")
    void testOrderAlipaySandboxLifecycleAndCancelRollback() {
        UserPrincipal principal = new UserPrincipal(1L, "testuser");

        // 1. 校验支付宝沙箱预接入状态
        Result<AlipayConfigStatusVO> cfgRes = paymentController.getAlipayConfigStatus();
        assertEquals(200, cfgRes.getCode());
        assertEquals("SANDBOX_SIMULATION", cfgRes.getData().getMode());
        assertTrue(cfgRes.getData().isSandboxSimulationEnabled());

        // 2. 下单购买 Stage II 数码产品 201 (库存减 1)
        Product before = productMapper.selectById(201L);
        int stockBefore = before.getStock();

        Result<OrderVO> createRes = orderController.createOrder(
                principal,
                new CreateOrderDTO(List.of(new OrderItemDTO(201L, 1)))
        );
        assertEquals(200, createRes.getCode());
        OrderVO order = createRes.getData();
        assertEquals("PENDING", order.getStatus());
        assertEquals("UNPAID", order.getPaymentMethod());
        assertEquals(stockBefore - 1, productMapper.selectById(201L).getStock());

        // 3. 发起支付宝沙箱收银台创建并执行沙箱预演付款确认
        Result<AlipayPayCreateVO> payCreateRes = paymentController.createAlipayOrder(
                principal,
                new AlipayPayRequestDTO(order.getOrderNo())
        );
        assertEquals(200, payCreateRes.getCode());
        assertEquals(order.getOrderNo(), payCreateRes.getData().getOrderNo());

        Result<OrderVO> paidRes = paymentController.sandboxConfirmPay(
                principal,
                new AlipayPayRequestDTO(order.getOrderNo())
        );
        assertEquals(200, paidRes.getCode());
        assertEquals("PAID", paidRes.getData().getStatus());
        assertEquals("ALIPAY_SANDBOX_SIM", paidRes.getData().getPaymentMethod());
        assertNotNull(paidRes.getData().getTradeNo());
        assertNotNull(paidRes.getData().getPaidAt());

        // 已支付订单不可取消
        assertThrows(RuntimeException.class, () -> orderController.cancelOrder(principal, order.getOrderNo()));

        // 4. 再创建一笔待支付订单后取消 -> 验证库存准确回滚
        Result<OrderVO> orderToCancelRes = orderController.createOrder(
                principal,
                new CreateOrderDTO(List.of(new OrderItemDTO(201L, 2)))
        );
        String cancelOrderNo = orderToCancelRes.getData().getOrderNo();
        assertEquals(stockBefore - 3, productMapper.selectById(201L).getStock());

        Result<OrderVO> cancelledRes = orderController.cancelOrder(principal, cancelOrderNo);
        assertEquals("CANCELLED", cancelledRes.getData().getStatus());
        assertEquals(stockBefore - 1, productMapper.selectById(201L).getStock());
    }

    @Test
    @DisplayName("测试支付宝 RSA2 (SHA256withRSA) 加签与防篡改验签工具")
    void testAlipayRsa2SignerRoundTrip() throws Exception {
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
        keyGen.initialize(2048);
        KeyPair pair = keyGen.generateKeyPair();
        String privateKeyB64 = Base64.getEncoder().encodeToString(pair.getPrivate().getEncoded());
        String publicKeyB64 = Base64.getEncoder().encodeToString(pair.getPublic().getEncoded());

        Map<String, String> params = new TreeMap<>();
        params.put("app_id", "9021000123456789");
        params.put("out_trade_no", "ORD202611170001");
        params.put("total_amount", "8999.00");
        params.put("trade_status", "TRADE_SUCCESS");
        params.put("sign_type", "RSA2");

        // 1. 主动支付请求加签 (包含 sign_type)
        String reqSign = AlipayRsa2Signer.sign(params, privateKeyB64, false);
        assertNotNull(reqSign);
        Map<String, String> reqVerify = new TreeMap<>(params);
        reqVerify.put("sign", reqSign);
        assertTrue(AlipayRsa2Signer.verify(reqVerify, publicKeyB64, false), "支付请求签名必须通过验签");

        // 2. 异步回调加签与验签 (按支付宝 notify_url 规范剔除 sign_type)
        String notifySign = AlipayRsa2Signer.sign(params, privateKeyB64, true);
        Map<String, String> notifyVerify = new TreeMap<>(params);
        notifyVerify.put("sign", notifySign);
        assertTrue(AlipayRsa2Signer.verify(notifyVerify, publicKeyB64), "合法 RSA2 异步回调签名必须通过公钥验签");

        // 篡改金额后必须验签失败
        notifyVerify.put("total_amount", "0.01");
        assertFalse(AlipayRsa2Signer.verify(notifyVerify, publicKeyB64), "篡改订单金额后 RSA2 验签必须拦截");
    }
}
