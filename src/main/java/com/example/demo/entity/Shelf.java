package com.example.demo.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 3D 数字孪生货架实体类 (遵循 Three.js / WebGL 右手空间坐标标准，以米为单位)
 */
@TableName("shelf")
public class Shelf implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 货架逻辑编码 (如 A01)
     */
    private String shelfCode;

    /**
     * 货架名称 (如 生鲜果蔬冷藏货架)
     */
    private String name;

    /**
     * 所属区域 (如 生鲜果蔬区 / 乳品冷饮区)
     */
    private String zone;

    /**
     * 3D 世界坐标 X (横向)
     */
    private Double positionX;

    /**
     * 3D 世界坐标 Y (立面高度)
     */
    private Double positionY;

    /**
     * 3D 世界坐标 Z (纵深)
     */
    private Double positionZ;

    /**
     * 货架绕 Y 轴朝向角 (弧度/度)
     */
    private Double rotationY;

    /**
     * 推荐飞掠相机注视点 X
     */
    private Double cameraTargetX;

    /**
     * 推荐飞掠相机注视点 Y
     */
    private Double cameraTargetY;

    /**
     * 推荐飞掠相机注视点 Z
     */
    private Double cameraTargetZ;

    /**
     * 货架当前状态: NORMAL 正常, OUT_OF_STOCK 全货架售罄标红
     */
    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public Shelf() {
    }

    public Shelf(Long id, String shelfCode, String name, String zone, Double positionX, Double positionY, Double positionZ, Double rotationY, Double cameraTargetX, Double cameraTargetY, Double cameraTargetZ, String status) {
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
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
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
