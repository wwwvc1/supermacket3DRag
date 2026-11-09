package com.example.demo;

import com.example.demo.model.dto.LoginDTO;
import com.example.demo.model.dto.RegisterDTO;
import com.example.demo.model.vo.LoginVO;
import com.example.demo.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AuthControllerTest {

    @Autowired
    private UserService userService;

    @Test
    @DisplayName("测试用户注册与登录完整链路")
    void testRegisterAndLogin() {
        String testUsername = "authtest_" + System.currentTimeMillis();
        String password = "SecretPassword123";

        // 1. 注册新用户
        RegisterDTO registerDTO = new RegisterDTO(testUsername, password, "13912345678");
        assertDoesNotThrow(() -> userService.register(registerDTO));

        // 2. 校验重复注册抛出异常
        assertThrows(RuntimeException.class, () -> userService.register(registerDTO));

        // 3. 校验错误密码登录失败
        LoginDTO wrongLogin = new LoginDTO(testUsername, "WrongPassword");
        assertThrows(RuntimeException.class, () -> userService.login(wrongLogin));

        // 4. 正确密码登录并成功下发 JWT Token
        LoginDTO correctLogin = new LoginDTO(testUsername, password);
        LoginVO loginVO = userService.login(correctLogin);

        assertNotNull(loginVO);
        assertNotNull(loginVO.getToken());
        assertEquals(testUsername, loginVO.getUsername());
        assertNotNull(loginVO.getUserId());
    }
}
