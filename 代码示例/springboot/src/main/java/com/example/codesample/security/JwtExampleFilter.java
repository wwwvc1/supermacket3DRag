package com.example.codesample.security;

import com.example.codesample.util.JwtExampleUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * 每个请求最多执行一次：读取 Authorization 头，校验通过后写入安全上下文。
 * <p>
 * 无状态 JWT 不在服务端保存登录会话。过滤器只根据令牌重建 Authentication，
 * 请求结束线程归还后，ThreadLocal 中的上下文必须清掉，容器一般会在请求完成后清理。
 * <p>
 * 令牌缺失或无效时不在这里直接写 401。放行给过滤链，由 Security 按接口是否需要登录决定。
 * 这样登录接口可以没有令牌，受保护接口才会被拒绝。
 */
@Component
public class JwtExampleFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtExampleUtil jwtExampleUtil;

    public JwtExampleFilter(JwtExampleUtil jwtExampleUtil) {
        this.jwtExampleUtil = jwtExampleUtil;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER_PREFIX)
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = header.substring(BEARER_PREFIX.length()).trim();
            if (jwtExampleUtil.validateToken(token)) {
                Long userId = jwtExampleUtil.getUserId(token);
                String username = jwtExampleUtil.getUsername(token);
                if (userId != null && username != null) {
                    // principal 放用户 id，name 放用户名。后续接口从 SecurityContext 读取，不再解析 Header。
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userId,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_USER")));
                    authentication.setDetails(username);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }
        filterChain.doFilter(request, response);
    }
}
