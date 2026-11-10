package com.example.demo;

import com.example.demo.common.result.Result;
import com.example.demo.controller.SupermarketSceneController;
import com.example.demo.model.vo.ProductSpatialVO;
import com.example.demo.model.vo.SceneShelfVO;
import com.example.demo.model.vo.SupermarketSceneVO;
import com.example.demo.service.supermarket.SupermarketSceneService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 3D 数字孪生超市场景与空间检索单元测试
 */
@SpringBootTest
class SupermarketSceneTest {

    @Autowired
    private SupermarketSceneService supermarketSceneService;

    @Autowired
    private SupermarketSceneController supermarketSceneController;

    @Test
    @DisplayName("测试获取 3D 超市全景数据：校验空间尺寸与货架网格")
    void testGetSceneData() {
        Result<SupermarketSceneVO> result = supermarketSceneController.getScene();
        assertNotNull(result);
        assertEquals(200, result.getCode());

        SupermarketSceneVO scene = result.getData();
        assertNotNull(scene);
        assertTrue(scene.getStoreName().contains("智慧超市"));
        assertNotNull(scene.getTotalShelves());
        assertTrue(scene.getTotalShelves() >= 7);

        // 校验空间边界
        assertNotNull(scene.getSceneBounds());
        assertEquals(-20.0, scene.getSceneBounds().get("minX"));
        assertEquals(20.0, scene.getSceneBounds().get("maxX"));
        assertEquals(6.0, scene.getSceneBounds().get("height"));

        // 校验默认漫游相机起点与朝向
        assertNotNull(scene.getInitialCamera());
        assertEquals(0.0, scene.getInitialCamera().get("spawnX"));
        assertEquals(3.0, scene.getInitialCamera().get("spawnY"));
        assertEquals(8.0, scene.getInitialCamera().get("spawnZ"));

        // 校验货架列表
        List<SceneShelfVO> shelves = scene.getShelves();
        assertNotNull(shelves);
        assertFalse(shelves.isEmpty(), "种子数据应包含预设货架");

        // 校验至少包含生鲜果蔬区 A01 与数码影音区 B01
        boolean hasA01 = shelves.stream().anyMatch(s -> "A01".equals(s.getShelfCode()));
        boolean hasB01 = shelves.stream().anyMatch(s -> "B01".equals(s.getShelfCode()));
        assertTrue(hasA01, "场景必须包含生鲜果蔬货架 A01");
        assertTrue(hasB01, "场景必须包含数码影音货架 B01");

        // 校验货架附带的 3D 尺寸及空间点位
        for (SceneShelfVO shelf : shelves) {
            assertNotNull(shelf.getShelfCode());
            assertNotNull(shelf.getPositionX());
            assertNotNull(shelf.getPositionY());
            assertNotNull(shelf.getPositionZ());
            assertNotNull(shelf.getCameraTargetX());
            assertNotNull(shelf.getCameraTargetY());
            assertNotNull(shelf.getCameraTargetZ());
            assertNotNull(shelf.getStatus());
        }
    }

    @Test
    @DisplayName("测试 3D 超市空间搜索：关键词命中商品及空间坐标定位")
    void testSearchSpatialProducts() {
        // 搜索降噪耳机
        Result<List<ProductSpatialVO>> result = supermarketSceneController.searchSpatialProducts("耳机");
        assertNotNull(result);
        assertEquals(200, result.getCode());

        List<ProductSpatialVO> list = result.getData();
        assertNotNull(list);
        assertFalse(list.isEmpty(), "应该能命中降噪耳机相关商品");

        ProductSpatialVO headphone = list.get(0);
        assertTrue(headphone.getName().contains("耳机"));
        assertNotNull(headphone.getShelfCode(), "空间检索商品必须附带所在货架编码");
        assertNotNull(headphone.getPositionX(), "必须包含商品 3D 绝对空间 X 坐标");
        assertNotNull(headphone.getPositionY(), "必须包含商品 3D 绝对空间 Y 坐标");
        assertNotNull(headphone.getPositionZ(), "必须包含商品 3D 绝对空间 Z 坐标");
        assertNotNull(headphone.getCameraTargetX(), "必须包含特写巡检相机机位 X 坐标");
        assertNotNull(headphone.getCameraTargetY(), "必须包含特写巡检相机机位 Y 坐标");
        assertNotNull(headphone.getCameraTargetZ(), "必须包含特写巡检相机机位 Z 坐标");
        assertFalse(headphone.isOutOfStock());

        // 搜索不存在的商品
        Result<List<ProductSpatialVO>> emptyResult = supermarketSceneController.searchSpatialProducts("不存在的火星特产XYZ");
        assertNotNull(emptyResult);
        assertTrue(emptyResult.getData().isEmpty(), "不存在的商品应当返回空列表");
    }
}
