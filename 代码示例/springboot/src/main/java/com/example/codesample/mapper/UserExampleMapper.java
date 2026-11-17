package com.example.codesample.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.codesample.entity.UserExample;
import org.apache.ibatis.annotations.Mapper;

/**
 * 单表访问。继承 BaseMapper 后即具备按主键查询、条件查询和插入，无需 XML。
 * <p>
 * 扫描入口在 {@code DataSourceExampleConfig} 的 @MapperScan。
 * 接口必须是 Spring 能扫到的 Mapper，业务层只注入这个接口，不手写 JDBC。
 */
@Mapper
public interface UserExampleMapper extends BaseMapper<UserExample> {
}
