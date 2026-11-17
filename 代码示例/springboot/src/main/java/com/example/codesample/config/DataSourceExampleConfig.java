package com.example.codesample.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;

import javax.sql.DataSource;

/**
 * 数据库连接示例：手写 HikariCP 数据源、事务管理器和 MyBatis SqlSessionFactory。
 * <p>
 * 主工程 dianshanRag 没有这份类。它靠 application.yaml 的 spring.datasource
 * 让 Spring Boot 自动配置连接池，再由 mybatis-plus-spring-boot starter 扫描 Mapper。
 * 本类把自动配置里看不见的对象写出来，方便对照连接是怎么建立的。
 * <p>
 * 复制进一个已经启用数据源自动配置的工程时，保留其中一种即可：
 * 继续用 yaml 自动配置，就不要再声明 DataSource Bean。
 */
@Configuration
@MapperScan("com.example.codesample.mapper")
public class DataSourceExampleConfig {

    /**
     * 连接池。业务代码注入的是 DataSource 接口，不直接依赖 Hikari 的实现类。
     * <p>
     * getConnection() 从池中借出一条物理连接；close() 归还到池中，不是断开 MySQL。
     */
    @Bean
    public DataSource dataSource(
            @Value("${spring.datasource.url}") String url,
            @Value("${spring.datasource.username}") String username,
            @Value("${spring.datasource.password}") String password,
            @Value("${spring.datasource.driver-class-name}") String driverClassName) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName(driverClassName);
        config.setPoolName("ExampleHikariPool");
        config.setMaximumPoolSize(20);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(30_000);
        config.setIdleTimeout(600_000);
        config.setMaxLifetime(1_800_000);
        // 借出前先探测，避免拿到已被 MySQL 关掉的空闲连接。
        config.setConnectionTestQuery("SELECT 1");
        return new HikariDataSource(config);
    }

    /**
     * MyBatis 的会话工厂。Mapper 接口的方法最终由它创建 SqlSession 并执行 SQL。
     * MyBatis-Plus 的 BaseMapper 也走这条工厂，不需要为单表查询再写 XML。
     */
    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
        SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
        factoryBean.setDataSource(dataSource);
        factoryBean.setMapperLocations(
                new PathMatchingResourcePatternResolver().getResources("classpath*:mapper/**/*.xml"));
        org.apache.ibatis.session.Configuration configuration = new org.apache.ibatis.session.Configuration();
        configuration.setMapUnderscoreToCamelCase(true);
        factoryBean.setConfiguration(configuration);
        return factoryBean.getObject();
    }

    /**
     * 事务管理器。@Transactional 方法通过它在同一条连接上 commit 或 rollback。
     * 没有它时，Spring 声明式事务不会作用到这个手写数据源上。
     */
    @Bean
    public DataSourceTransactionManager transactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
