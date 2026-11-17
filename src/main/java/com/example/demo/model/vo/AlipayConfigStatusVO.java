package com.example.demo.model.vo;

import java.io.Serializable;

/**
 * 支付宝沙箱环境就绪状态视图对象 (不泄露私钥/公钥内容)
 */
public class AlipayConfigStatusVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private boolean enabled;
    private boolean configured;
    private boolean sandboxSimulationEnabled;
    private String mode;
    private String gatewayUrl;
    private String signType;

    public AlipayConfigStatusVO() {
    }

    public AlipayConfigStatusVO(boolean enabled, boolean configured, boolean sandboxSimulationEnabled,
                                String mode, String gatewayUrl, String signType) {
        this.enabled = enabled;
        this.configured = configured;
        this.sandboxSimulationEnabled = sandboxSimulationEnabled;
        this.mode = mode;
        this.gatewayUrl = gatewayUrl;
        this.signType = signType;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isConfigured() {
        return configured;
    }

    public void setConfigured(boolean configured) {
        this.configured = configured;
    }

    public boolean isSandboxSimulationEnabled() {
        return sandboxSimulationEnabled;
    }

    public void setSandboxSimulationEnabled(boolean sandboxSimulationEnabled) {
        this.sandboxSimulationEnabled = sandboxSimulationEnabled;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getGatewayUrl() {
        return gatewayUrl;
    }

    public void setGatewayUrl(String gatewayUrl) {
        this.gatewayUrl = gatewayUrl;
    }

    public String getSignType() {
        return signType;
    }

    public void setSignType(String signType) {
        this.signType = signType;
    }
}
