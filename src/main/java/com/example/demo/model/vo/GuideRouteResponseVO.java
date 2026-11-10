package com.example.demo.model.vo;

import java.io.Serializable;
import java.util.List;

/**
 * AI 导购机器人巡航规划完整响应 VO
 */
public class GuideRouteResponseVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * AI 导购语音/文本开场白与路线总览
     */
    private String summary;

    /**
     * 途径的货架站点总数
     */
    private int totalStops;

    /**
     * 按空间最优路线排序的 3D 巡航航路点序列 (前端直接逐项运镜飞行)
     */
    private List<WaypointVO> waypoints;

    /**
     * 清单中未在店内匹配到或全店缺货的商品词
     */
    private List<String> unmatchedItems;

    public GuideRouteResponseVO() {
    }

    public GuideRouteResponseVO(String summary, int totalStops, List<WaypointVO> waypoints, List<String> unmatchedItems) {
        this.summary = summary;
        this.totalStops = totalStops;
        this.waypoints = waypoints;
        this.unmatchedItems = unmatchedItems;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public int getTotalStops() {
        return totalStops;
    }

    public void setTotalStops(int totalStops) {
        this.totalStops = totalStops;
    }

    public List<WaypointVO> getWaypoints() {
        return waypoints;
    }

    public void setWaypoints(List<WaypointVO> waypoints) {
        this.waypoints = waypoints;
    }

    public List<String> getUnmatchedItems() {
        return unmatchedItems;
    }

    public void setUnmatchedItems(List<String> unmatchedItems) {
        this.unmatchedItems = unmatchedItems;
    }
}
