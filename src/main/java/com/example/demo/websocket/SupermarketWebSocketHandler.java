package com.example.demo.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * 3D 数字孪生超市原生 WebSocket 处理器：管理客户端长连接与实时广播通道
 */
@Component
public class SupermarketWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(SupermarketWebSocketHandler.class);

    /**
     * 线程安全维护当前所有活跃的 3D 客户端连接
     */
    private final Set<WebSocketSession> activeSessions = new CopyOnWriteArraySet<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        activeSessions.add(session);
        log.info("3D 超市客户端已建立 WebSocket 连接: [sessionId={}], 当前在线客户端数: {}",
                session.getId(), activeSessions.size());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        activeSessions.remove(session);
        log.info("3D 超市客户端已断开 WebSocket 连接: [sessionId={}], 剩余在线数: {}",
                session.getId(), activeSessions.size());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.warn("WebSocket 传输发生异常 [sessionId={}]: {}", session.getId(), exception.getMessage());
        try {
            session.close(CloseStatus.SERVER_ERROR);
        } catch (IOException ignored) {
        }
        activeSessions.remove(session);
    }

    /**
     * 向全场所有已连接的 3D 客户端广播实时消息
     *
     * @param payload JSON 格式数据包
     */
    public void broadcast(String payload) {
        TextMessage textMessage = new TextMessage(payload);
        for (WebSocketSession session : activeSessions) {
            if (session.isOpen()) {
                try {
                    synchronized (session) {
                        session.sendMessage(textMessage);
                    }
                } catch (Exception e) {
                    log.error("向客户端 [{}] 发送 WebSocket 消息失败: {}", session.getId(), e.getMessage());
                }
            }
        }
    }

    /**
     * 获取当前在线连接数
     */
    public int getActiveSessionCount() {
        return activeSessions.size();
    }
}
