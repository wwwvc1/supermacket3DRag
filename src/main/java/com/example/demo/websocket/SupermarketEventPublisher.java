package com.example.demo.websocket;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.entity.Product;
import com.example.demo.entity.Shelf;
import com.example.demo.mapper.ProductMapper;
import com.example.demo.mapper.ShelfMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 3D 超市实时事件发布器：负责组装库存变动事件包并触发全场 WebSocket 广播与货架售罄状态联动
 */
@Component
public class SupermarketEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(SupermarketEventPublisher.class);

    private final SupermarketWebSocketHandler webSocketHandler;
    private final ProductMapper productMapper;
    private final ShelfMapper shelfMapper;
    private final ObjectMapper objectMapper;

    public SupermarketEventPublisher(SupermarketWebSocketHandler webSocketHandler,
                                     ProductMapper productMapper,
                                     ShelfMapper shelfMapper) {
        this.webSocketHandler = webSocketHandler;
        this.productMapper = productMapper;
        this.shelfMapper = shelfMapper;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * 发布商品库存变动广播事件
     *
     * @param productId   变动的商品主键 ID
     * @param latestStock 最新可用库存数
     */
    public void publishInventoryChanged(Long productId, Integer latestStock) {
        if (productId == null) {
            return;
        }

        Product product = productMapper.selectById(productId);
        if (product == null) {
            return;
        }

        int currentStock = latestStock != null ? latestStock : (product.getStock() != null ? product.getStock() : 0);
        boolean isOutOfStock = currentStock <= 0;

        Shelf shelf = null;
        if (product.getShelfId() != null) {
            shelf = shelfMapper.selectById(product.getShelfId());
            if (shelf != null) {
                // 检查该货架上的所有在架商品是否已全数售罄
                List<Product> shelfProducts = productMapper.selectList(new LambdaQueryWrapper<Product>()
                        .eq(Product::getShelfId, shelf.getId())
                        .eq(Product::getStatus, "ON_SHELF"));

                boolean allEmpty = true;
                for (Product sp : shelfProducts) {
                    if (sp.getId().equals(productId)) {
                        if (currentStock > 0) {
                            allEmpty = false;
                            break;
                        }
                    } else if (sp.getStock() != null && sp.getStock() > 0) {
                        allEmpty = false;
                        break;
                    }
                }

                String newShelfStatus = allEmpty ? "OUT_OF_STOCK" : "NORMAL";
                if (!newShelfStatus.equals(shelf.getStatus())) {
                    shelf.setStatus(newShelfStatus);
                    shelfMapper.updateById(shelf);
                    log.info("货架 [{}] 状态联动更新为: {}", shelf.getShelfCode(), newShelfStatus);
                }
            }
        }

        try {
            Map<String, Object> event = new HashMap<>();
            event.put("event", "INVENTORY_CHANGED");
            event.put("productId", product.getId());
            event.put("productName", product.getName());
            event.put("stock", currentStock);
            event.put("isOutOfStock", isOutOfStock);
            event.put("shelfId", shelf != null ? shelf.getId() : null);
            event.put("shelfCode", shelf != null ? shelf.getShelfCode() : "UNASSIGNED");
            event.put("shelfStatus", shelf != null ? shelf.getStatus() : "NORMAL");
            event.put("timestamp", System.currentTimeMillis());

            String payload = objectMapper.writeValueAsString(event);
            webSocketHandler.broadcast(payload);
            log.info("已向 3D 客户端广播库存变动事件: {}", payload);
        } catch (Exception e) {
            log.error("广播库存变动事件失败: {}", e.getMessage());
        }
    }
}
