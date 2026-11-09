package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.model.dto.LoginDTO;
import com.example.demo.model.dto.RegisterDTO;
import com.example.demo.model.vo.LoginVO;

/**
 * 用户业务逻辑接口
 */
public interface UserService {

    /**
     * 用户注册
     *
     * @param registerDTO 注册请求数据
     */
    void register(RegisterDTO registerDTO);

    /**
     * 用户登录并下发 JWT Token
     *
     * @param loginDTO 登录凭据
     * @return 包含 Token 和基本用户信息的 VO
     */
    LoginVO login(LoginDTO loginDTO);

    /**
     * 根据主键 ID 查询用户
     *
     * @param userId 用户 ID
     * @return 用户实体
     */
    User getById(Long userId);
}
