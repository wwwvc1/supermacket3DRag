package com.example.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.demo.entity.Shelf;
import org.apache.ibatis.annotations.Mapper;

/**
 * 3D 货架持久层 Mapper
 */
@Mapper
public interface ShelfMapper extends BaseMapper<Shelf> {
}
