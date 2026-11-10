package com.example.demo.service.merchant.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.demo.common.constant.RedisConstants;
import com.example.demo.common.exception.BusinessException;
import com.example.demo.entity.Product;
import com.example.demo.entity.Shelf;
import com.example.demo.mapper.ProductMapper;
import com.example.demo.mapper.ShelfMapper;
import com.example.demo.model.dto.MerchantProductSaveDTO;
import com.example.demo.service.merchant.MerchantService;
import com.example.demo.websocket.SupermarketEventPublisher;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 商户后台管理业务实现类
 */
@Service
public class MerchantServiceImpl implements MerchantService {

    private final ProductMapper productMapper;
    private final ShelfMapper shelfMapper;
    private final StringRedisTemplate redisTemplate;
    private final SupermarketEventPublisher eventPublisher;

    public MerchantServiceImpl(ProductMapper productMapper,
                               ShelfMapper shelfMapper,
                               StringRedisTemplate redisTemplate,
                               SupermarketEventPublisher eventPublisher) {
        this.productMapper = productMapper;
        this.shelfMapper = shelfMapper;
        this.redisTemplate = redisTemplate;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public Page<Product> listProducts(int page, int size, String keyword, String status) {
        Page<Product> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<Product> query = new LambdaQueryWrapper<>();

        if (keyword != null && !keyword.isBlank()) {
            query.like(Product::getName, keyword.trim());
        }
        if (status != null && !status.isBlank()) {
            query.eq(Product::getStatus, status.trim());
        }
        query.orderByDesc(Product::getId);

        return productMapper.selectPage(pageParam, query);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Product createProduct(MerchantProductSaveDTO dto) {
        if (dto == null || dto.getName() == null || dto.getName().isBlank()) {
            throw new BusinessException(400, "商品名称不能为空");
        }
        if (dto.getPrice() == null) {
            throw new BusinessException(400, "商品价格不能为空");
        }

        Product product = new Product();
        product.setName(dto.getName().trim());
        product.setShelfId(dto.getShelfId());
        product.setCategory(dto.getCategory());
        product.setPrice(dto.getPrice());
        product.setStock(dto.getStock() != null ? dto.getStock() : 0);
        product.setStatus(dto.getStatus() != null ? dto.getStatus() : "ON_SHELF");
        product.setDescription(dto.getDescription());
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());

        productMapper.insert(product);

        // 如果关联了货架，触发一次广播事件更新货架状态
        if (product.getShelfId() != null) {
            eventPublisher.publishInventoryChanged(product.getId(), product.getStock());
        }

        return product;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Product updateProduct(Long id, MerchantProductSaveDTO dto) {
        Product product = productMapper.selectById(id);
        if (product == null) {
            throw new BusinessException(404, "商品不存在");
        }

        if (dto.getName() != null && !dto.getName().isBlank()) {
            product.setName(dto.getName().trim());
        }
        if (dto.getShelfId() != null) {
            product.setShelfId(dto.getShelfId());
        }
        if (dto.getCategory() != null) {
            product.setCategory(dto.getCategory());
        }
        if (dto.getPrice() != null) {
            product.setPrice(dto.getPrice());
        }
        if (dto.getStock() != null) {
            product.setStock(dto.getStock());
        }
        if (dto.getStatus() != null) {
            product.setStatus(dto.getStatus());
        }
        if (dto.getDescription() != null) {
            product.setDescription(dto.getDescription());
        }
        product.setUpdatedAt(LocalDateTime.now());

        productMapper.updateById(product);

        // 清理 Redis 缓存保证一致性
        redisTemplate.delete(RedisConstants.PRODUCT_CACHE_PREFIX + id);

        // 触发 WebSocket 实时广播
        eventPublisher.publishInventoryChanged(product.getId(), product.getStock());

        return product;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateProductStatus(Long id, String status) {
        Product product = productMapper.selectById(id);
        if (product == null) {
            throw new BusinessException(404, "商品不存在");
        }

        product.setStatus(status);
        product.setUpdatedAt(LocalDateTime.now());
        productMapper.updateById(product);

        // 清理 Redis 缓存
        redisTemplate.delete(RedisConstants.PRODUCT_CACHE_PREFIX + id);

        // 广播变动
        eventPublisher.publishInventoryChanged(id, product.getStock());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateProductStock(Long id, Integer newStock) {
        if (newStock == null || newStock < 0) {
            throw new BusinessException(400, "库存数量不能为负数");
        }

        Product product = productMapper.selectById(id);
        if (product == null) {
            throw new BusinessException(404, "商品不存在");
        }

        product.setStock(newStock);
        product.setUpdatedAt(LocalDateTime.now());
        productMapper.updateById(product);

        // 清理 Redis 缓存
        redisTemplate.delete(RedisConstants.PRODUCT_CACHE_PREFIX + id);

        // 实时向 3D 客户端广播库存变更与货架状态联动
        eventPublisher.publishInventoryChanged(id, newStock);
    }

    @Override
    public List<Shelf> listShelves() {
        return shelfMapper.selectList(new LambdaQueryWrapper<Shelf>()
                .orderByAsc(Shelf::getId));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Shelf saveShelf(Shelf shelf) {
        if (shelf == null || shelf.getShelfCode() == null || shelf.getShelfCode().isBlank()) {
            throw new BusinessException(400, "货架编码不能为空");
        }

        if (shelf.getId() != null) {
            shelf.setUpdatedAt(LocalDateTime.now());
            shelfMapper.updateById(shelf);
        } else {
            shelf.setCreatedAt(LocalDateTime.now());
            shelf.setUpdatedAt(LocalDateTime.now());
            shelf.setStatus("NORMAL");
            shelfMapper.insert(shelf);
        }
        return shelf;
    }
}
