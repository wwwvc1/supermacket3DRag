package com.example.demo.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.common.exception.BusinessException;
import com.example.demo.entity.CartItem;
import com.example.demo.entity.Product;
import com.example.demo.mapper.CartItemMapper;
import com.example.demo.mapper.ProductMapper;
import com.example.demo.model.dto.AddToCartDTO;
import com.example.demo.model.vo.CartItemVO;
import com.example.demo.service.CartService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 购物车业务逻辑实现类
 */
@Service
public class CartServiceImpl implements CartService {

    private final CartItemMapper cartItemMapper;
    private final ProductMapper productMapper;

    public CartServiceImpl(CartItemMapper cartItemMapper, ProductMapper productMapper) {
        this.cartItemMapper = cartItemMapper;
        this.productMapper = productMapper;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void addToCart(Long userId, AddToCartDTO dto) {
        if (dto == null || dto.getProductId() == null || dto.getQuantity() == null || dto.getQuantity() <= 0) {
            throw new BusinessException(400, "加购商品参数不合法");
        }

        Product product = productMapper.selectById(dto.getProductId());
        if (product == null) {
            throw new BusinessException(404, "加购商品不存在或已下架");
        }
        if (product.getStock() < dto.getQuantity()) {
            throw new BusinessException(400, "商品库存不足，剩余库存: " + product.getStock());
        }

        // 查询该用户购物车中是否已存在该商品
        CartItem existItem = cartItemMapper.selectOne(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId)
                .eq(CartItem::getProductId, dto.getProductId()));

        if (existItem != null) {
            existItem.setQuantity(existItem.getQuantity() + dto.getQuantity());
            existItem.setUpdatedAt(LocalDateTime.now());
            cartItemMapper.updateById(existItem);
        } else {
            CartItem newItem = new CartItem(userId, dto.getProductId(), dto.getQuantity());
            cartItemMapper.insert(newItem);
        }
    }

    @Override
    public List<CartItemVO> listCart(Long userId) {
        List<CartItem> cartItems = cartItemMapper.selectList(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId)
                .orderByDesc(CartItem::getId));

        List<CartItemVO> resultList = new ArrayList<>();
        for (CartItem item : cartItems) {
            Product product = productMapper.selectById(item.getProductId());
            if (product != null) {
                BigDecimal subtotal = product.getPrice().multiply(new BigDecimal(item.getQuantity()));
                CartItemVO vo = new CartItemVO(
                        item.getId(),
                        product.getId(),
                        product.getName(),
                        product.getPrice(),
                        item.getQuantity(),
                        subtotal
                );
                resultList.add(vo);
            }
        }

        return resultList;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void removeFromCart(Long userId, Long cartItemId) {
        CartItem cartItem = cartItemMapper.selectById(cartItemId);
        if (cartItem == null || !cartItem.getUserId().equals(userId)) {
            throw new BusinessException(404, "购物车项不存在");
        }
        cartItemMapper.deleteById(cartItemId);
    }
}
