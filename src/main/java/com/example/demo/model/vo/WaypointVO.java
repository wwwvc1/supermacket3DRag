package com.example.demo.model.vo;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 3D 巡航航路点 VO (步骤序号、商品详情、货架三维坐标及相机飞掠目标)
 */
public class WaypointVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 巡航步骤序号 (1, 2, 3...)
     */
    private int step;

    /**
     * 匹配到的商品信息
     */
    private Long productId;
    private String productName;
    private BigDecimal price;
    private Integer stock;
    private boolean isOutOfStock;

    /**
     * 绑定的 3D 货架空间信息
     */
    private Long shelfId;
    private String shelfCode;
    private String shelfName;
    private String zone;

    /**
     * 3D 世界坐标 (Three.js)
     */
    private Double positionX;
    private Double positionY;
    private Double positionZ;

    /**
     * 推荐相机飞掠注视点 (Three.js)
     */
    private Double cameraTargetX;
    private Double cameraTargetY;
    private Double cameraTargetZ;

    /**
     * AI 导购讲解词
     */
    private String guideSpeech;

    public WaypointVO() {
    }

    public int getStep() {
        return step;
    }

    public void setStep(int step) {
        this.step = step;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
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

    public String getGuideSpeech() {
        return guideSpeech;
    }

    public void setGuideSpeech(String guideSpeech) {
        this.guideSpeech = guideSpeech;
    }
}
