package com.example.codesample.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT 签发与校验。算法为 JJWT 0.12 的 HMAC-SHA256。
 * <p>
 * 密钥在构造时转成 SecretKey，签发和解析共用这一把，避免两边字符串处理不一致。
 * Payload 可以解码，不能当加密存储。这里只放用户 id 和用户名。
 */
@Component
public class JwtExampleUtil {

    private final SecretKey secretKey;
    private final long expirationMillis;

    public JwtExampleUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expirationMillis) {
        // hmacShaKeyFor 要求密钥足够长，HS256 至少 256 bit，也就是 32 字节。
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMillis = expirationMillis;
    }

    /**
     * 签发访问令牌。subject 放用户名，自定义声明放 userId。
     */
    public String generateToken(Long userId, String username) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMillis);
        return Jwts.builder()
                .subject(username)
                .claim("userId", userId)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    /**
     * 验签并解析。签名不符、格式错误或已过期都会抛出 JwtException。
     * 调用方捕获后应返回 401，不要把底层异常原文回给客户端。
     */
    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** 有效且未过期返回 true。任何解析异常都视为无效令牌。 */
    public boolean validateToken(String token) {
        try {
            Claims claims = parseClaims(token);
            return claims.getExpiration() != null && claims.getExpiration().after(new Date());
        } catch (Exception ex) {
            return false;
        }
    }

    public String getUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public Long getUserId(String token) {
        Number userId = parseClaims(token).get("userId", Number.class);
        return userId == null ? null : userId.longValue();
    }
}
