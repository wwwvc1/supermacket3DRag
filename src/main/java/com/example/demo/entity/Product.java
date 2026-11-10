package com.example.demo.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 商品实体类 (扩展 3D 货架绑定与上下架状态)
 */
@TableName("product")
public class Product implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 商品主键 ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 绑定的 3D 货架主键 ID
     */
    private Long shelfId;

    /**
     * 商品名称
     */
    private String name;

    /**
     * 商品类目
     */
    private String category;

    /**
     * 商品销售单价
     */
    private BigDecimal price;

    /**
     * 库存数量
     */
    private Integer stock;

    /**
     * 商品上下架状态: ON_SHELF 在架销售, OFF_SHELF 已下架
     */
    private String status;

    /**
     * 商品详细描述
     */
    private String description;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;

    public Product() {
    }

    public Product(Long id, Long shelfId, String name, String category, BigDecimal price, Integer stock, String status, String description) {
        this.id = id;
        this.shelfId = shelfId;
        this.name = name;
        this.category = category;
        this.price = price;
        this.stock = stock;
        this.status = status != null ? status : "ON_SHELF";
        this.description = description;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Product(Long id, String name, String category, BigDecimal price, Integer stock, String description) {
        this(id, null, name, category, price, stock, "ON_SHELF", description);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getShelfId() {
        return shelfId;
    }

    public void setShelfId(Long shelfId) {
        this.shelfId = shelfId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
