package com.example.codesample.config;

import com.example.codesample.security.JwtExampleFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * 无状态安全链示例。
 * <p>
 * 主工程已经有一个 SecurityFilterChain。一个应用里如果出现两条链，必须用
 * securityMatcher 划定各自负责的路径，否则后加载的链会覆盖或互相拦截。
 * 本类仅作阅读示例，不要和主工程的 SecurityConfig 原样同时启用。
 */
@Configuration
@EnableWebSecurity
public class SecurityExampleConfig {

    private final JwtExampleFilter jwtExampleFilter;

    public SecurityExampleConfig(JwtExampleFilter jwtExampleFilter) {
        this.jwtExampleFilter = jwtExampleFilter;
    }

    /** 注册、登录时用它生成哈希；登录时用 matches 比对，不要自己实现摘要。 */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain exampleSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                // 浏览器表单才会用到 CSRF Cookie。纯 Bearer 接口没有 Cookie 会话，关闭 CSRF。
                .csrf(AbstractHttpConfigurer::disable)
                // STATELESS：不创建 HttpSession，登录态只存在于客户端持有的 JWT。
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/example/auth/**").permitAll()
                        .anyRequest().authenticated())
                // 放在用户名密码过滤器之前，这样进入控制器时 SecurityContext 已经有身份。
                .addFilterBefore(jwtExampleFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
