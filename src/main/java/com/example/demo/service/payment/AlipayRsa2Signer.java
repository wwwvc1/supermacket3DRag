package com.example.demo.service.payment;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Map;
import java.util.TreeMap;

/**
 * 支付宝 RSA2 (SHA256withRSA) 纯 JDK 原生加签与异步回调验签工具类
 * <p>严格遵循支付宝开放平台签名规范：剔除 sign（异步回调验签时还需剔除 sign_type），按 ASCII 升序拼接非空参数串。</p>
 */
public final class AlipayRsa2Signer {

    private AlipayRsa2Signer() {
    }

    /**
     * 拼接支付宝待签名规范字符串 (ASCII 字典序)
     *
     * @param params          原始请求或回调参数
     * @param excludeSignType true=异步回调模式(剔除 sign 与 sign_type)，false=主动发起请求模式(仅剔除 sign)
     * @return 待签名明文串
     */
    public static String buildSignContent(Map<String, String> params, boolean excludeSignType) {
        TreeMap<String, String> sorted = new TreeMap<>(params);
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : sorted.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (key == null || value == null || value.isEmpty()) {
                continue;
            }
            if ("sign".equals(key) || (excludeSignType && "sign_type".equals(key))) {
                continue;
            }
            if (!sb.isEmpty()) {
                sb.append('&');
            }
            sb.append(key).append('=').append(value);
        }
        return sb.toString();
    }

    /**
     * 使用商户 PKCS8 私钥执行 RSA2 加签 (默认保留 sign_type，符合发起支付请求规范)
     */
    public static String sign(Map<String, String> params, String privateKeyText) {
        return sign(params, privateKeyText, false);
    }

    /**
     * 使用指定规则执行 RSA2 加签
     */
    public static String sign(Map<String, String> params, String privateKeyText, boolean excludeSignType) {
        try {
            String content = buildSignContent(params, excludeSignType);
            byte[] keyBytes = Base64.getDecoder().decode(stripPemHeaders(privateKeyText));
            PrivateKey privateKey = KeyFactory.getInstance("RSA")
                    .generatePrivate(new PKCS8EncodedKeySpec(keyBytes));
            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initSign(privateKey);
            signature.update(content.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(signature.sign());
        } catch (Exception e) {
            throw new IllegalStateException("支付宝 RSA2 加签失败: " + e.getMessage(), e);
        }
    }

    /**
     * 使用支付宝公钥对异步回调参数执行 RSA2 验签 (默认剔除 sign 与 sign_type)
     */
    public static boolean verify(Map<String, String> params, String alipayPublicKeyText) {
        return verify(params, alipayPublicKeyText, true);
    }

    /**
     * 使用公钥对参数执行 RSA2 验签
     */
    public static boolean verify(Map<String, String> params, String alipayPublicKeyText, boolean excludeSignType) {
        String sign = params.get("sign");
        if (sign == null || sign.isBlank()) {
            return false;
        }
        try {
            String content = buildSignContent(params, excludeSignType);
            byte[] keyBytes = Base64.getDecoder().decode(stripPemHeaders(alipayPublicKeyText));
            PublicKey publicKey = KeyFactory.getInstance("RSA")
                    .generatePublic(new X509EncodedKeySpec(keyBytes));
            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initVerify(publicKey);
            signature.update(content.getBytes(StandardCharsets.UTF_8));
            return signature.verify(Base64.getDecoder().decode(sign));
        } catch (Exception e) {
            return false;
        }
    }

    private static String stripPemHeaders(String pem) {
        return pem
                .replaceAll("-----BEGIN [A-Z ]+-----", "")
                .replaceAll("-----END [A-Z ]+-----", "")
                .replaceAll("\\s+", "");
    }
}
