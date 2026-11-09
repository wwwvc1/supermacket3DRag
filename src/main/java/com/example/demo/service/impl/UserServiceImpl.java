package com.example.demo.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.util.JwtUtil;
import com.example.demo.entity.User;
import com.example.demo.mapper.UserMapper;
import com.example.demo.model.dto.LoginDTO;
import com.example.demo.model.dto.RegisterDTO;
import com.example.demo.model.vo.LoginVO;
import com.example.demo.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 用户业务逻辑实现类
 */
@Service
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UserServiceImpl(UserMapper userMapper, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void register(RegisterDTO registerDTO) {
        if (registerDTO == null || registerDTO.getUsername() == null || registerDTO.getUsername().isBlank()) {
            throw new BusinessException(400, "用户名不能为空");
        }
        if (registerDTO.getPassword() == null || registerDTO.getPassword().isBlank()) {
            throw new BusinessException(400, "密码不能为空");
        }

        // 校验用户名是否已存在
        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, registerDTO.getUsername().trim()));
        if (count > 0) {
            throw new BusinessException(400, "用户名已被注册，请更换其他用户名");
        }

        // BCrypt 哈希加密存储
        String encodedPassword = passwordEncoder.encode(registerDTO.getPassword().trim());

        User user = new User();
        user.setUsername(registerDTO.getUsername().trim());
        user.setPassword(encodedPassword);
        user.setPhone(registerDTO.getPhone());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userMapper.insert(user);
    }

    @Override
    public LoginVO login(LoginDTO loginDTO) {
        if (loginDTO == null || loginDTO.getUsername() == null || loginDTO.getPassword() == null) {
            throw new BusinessException(400, "用户名与密码不能为空");
        }

        // 根据用户名检索用户
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, loginDTO.getUsername().trim()));
        if (user == null) {
            throw new BusinessException(400, "用户名或密码错误");
        }

        // 校验密码哈希
        if (!passwordEncoder.matches(loginDTO.getPassword().trim(), user.getPassword())) {
            throw new BusinessException(400, "用户名或密码错误");
        }

        // 签发 JWT
        String token = jwtUtil.generateToken(user.getId(), user.getUsername());

        return new LoginVO(token, user.getId(), user.getUsername());
    }

    @Override
    public User getById(Long userId) {
        return userMapper.selectById(userId);
    }
}
