package com.example.demo.model.dto;

import java.io.Serializable;

/**
 * 智能体对话请求 DTO
 */
public class ChatRequestDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 会话唯一标识 (用于多轮对话上下文追踪)
     */
    private String sessionId;

    /**
     * 用户提问内容
     */
    private String question;

    public ChatRequestDTO() {
    }

    public ChatRequestDTO(String sessionId, String question) {
        this.sessionId = sessionId;
        this.question = question;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }
}
