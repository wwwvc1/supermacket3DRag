package com.example.demo.controller;

import com.example.demo.common.result.Result;
import com.example.demo.model.vo.ProductSpatialVO;
import com.example.demo.model.vo.SupermarketSceneVO;
import com.example.demo.service.supermarket.SupermarketSceneService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 3D 数字孪生超市场景全景与空间检索控制器
 */
@RestController
@RequestMapping("/api/supermarket")
public class SupermarketSceneController {

    private final SupermarketSceneService supermarketSceneService;

    public SupermarketSceneController(SupermarketSceneService supermarketSceneService) {
        this.supermarketSceneService = supermarketSceneService;
    }

    /**
     * 获取 3D 超市全景初始化场景树 (下发货架网格坐标、在架商品、相机 Spawn 点与售罄状态)
     */
    @GetMapping("/scene")
    public Result<SupermarketSceneVO> getScene() {
        SupermarketSceneVO sceneVO = supermarketSceneService.getScene();
        return Result.success(sceneVO);
    }

    /**
     * 空间定位搜索：按关键词检索商品，返回详情与绑定的 3D 货架飞掠相机点位
     */
    @GetMapping("/products/search")
    public Result<List<ProductSpatialVO>> searchSpatialProducts(@RequestParam(required = false) String keyword) {
        List<ProductSpatialVO> list = supermarketSceneService.searchSpatialProducts(keyword);
        return Result.success(list);
    }
}
