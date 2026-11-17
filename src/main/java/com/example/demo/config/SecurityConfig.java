package com.example.demo.config;

import com.example.demo.common.result.Result;
import com.example.demo.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;

/**
 * Spring Security 核心配置：放行白名单、注册 JWT 过滤器、密码编码器与统一 401 JSON 响应
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    /**
     * 配置密码 BCrypt 强哈希加密器
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * 安全过滤链配置
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 禁用 CSRF 与默认表单登录 (使用纯无状态 JWT)
                .csrf(AbstractHttpConfigurer::disable)
                .cors(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        // 未携带有效 JWT 访问受保护接口时，明确返回 HTTP 401 与统一 Result JSON
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            Result<Void> body = Result.error(401, "未登录或登录凭证已过期，请先登录");
                            response.getWriter().write(objectMapper.writeValueAsString(body));
                        })
                )
                .authorizeHttpRequests(authorize -> authorize
                        // 登录、注册、商品浏览、知识库问答、3D场景全景、商户调控、支付宝回调与 WebSocket 端点公开访问
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/register",
                                "/api/products/**",
                                "/api/rag/**",
                                "/api/supermarket/**",
                                "/api/merchant/**",
                                "/api/payment/alipay/notify",
                                "/api/payment/alipay/config-status",
                                "/ws/**",
                                "/error"
                        ).permitAll()
                        // 购物车、下单、订单取消与发起支付均需 JWT 鉴权
                        .anyRequest().authenticated()
                )
                // 注入自定义 JWT 拦截校验过滤器
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
