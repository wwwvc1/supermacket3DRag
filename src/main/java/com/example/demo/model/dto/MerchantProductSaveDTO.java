package com.example.demo.model.dto;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 商户端新增或编辑商品请求 DTO
 */
public class MerchantProductSaveDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String name;
    private Long shelfId;
    private String category;
    private BigDecimal price;
    private Integer stock;
    private String status;
    private String description;
    private String imageUrl;
    private String backImageUrl;
    private String sideImageUrl;
    private String showroomStage;
    private String colorHex;

    public MerchantProductSaveDTO() {
    }

    public MerchantProductSaveDTO(String name, Long shelfId, String category, BigDecimal price, Integer stock, String status, String description) {
        this.name = name;
        this.shelfId = shelfId;
        this.category = category;
        this.price = price;
        this.stock = stock;
        this.status = status;
        this.description = description;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getShelfId() {
        return shelfId;
    }

    public void setShelfId(Long shelfId) {
        this.shelfId = shelfId;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getBackImageUrl() {
        return backImageUrl;
    }

    public void setBackImageUrl(String backImageUrl) {
        this.backImageUrl = backImageUrl;
    }

    public String getSideImageUrl() {
        return sideImageUrl;
    }

    public void setSideImageUrl(String sideImageUrl) {
        this.sideImageUrl = sideImageUrl;
    }

    public String getShowroomStage() {
        return showroomStage;
    }

    public void setShowroomStage(String showroomStage) {
        this.showroomStage = showroomStage;
    }

    public String getColorHex() {
        return colorHex;
    }

    public void setColorHex(String colorHex) {
        this.colorHex = colorHex;
    }
}
