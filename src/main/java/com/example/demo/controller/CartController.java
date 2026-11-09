package com.example.demo.controller;

import com.example.demo.common.result.Result;
import com.example.demo.model.dto.AddToCartDTO;
import com.example.demo.model.vo.CartItemVO;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.CartService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 购物车控制器
 */
@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    /**
     * 添加商品到购物车
     */
    @PostMapping("/add")
    public Result<Void> addToCart(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                  @RequestBody AddToCartDTO dto) {
        cartService.addToCart(userPrincipal.getUserId(), dto);
        return Result.success();
    }

    /**
     * 获取当前用户的购物车列表
     */
    @GetMapping("/list")
    public Result<List<CartItemVO>> listCart(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<CartItemVO> list = cartService.listCart(userPrincipal.getUserId());
        return Result.success(list);
    }

    /**
     * 移除购物车商品
     */
    @DeleteMapping("/{id}")
    public Result<Void> removeFromCart(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                       @PathVariable Long id) {
        cartService.removeFromCart(userPrincipal.getUserId(), id);
        return Result.success();
    }
}
