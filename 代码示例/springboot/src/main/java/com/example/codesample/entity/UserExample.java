package com.example.codesample.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

/**
 * 示例用户表。密码字段只保存 BCrypt 哈希。
 * <p>
 * CREATE TABLE sys_user (
 *     id            BIGINT PRIMARY KEY AUTO_INCREMENT,
 *     username      VARCHAR(64)  NOT NULL UNIQUE,
 *     password_hash VARCHAR(100) NOT NULL,
 *     created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 */
@TableName("sys_user")
public class UserExample {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    /** BCrypt 哈希，例如 $2a$10$...，不要存明文。 */
    private String passwordHash;

    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
