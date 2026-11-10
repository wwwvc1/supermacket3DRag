package com.example.demo.model.vo;

import com.example.demo.entity.Product;

import java.io.Serializable;
import java.util.List;

/**
 * 3D 超市场景单个货架空间数据 VO (包含三维坐标、飞掠注视点与陈列商品)
 */
public class SceneShelfVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String shelfCode;
    private String name;
    private String zone;

    private Double positionX;
    private Double positionY;
    private Double positionZ;
    private Double rotationY;

    private Double cameraTargetX;
    private Double cameraTargetY;
    private Double cameraTargetZ;

    private String status;
    private List<Product> products;

    public SceneShelfVO() {
    }

    public SceneShelfVO(Long id, String shelfCode, String name, String zone, Double positionX, Double positionY, Double positionZ, Double rotationY, Double cameraTargetX, Double cameraTargetY, Double cameraTargetZ, String status, List<Product> products) {
        this.id = id;
        this.shelfCode = shelfCode;
        this.name = name;
        this.zone = zone;
        this.positionX = positionX;
        this.positionY = positionY;
        this.positionZ = positionZ;
        this.rotationY = rotationY;
        this.cameraTargetX = cameraTargetX;
        this.cameraTargetY = cameraTargetY;
        this.cameraTargetZ = cameraTargetZ;
        this.status = status;
        this.products = products;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getShelfCode() {
        return shelfCode;
    }

    public void setShelfCode(String shelfCode) {
        this.shelfCode = shelfCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public Double getRotationY() {
        return rotationY;
    }

    public void setRotationY(Double rotationY) {
        this.rotationY = rotationY;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<Product> getProducts() {
        return products;
    }

    public void setProducts(List<Product> products) {
        this.products = products;
    }
}
