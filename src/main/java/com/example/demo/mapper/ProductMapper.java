package com.example.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.demo.entity.Product;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

/**
 * 商品持久层 Mapper
 */
@Mapper
public interface ProductMapper extends BaseMapper<Product> {

    /**
     * 原子扣减商品库存 (CAS 乐观锁防超卖兜底)
     *
     * @param productId 商品主键 ID
     * @param quantity  扣减数量
     * @return 影响行数 (1 为扣减成功，0 为库存不足)
     */
    @Update("UPDATE product SET stock = stock - #{quantity}, updated_at = CURRENT_TIMESTAMP WHERE id = #{productId} AND stock >= #{quantity}")
    int deductStock(@Param("productId") Long productId, @Param("quantity") Integer quantity);
}
