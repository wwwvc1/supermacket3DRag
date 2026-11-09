package com.example.demo.model.dto;

import java.io.Serializable;

/**
 * 订单购买商品条目 DTO
 */
public class OrderItemDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long productId;
    private Integer quantity;

    public OrderItemDTO() {
    }

    public OrderItemDTO(Long productId, Integer quantity) {
        this.productId = productId;
        this.quantity = quantity;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
