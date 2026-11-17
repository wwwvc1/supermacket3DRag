package com.example.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 支付宝沙箱支付配置属性 (后续接入支付宝开放平台沙箱时直接填入 APPID 与 RSA2 密钥即可切换为真实沙箱网关)
 */
@Component
@ConfigurationProperties(prefix = "alipay")
public class AlipaySandboxProperties {

    /**
     * 是否开启真实支付宝沙箱签名与网关跳转 (false 时使用 SANDBOX_SIMULATION 预演模式)
     */
    private boolean enabled = false;

    /**
     * 是否允许前端调用沙箱模拟付款接口 (仅用于本地联调/沙箱测试)
     */
    private boolean sandboxSimulationEnabled = true;

    /**
     * 支付宝开放平台沙箱 APPID
     */
    private String appId = "";

    /**
     * 商户应用私钥 (PKCS8 PEM 或纯 Base64 字符串)
     */
    private String privateKey = "";

    /**
     * 支付宝沙箱公钥 (X.509 PEM 或纯 Base64 字符串，用于异步回调验签)
     */
    private String alipayPublicKey = "";

    /**
     * 支付宝沙箱开放网关地址
     */
    private String gatewayUrl = "https://openapi-sandbox.dl.gateway.alipaydev.com/gateway.do";

    /**
     * 支付宝异步通知回调地址 (POST /api/payment/alipay/notify)
     */
    private String notifyUrl = "http://localhost:8080/api/payment/alipay/notify";

    /**
     * 支付宝同步跳转回跳地址
     */
    private String returnUrl = "http://localhost:5173/?pay_status=success";

    /**
     * 签名算法类型 (固定 RSA2 / SHA256withRSA)
     */
    private String signType = "RSA2";

    /**
     * 编码格式
     */
    private String charset = "UTF-8";

    /**
     * 数据格式
     */
    private String format = "json";

    /**
     * 判断是否已完成支付宝沙箱真实密钥配置
     */
    public boolean isFullyConfigured() {
        return enabled
                && appId != null && !appId.isBlank()
                && privateKey != null && !privateKey.isBlank()
                && alipayPublicKey != null && !alipayPublicKey.isBlank();
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isSandboxSimulationEnabled() {
        return sandboxSimulationEnabled;
    }

    public void setSandboxSimulationEnabled(boolean sandboxSimulationEnabled) {
        this.sandboxSimulationEnabled = sandboxSimulationEnabled;
    }

    public String getAppId() {
        return appId;
    }

    public void setAppId(String appId) {
        this.appId = appId;
    }

    public String getPrivateKey() {
        return privateKey;
    }

    public void setPrivateKey(String privateKey) {
        this.privateKey = privateKey;
    }

    public String getAlipayPublicKey() {
        return alipayPublicKey;
    }

    public void setAlipayPublicKey(String alipayPublicKey) {
        this.alipayPublicKey = alipayPublicKey;
    }

    public String getGatewayUrl() {
        return gatewayUrl;
    }

    public void setGatewayUrl(String gatewayUrl) {
        this.gatewayUrl = gatewayUrl;
    }

    public String getNotifyUrl() {
        return notifyUrl;
    }

    public void setNotifyUrl(String notifyUrl) {
        this.notifyUrl = notifyUrl;
    }

    public String getReturnUrl() {
        return returnUrl;
    }

    public void setReturnUrl(String returnUrl) {
        this.returnUrl = returnUrl;
    }

    public String getSignType() {
        return signType;
    }

    public void setSignType(String signType) {
        this.signType = signType;
    }

    public String getCharset() {
        return charset;
    }

    public void setCharset(String charset) {
        this.charset = charset;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }
}
