package com.example.demo.model.vo;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

/**
 * 3D 数字孪生超市全景初始化 VO (包含全场货架、商品与初始运镜相机点位)
 */
public class SupermarketSceneVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 超市名称
     */
    private String storeName;

    /**
     * 货架总数
     */
    private Integer totalShelves;

    /**
     * 初始相机 Spawn 视点配置 (X/Y/Z 与朝向 LookAt)
     */
    private Map<String, Double> initialCamera;

    /**
     * 漫游空间边界 (长宽高范围)
     */
    private Map<String, Double> sceneBounds;

    /**
     * 全场货架空间与商品详细列表
     */
    private List<SceneShelfVO> shelves;

    public SupermarketSceneVO() {
    }

    public SupermarketSceneVO(String storeName, Integer totalShelves, Map<String, Double> initialCamera, Map<String, Double> sceneBounds, List<SceneShelfVO> shelves) {
        this.storeName = storeName;
        this.totalShelves = totalShelves;
        this.initialCamera = initialCamera;
        this.sceneBounds = sceneBounds;
        this.shelves = shelves;
    }

    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }

    public Integer getTotalShelves() {
        return totalShelves;
    }

    public void setTotalShelves(Integer totalShelves) {
        this.totalShelves = totalShelves;
    }

    public Map<String, Double> getInitialCamera() {
        return initialCamera;
    }

    public void setInitialCamera(Map<String, Double> initialCamera) {
        this.initialCamera = initialCamera;
    }

    public Map<String, Double> getSceneBounds() {
        return sceneBounds;
    }

    public void setSceneBounds(Map<String, Double> sceneBounds) {
        this.sceneBounds = sceneBounds;
    }

    public List<SceneShelfVO> getShelves() {
        return shelves;
    }

    public void setShelves(List<SceneShelfVO> shelves) {
        this.shelves = shelves;
    }
}
