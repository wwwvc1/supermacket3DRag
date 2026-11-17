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
     * 商品正面展示图片路径 (静态资源 /products/... 或外部 URL)
     */
    private String imageUrl;

    /**
     * 商品背面展示图片路径 (360° 翻转展示使用)
     */
    private String backImageUrl;

    /**
     * 商品侧面展示图片路径 (悬架滑轨侧挂图使用)
     */
    private String sideImageUrl;

    /**
     * 所属 3D 旗舰展厅分类: STAGE_RAIL (高定服饰), STAGE_TECH (数码转盘), STAGE_VITRINE (典藏展柜), STORE_GENERAL (通用货架)
     */
    private String showroomStage;

    /**
     * 展厅主视觉主题色 (#HEX)
     */
    private String colorHex;

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
