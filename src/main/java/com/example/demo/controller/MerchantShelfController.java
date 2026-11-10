package com.example.demo.controller;

import com.example.demo.common.result.Result;
import com.example.demo.entity.Shelf;
import com.example.demo.service.merchant.MerchantService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 商户后台 3D 货架空间点位管理控制器
 */
@RestController
@RequestMapping("/api/merchant/shelves")
public class MerchantShelfController {

    private final MerchantService merchantService;

    public MerchantShelfController(MerchantService merchantService) {
        this.merchantService = merchantService;
    }

    /**
     * 获取所有 3D 货架空间点位列表
     */
    @GetMapping
    public Result<List<Shelf>> listShelves() {
        List<Shelf> shelves = merchantService.listShelves();
        return Result.success(shelves);
    }

    /**
     * 创建或调整货架点位及相机注视点
     */
    @PostMapping
    public Result<Shelf> saveShelf(@RequestBody Shelf shelf) {
        Shelf saved = merchantService.saveShelf(shelf);
        return Result.success(saved);
    }
}
