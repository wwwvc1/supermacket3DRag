package com.example.demo.service;

import com.example.demo.model.dto.AddToCartDTO;
import com.example.demo.model.vo.CartItemVO;

import java.util.List;

/**
 * 购物车服务接口
 */
public interface CartService {

    /**
     * 添加商品到购物车
     *
     * @param userId 用户 ID
     * @param dto    添加请求参数
     */
    void addToCart(Long userId, AddToCartDTO dto);

    /**
     * 查看当前用户购物车列表
     *
     * @param userId 用户 ID
     * @return 购物车明细列表
     */
    List<CartItemVO> listCart(Long userId);

    /**
     * 移除购物车某项商品
     *
     * @param userId     用户 ID
     * @param cartItemId 购物车条目 ID
     */
    void removeFromCart(Long userId, Long cartItemId);
}
