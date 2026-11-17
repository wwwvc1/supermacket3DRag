package com.example.codesample.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.codesample.entity.UserExample;
import com.example.codesample.mapper.UserExampleMapper;
import com.example.codesample.util.JwtExampleUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 注册、登录和当前用户。演示数据库查询与 JWT 如何接在一起。
 * <p>
 * 登录：按用户名查 sys_user，BCrypt 比对密码，成功后签发令牌。
 * 访问 /api/example/me：过滤器已经验过签，这里只读安全上下文。
 * <p>
 * 请求头：Authorization: Bearer &lt;token&gt;
 */
@RestController
@RequestMapping("/api/example")
public class AuthExampleController {

    private final UserExampleMapper userExampleMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtExampleUtil jwtExampleUtil;

    public AuthExampleController(UserExampleMapper userExampleMapper,
                                 PasswordEncoder passwordEncoder,
                                 JwtExampleUtil jwtExampleUtil) {
        this.userExampleMapper = userExampleMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtExampleUtil = jwtExampleUtil;
    }

    @PostMapping("/auth/register")
    public Map<String, Object> register(@RequestBody LoginBody body) {
        UserExample existed = userExampleMapper.selectOne(new LambdaQueryWrapper<UserExample>()
                .eq(UserExample::getUsername, body.username()));
        if (existed != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "用户名已存在");
        }
        UserExample user = new UserExample();
        user.setUsername(body.username());
        user.setPasswordHash(passwordEncoder.encode(body.password()));
        userExampleMapper.insert(user);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", user.getId());
        result.put("username", user.getUsername());
        return result;
    }

    @PostMapping("/auth/login")
    public Map<String, Object> login(@RequestBody LoginBody body) {
        // 条件构造器生成 WHERE username = ?，用户名作为预编译参数，避免拼进 SQL。
        UserExample user = userExampleMapper.selectOne(new LambdaQueryWrapper<UserExample>()
                .eq(UserExample::getUsername, body.username()));
        // 账号不存在和密码错误返回同一句话，避免泄露用户名是否已注册。
        if (user == null || !passwordEncoder.matches(body.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户名或密码错误");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("tokenType", "Bearer");
        result.put("accessToken", jwtExampleUtil.generateToken(user.getId(), user.getUsername()));
        return result;
    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "未登录");
        }
        Map<String, Object> result = new LinkedHashMap<>();
        // 过滤器把 userId 放在 principal，用户名放在 details。
        result.put("userId", authentication.getPrincipal());
        result.put("username", authentication.getDetails());
        return result;
    }

    /**
     * 示例入参。正式接口应放在 dto 包，并加上校验注解。
     */
    public record LoginBody(String username, String password) {
    }
}
