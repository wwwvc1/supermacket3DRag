package com.example.demo.model.vo;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 支付宝沙箱收银台创建响应 VO
 */
public class AlipayPayCreateVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String orderNo;
    private String subject;
    private BigDecimal totalAmount;
    private String mode;
    private boolean configured;
    private String gatewayUrl;
    private String payFormHtml;
    private String notifyUrl;
    private String returnUrl;
    private String message;

    public AlipayPayCreateVO() {
    }

    public String getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public boolean isConfigured() {
        return configured;
    }

    public void setConfigured(boolean configured) {
        this.configured = configured;
    }

    public String getGatewayUrl() {
        return gatewayUrl;
    }

    public void setGatewayUrl(String gatewayUrl) {
        this.gatewayUrl = gatewayUrl;
    }

    public String getPayFormHtml() {
        return payFormHtml;
    }

    public void setPayFormHtml(String payFormHtml) {
        this.payFormHtml = payFormHtml;
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

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
