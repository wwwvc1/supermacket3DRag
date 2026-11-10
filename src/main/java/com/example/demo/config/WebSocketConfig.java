package com.example.demo.config;

import com.example.demo.websocket.SupermarketWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * 原生 WebSocket 服务端配置：注册 /ws/supermarket 端点并允许跨域
 */
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final SupermarketWebSocketHandler supermarketWebSocketHandler;

    public WebSocketConfig(SupermarketWebSocketHandler supermarketWebSocketHandler) {
        this.supermarketWebSocketHandler = supermarketWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(supermarketWebSocketHandler, "/ws/supermarket")
                .setAllowedOrigins("*");
    }
}
