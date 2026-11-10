package com.example.demo.model.dto;

import java.io.Serializable;

/**
 * AI 导购机器人巡航规划请求 DTO
 */
public class GuideRouteRequestDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 自由文本形式的购物清单 (如：“我想买一箱牛奶，两斤红富士苹果，一副耳机”)
     */
    private String shoppingListText;

    public GuideRouteRequestDTO() {
    }

    public GuideRouteRequestDTO(String shoppingListText) {
        this.shoppingListText = shoppingListText;
    }

    public String getShoppingListText() {
        return shoppingListText;
    }

    public void setShoppingListText(String shoppingListText) {
        this.shoppingListText = shoppingListText;
    }
}
