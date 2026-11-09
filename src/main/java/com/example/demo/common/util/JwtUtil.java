package com.example.demo.common.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT 工具类：负责 Token 的签发、解析与有效性验证
 */
@Component
public class JwtUtil {

    private final SecretKey secretKey;
    private final long expirationMillis;

    public JwtUtil(@Value("${jwt.secret:EnterpriseEcommerceRagKnowledgeBaseSecretKey2026SecureJwtToken1234567890!}") String secret,
                   @Value("${jwt.expiration:86400000}") long expirationMillis) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMillis = expirationMillis;
    }

    /**
     * 为指定用户生成 JWT 凭证
     *
     * @param userId   用户主键 ID
     * @param username 用户名
     * @return Bearer Token 字符串
     */
    public String generateToken(Long userId, String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMillis);

        return Jwts.builder()
                .subject(username)
                .claim("userId", userId)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    /**
     * 解析 JWT Token 获取 Payload Claims
     *
     * @param token Bearer Token
     * @return Claims 键值对
     */
    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * 校验 Token 是否有效且未过期
     *
     * @param token 待校验 Token
     * @return true 为有效，false 为无效/过期
     */
    public boolean validateToken(String token) {
        try {
            Claims claims = parseClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 从 Token 中提取用户名
     */
    public String getUsername(String token) {
        return parseClaims(token).getSubject();
    }

    /**
     * 从 Token 中提取用户 ID
     */
    public Long getUserId(String token) {
        Number userId = parseClaims(token).get("userId", Number.class);
        return userId != null ? userId.longValue() : null;
    }
}
