package com.example.demo.service.supermarket;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.entity.Product;
import com.example.demo.entity.Shelf;
import com.example.demo.mapper.ProductMapper;
import com.example.demo.mapper.ShelfMapper;
import com.example.demo.model.vo.ProductSpatialVO;
import com.example.demo.model.vo.SceneShelfVO;
import com.example.demo.model.vo.SupermarketSceneVO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 3D 数字孪生超市场景与空间检索业务服务
 */
@Service
public class SupermarketSceneService {

    private final ShelfMapper shelfMapper;
    private final ProductMapper productMapper;

    public SupermarketSceneService(ShelfMapper shelfMapper, ProductMapper productMapper) {
        this.shelfMapper = shelfMapper;
        this.productMapper = productMapper;
    }

    /**
     * 获取 3D 超市全景初始化视图 (下发货架世界坐标、陈列商品明细、相机生成点及漫游边界)
     */
    public SupermarketSceneVO getScene() {
        List<Shelf> shelves = shelfMapper.selectList(new LambdaQueryWrapper<Shelf>()
                .orderByAsc(Shelf::getId));

        // 查询所有上架在售的商品
        List<Product> allProducts = productMapper.selectList(new LambdaQueryWrapper<Product>()
                .eq(Product::getStatus, "ON_SHELF"));

        // 按 shelfId 分组商品
        Map<Long, List<Product>> productMap = allProducts.stream()
                .filter(p -> p.getShelfId() != null)
                .collect(Collectors.groupingBy(Product::getShelfId));

        List<SceneShelfVO> shelfVOList = new ArrayList<>();
        for (Shelf shelf : shelves) {
            List<Product> shelfProducts = productMap.getOrDefault(shelf.getId(), List.of());

            // 动态判断该货架是否全员售罄
            boolean isOutOfStock = true;
            if (!shelfProducts.isEmpty()) {
                for (Product p : shelfProducts) {
                    if (p.getStock() != null && p.getStock() > 0) {
                        isOutOfStock = false;
                        break;
                    }
                }
            }
            String dynamicStatus = isOutOfStock ? "OUT_OF_STOCK" : "NORMAL";

            SceneShelfVO vo = new SceneShelfVO(
                    shelf.getId(),
                    shelf.getShelfCode(),
                    shelf.getName(),
                    shelf.getZone(),
                    shelf.getPositionX(),
                    shelf.getPositionY(),
                    shelf.getPositionZ(),
                    shelf.getRotationY(),
                    shelf.getCameraTargetX(),
                    shelf.getCameraTargetY(),
                    shelf.getCameraTargetZ(),
                    dynamicStatus,
                    shelfProducts
            );
            shelfVOList.add(vo);
        }

        // 默认相机 Spawn 初始注视点 (站在商业步行街入口漫游视点，向大道纵深望去)
        Map<String, Double> initialCamera = new HashMap<>();
        initialCamera.put("spawnX", 0.0);
        initialCamera.put("spawnY", 2.2);
        initialCamera.put("spawnZ", 22.0);
        initialCamera.put("lookAtX", 0.0);
        initialCamera.put("lookAtY", 1.6);
        initialCamera.put("lookAtZ", 0.0);

        // 空间边界设定 (长宽高范围，商业街区宽 48m, 长 64m)
        Map<String, Double> sceneBounds = new HashMap<>();
        sceneBounds.put("minX", -24.0);
        sceneBounds.put("maxX", 24.0);
        sceneBounds.put("minZ", -36.0);
        sceneBounds.put("maxZ", 28.0);
        sceneBounds.put("height", 8.0);

        return new SupermarketSceneVO(
                "3D 数字孪生未来智慧商业街",
                shelfVOList.size(),
                initialCamera,
                sceneBounds,
                shelfVOList
        );
    }

    /**
     * 根据关键词检索商品并返回绑定的 3D 货架空间坐标 (用于搜索直飞货架运镜)
     *
     * @param keyword 搜索关键字
     * @return 包含空间坐标的商品详情列表
     */
    public List<ProductSpatialVO> searchSpatialProducts(String keyword) {
        LambdaQueryWrapper<Product> query = new LambdaQueryWrapper<Product>()
                .eq(Product::getStatus, "ON_SHELF");
        if (keyword != null && !keyword.isBlank()) {
            query.like(Product::getName, keyword.trim());
        }
        query.orderByDesc(Product::getId);

        List<Product> products = productMapper.selectList(query);
        List<ProductSpatialVO> result = new ArrayList<>();

        for (Product p : products) {
            ProductSpatialVO vo = new ProductSpatialVO();
            vo.setId(p.getId());
            vo.setName(p.getName());
            vo.setCategory(p.getCategory());
            vo.setPrice(p.getPrice());
            vo.setStock(p.getStock());
            vo.setStatus(p.getStatus());
            vo.setDescription(p.getDescription());
            vo.setOutOfStock(p.getStock() == null || p.getStock() <= 0);

            if (p.getShelfId() != null) {
                Shelf shelf = shelfMapper.selectById(p.getShelfId());
                if (shelf != null) {
                    vo.setShelfId(shelf.getId());
                    vo.setShelfCode(shelf.getShelfCode());
                    vo.setShelfName(shelf.getName());
                    vo.setZone(shelf.getZone());
                    vo.setPositionX(shelf.getPositionX());
                    vo.setPositionY(shelf.getPositionY());
                    vo.setPositionZ(shelf.getPositionZ());
                    vo.setCameraTargetX(shelf.getCameraTargetX());
                    vo.setCameraTargetY(shelf.getCameraTargetY());
                    vo.setCameraTargetZ(shelf.getCameraTargetZ());
                }
            }
            result.add(vo);
        }

        return result;
    }
}
