package com.example.demo.model.vo;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 携带 3D 货架空间点位坐标的商品检索结果 VO (用于搜索直飞货架运镜)
 */
public class ProductSpatialVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private String category;
    private BigDecimal price;
    private Integer stock;
    private String status;
    private String description;
    private boolean isOutOfStock;

    // 关联的 3D 货架信息
    private Long shelfId;
    private String shelfCode;
    private String shelfName;
    private String zone;

    // Three.js 世界坐标与相机飞掠目标
    private Double positionX;
    private Double positionY;
    private Double positionZ;
    private Double cameraTargetX;
    private Double cameraTargetY;
    private Double cameraTargetZ;

    public ProductSpatialVO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public boolean isOutOfStock() {
        return isOutOfStock;
    }

    public void setOutOfStock(boolean outOfStock) {
        isOutOfStock = outOfStock;
    }

    public Long getShelfId() {
        return shelfId;
    }

    public void setShelfId(Long shelfId) {
        this.shelfId = shelfId;
    }

    public String getShelfCode() {
        return shelfCode;
    }

    public void setShelfCode(String shelfCode) {
        this.shelfCode = shelfCode;
    }

    public String getShelfName() {
        return shelfName;
    }

    public void setShelfName(String shelfName) {
        this.shelfName = shelfName;
    }

    public String getZone() {
        return zone;
    }

    public void setZone(String zone) {
        this.zone = zone;
    }

    public Double getPositionX() {
        return positionX;
    }

    public void setPositionX(Double positionX) {
        this.positionX = positionX;
    }

    public Double getPositionY() {
        return positionY;
    }

    public void setPositionY(Double positionY) {
        this.positionY = positionY;
    }

    public Double getPositionZ() {
        return positionZ;
    }

    public void setPositionZ(Double positionZ) {
        this.positionZ = positionZ;
    }

    public Double getCameraTargetX() {
        return cameraTargetX;
    }

    public void setCameraTargetX(Double cameraTargetX) {
        this.cameraTargetX = cameraTargetX;
    }

    public Double getCameraTargetY() {
        return cameraTargetY;
    }

    public void setCameraTargetY(Double cameraTargetY) {
        this.cameraTargetY = cameraTargetY;
    }

    public Double getCameraTargetZ() {
        return cameraTargetZ;
    }

    public void setCameraTargetZ(Double cameraTargetZ) {
        this.cameraTargetZ = cameraTargetZ;
    }
}
