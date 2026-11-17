package com.example.demo.model.dto;

import java.io.Serializable;

/**
 * 支付宝沙箱创建支付收银台请求 DTO
 */
public class AlipayPayRequestDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 待支付订单流水号
     */
    private String orderNo;

    public AlipayPayRequestDTO() {
    }

    public AlipayPayRequestDTO(String orderNo) {
        this.orderNo = orderNo;
    }

    public String getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }
}
