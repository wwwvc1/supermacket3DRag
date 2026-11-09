package com.example.demo.model.dto;

import java.io.Serializable;
import java.util.List;

/**
 * 创建订单请求 DTO
 */
public class CreateOrderDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private List<OrderItemDTO> items;

    public CreateOrderDTO() {
    }

    public CreateOrderDTO(List<OrderItemDTO> items) {
        this.items = items;
    }

    public List<OrderItemDTO> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDTO> items) {
        this.items = items;
    }
}
