package com.example.demo.controller;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.result.Result;
import com.example.demo.model.dto.LoginDTO;
import com.example.demo.model.dto.RegisterDTO;
import com.example.demo.model.vo.LoginVO;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.UserService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 用户认证控制器：注册、登录、Token 签发
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    /**
     * 用户账号注册
     *
     * @param registerDTO 注册表单参数
     * @return 统一操作响应
     */
    @PostMapping("/register")
    public Result<Void> register(@RequestBody RegisterDTO registerDTO) {
        userService.register(registerDTO);
        return Result.success();
    }

    /**
     * 用户密码登录
     *
     * @param loginDTO 登录凭据
     * @return 携带 Token 与用户信息的 VO
     */
    @PostMapping("/login")
    public Result<LoginVO> login(@RequestBody LoginDTO loginDTO) {
        LoginVO loginVO = userService.login(loginDTO);
        return Result.success(loginVO);
    }

    /**
     * 校验当前 JWT 并返回登录用户基本信息 (供前端刷新恢复登录态使用)
     */
    @GetMapping("/me")
    public Result<Map<String, Object>> currentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new BusinessException(401, "未登录或登录凭证已过期");
        }
        return Result.success(Map.of(
                "userId", userPrincipal.getUserId(),
                "username", userPrincipal.getUsername()
        ));
    }
}
