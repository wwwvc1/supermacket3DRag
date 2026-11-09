# 电商企业级 RAG 知识库智能体系统 - 产品需求与交付规格书 (PRD)

---

## 1. 文档概述与项目目标

### 1.1 项目定位
本项目面向电商企业业务场景，打造一套**高可靠、高内聚、纯 Java 架构的企业级知识库问答智能体与电商中台后端系统**。系统通过清晰的 MVC 分层结构，深度整合 LangChain4j、Chroma 向量数据库、双模式 Embedding、多源文档解析管道以及基于 Redis 5 的高并发电商交易核心能力。

### 1.2 核心目标
1. **多格式私有知识库支持**：完整支持 PDF、Word (.docx)、Markdown 以及图片（本地 OCR）的自动化提取、切片、向量化与入库；
2. **精准多轮对话与来源溯源**：具备多轮上下文理解能力，智能体输出答案时必须附带精确的文档来源、页码/段落与相似度评分，确保回答真实可查；
3. **模型灵活切换**：支持 OpenAI 兼容格式大模型接入，且 Embedding 模型支持在 JVM 内置轻量 ONNX 小模型与云端 API 之间一键切换；
4. **高并发电商交易护航**：覆盖商品浏览、购物车、下单核心业务，集成 **Redisson 分布式锁防超卖**，以及 **Redis 缓存防穿透（空值缓存）** 与 **防雪崩（随机过期时间）**；
5. **纯后端交付与规范**：零前端依赖，提供纯 RESTful 接口与自动化单元测试，全中文详尽注释，代码结构严谨规范。

---

## 2. 详细功能需求规格 (FRD)

### 2.1 模块一：用户认证与安全体系 (Auth & Security)
- **用户注册**：支持用户名、密码、手机号注册，密码使用 BCrypt 强哈希算法加密存储，用户名唯一性校验；
- **用户登录**：校验用户名与密码，认证成功后签发无状态 JWT Token（默认有效期 24 小时）；
- **Spring Security 权限拦截**：
  - 公开白名单：`/api/auth/**`、商品浏览接口 `/api/products/**`、文档与问答公共查询等；
  - 受保护接口：购物车 `/api/cart/**`、下单 `/api/order/**` 等必须在 HTTP 请求头中携带 `Authorization: Bearer <token>`；
  - 自定义 `JwtAuthenticationFilter` 解析 Token，将用户信息自动绑定至 Spring Security 上下文。

### 2.2 模块二：商品模块与高并发缓存设计 (Product & Caching)
- **商品首页与列表**：支持按分类、关键词分页浏览商品；
- **商品详情与防穿透/防雪崩**：
  - **Cache-Aside 模式**：优先读取 Redis 缓存（Key: `ecommerce:product:{id}`），命中则直接返回；
  - **防穿透机制**：若数据库查询结果为空，向 Redis 写入空值标记（如 `"{}"` 或特殊空哨兵），并设置短期 TTL（60 秒），防止恶意 ID 高频打穿数据库；
  - **防雪崩机制**：正常商品缓存基准 TTL 设为 3600 秒（1小时），写入时叠加随机抖动时间（`ThreadLocalRandom.current().nextInt(0, 300)` 秒），避免海量热点商品在同一时刻集中失效。

### 2.3 模块三：购物车管理 (Cart System)
- **添加购物车**：登录用户将指定商品添加至购物车，若购物车已有则累加数量；
- **查看购物车**：获取当前登录用户的购物车商品明细（包含商品名称、单价、购买数量、小计金额）；
- **修改与移除**：支持变更商品数量以及移除单项/清空购物车。

### 2.4 模块四：订单交易与分布式并发控制 (Order & Redisson Lock)
- **高并发下单防超卖**：
  - 核心痛点：高并发秒杀或多人同时购买同一商品时，防止库存扣减穿透与负库存超卖；
  - **Redisson 分布式锁**：针对商品维度加锁（Lock Key: `lock:order:product:{productId}`），通过 `rLock.tryLock(5, 10, TimeUnit.SECONDS)` 安全加锁；
  - **库存原子校验与扣减**：在分布式锁保护的临界区内，校验库存是否充足，扣减 MySQL 库存，生成唯一订单流水号（Order No）；
  - **释放锁保障**：在 `finally` 块中通过 `rLock.isHeldByCurrentThread()` 安全释放锁，结合 Redisson 看门狗机制防止死锁。
- **订单查询**：用户可分页查询本人的历史订单及明细。

### 2.5 模块五：多源文档解析管道 (Document Parsing Pipeline)
- **支持格式与解析引擎**：
  - **PDF**：集成 Apache PDFBox，提取各页文字并记录精准页码（Page Index）；
  - **Word (.docx)**：集成 Apache POI，解析段落、表格与标题结构；
  - **Markdown (.md)**：按章节/标题结构切片，保留层级上下文；
  - **图片 (JPG/PNG)**：集成纯本地 OCR 模块提取图片中可见文本，无需消耗云端视觉 Token。
- **文本分块策略 (Text Chunking)**：
  - 采用滑动窗口递归切分（默认 Chunk Size: 300 字符，Overlap: 30 字符）；
  - 每个切片均附带丰富的元数据 Metadata（`document_id`, `file_name`, `page_number`, `chunk_index`, `created_at`）。

### 2.6 模块六：双模式 Embedding 与 Chroma 向量库
- **向量存储**：
  - 主引擎：`ChromaEmbeddingStore`，通过 HTTP 协议对接 ChromaDB；
  - 容灾与本地轻量测试：支持配置一键降级为 `InMemoryEmbeddingStore`，无需外部 Docker 容器即可直接启动与跑通所有测试。
- **Embedding 动态切换（策略工厂）**：
  - 通过配置 `rag.embedding.provider: local | online` 动态决议；
  - **本地模型 (Local)**：JVM 内置 ONNX 运行时加载 `BGE-Small-ZH` 模型，纯 Java 进程内计算向量，零外部依赖；
  - **云端模型 (Online)**：标准化对接 OpenAI 兼容 Embedding 接口（如 text-embedding-3-small）。

### 2.7 模块七：多轮对话 RAG 智能体与引用溯源 (Agent & Citation)
- **多轮会话记忆**：基于 LangChain4j `ChatMemory`（如 `MessageWindowChatMemory`），以 `session_id` 区分独立会话上下文；
- **智能体意图识别与工具调用**：
  - 智能体搭载电商商品查询工具（`@Tool`：根据品类或名称查询当前商品库实时价格与库存）；
- **知识检索与引用溯源输出**：
  - 检索召回 Top-K 相关文本切片（默认 K=3，相似度阈值 0.6）；
  - 将切片与元数据注入 Prompt 上下文；
  - 智能体生成结构化回答，并在回答尾部以规范格式输出溯源引用清单：
    ```text
    根据知识库内容，iPhone 16 支持 25W 快速无线充电 [引用1]，退换货政策为签收后 7 天无理由退货 [引用2]。

    【参考来源与溯源】
    - [引用1] 《产品规格手册.pdf》 第 5 页 (匹配度: 0.91)
    - [引用2] 《售后服务政策.docx》 第 2 节 (匹配度: 0.86)
    ```

---

## 3. 数据库表结构设计 (MySQL DDL)

```sql
-- 1. 用户表
CREATE TABLE `user` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户主键ID',
  `username` VARCHAR(64) NOT NULL UNIQUE COMMENT '用户名',
  `password` VARCHAR(128) NOT NULL COMMENT 'BCrypt哈希密码',
  `phone` VARCHAR(32) DEFAULT NULL COMMENT '手机号',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 2. 商品表
CREATE TABLE `product` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '商品主键ID',
  `name` VARCHAR(128) NOT NULL COMMENT '商品名称',
  `category` VARCHAR(64) NOT NULL COMMENT '分类',
  `price` DECIMAL(10,2) NOT NULL COMMENT '价格',
  `stock` INT NOT NULL DEFAULT 0 COMMENT '库存',
  `description` TEXT DEFAULT NULL COMMENT '商品介绍',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';

-- 3. 购物车表
CREATE TABLE `cart_item` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `product_id` BIGINT NOT NULL COMMENT '商品ID',
  `quantity` INT NOT NULL DEFAULT 1 COMMENT '加购数量',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_product` (`user_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='购物车项表';

-- 4. 订单主表
CREATE TABLE `orders` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '订单主键ID',
  `order_no` VARCHAR(64) NOT NULL UNIQUE COMMENT '唯一订单编号',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `total_amount` DECIMAL(10,2) NOT NULL COMMENT '总金额',
  `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING' COMMENT '状态: PENDING/PAID/CANCELLED',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- 5. 订单明细表
CREATE TABLE `order_item` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` BIGINT NOT NULL COMMENT '关联订单ID',
  `product_id` BIGINT NOT NULL COMMENT '商品ID',
  `product_name` VARCHAR(128) NOT NULL COMMENT '商品快照名称',
  `price` DECIMAL(10,2) NOT NULL COMMENT '购买单价快照',
  `quantity` INT NOT NULL DEFAULT 1 COMMENT '购买数量',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单明细表';

-- 6. 知识库文档记录表
CREATE TABLE `knowledge_document` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `file_name` VARCHAR(255) NOT NULL COMMENT '原始文件名',
  `file_type` VARCHAR(32) NOT NULL COMMENT '文档类型: PDF/DOCX/MD/IMAGE',
  `file_size` BIGINT NOT NULL COMMENT '文件字节大小',
  `chunk_count` INT NOT NULL DEFAULT 0 COMMENT '切片数量',
  `status` VARCHAR(32) NOT NULL DEFAULT 'SUCCESS' COMMENT '处理状态',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识库文档记录表';
```

---

## 4. RESTful API 接口契约定义

统一响应封装规范：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": { ... }
}
```

### 4.1 认证模块 (`/api/auth`)
| 接口方法与路径 | 请求格式 | 说明 |
| :--- | :--- | :--- |
| `POST /api/auth/register` | JSON: `{ "username": "...", "password": "...", "phone": "..." }` | 用户注册 |
| `POST /api/auth/login` | JSON: `{ "username": "...", "password": "..." }` | 用户登录，返回 JWT Token |

### 4.2 商品模块 (`/api/products`)
| 接口方法与路径 | 请求格式 | 说明 |
| :--- | :--- | :--- |
| `GET /api/products` | Query: `?page=1&size=10&keyword=...` | 分页浏览商品列表 |
| `GET /api/products/{id}` | Path 变量 | 商品详情（带 Redis 缓存、防穿透与防雪崩机制） |

### 4.3 购物车模块 (`/api/cart`)
| 接口方法与路径 | 请求格式 | 说明 |
| :--- | :--- | :--- |
| `POST /api/cart/add` | Header Bearer, JSON: `{ "productId": 1, "quantity": 1 }` | 加入购物车 |
| `GET /api/cart/list` | Header Bearer | 查看当前用户购物车明细与汇总 |
| `DELETE /api/cart/{id}` | Header Bearer | 从购物车中移除指定商品 |

### 4.4 订单模块 (`/api/order`)
| 接口方法与路径 | 请求格式 | 说明 |
| :--- | :--- | :--- |
| `POST /api/order/create` | Header Bearer, JSON: `{ "items": [{ "productId": 1, "quantity": 2 }] }` | 下单（Redisson 锁防超卖扣减库存） |
| `GET /api/order/my-orders` | Header Bearer | 分页查询当前用户订单 |

### 4.5 知识库与 RAG 智能体 (`/api/rag`)
| 接口方法与路径 | 请求格式 | 说明 |
| :--- | :--- | :--- |
| `POST /api/rag/upload` | Multipart/form-data: `file` | 上传多格式文档（PDF/Word/MD/图片）入库切片 |
| `POST /api/rag/chat` | JSON: `{ "sessionId": "...", "question": "..." }` | 多轮对话与精准来源溯源问答 |

---

## 5. 项目交付物检查清单 (Deliverables)

1. [x] **架构设计规格书**：完整的架构设计决策与本文档 PRD；
2. [ ] **Maven 依赖与配置工程**：升级 `pom.xml`，完善 `application.yaml`（支持双 Embedding 模式、Chroma/内存备用、Redis、MySQL 配置）；
3. [ ] **数据库脚本**：`src/main/resources/sql/schema.sql` 和 `data.sql`（含示例商品与测试数据）；
4. [ ] **电商业务与高并发核心代码**：用户、商品、购物车、订单、Redisson 分布式锁、缓存防穿透/防雪崩实现；
5. [ ] **RAG 知识库与智能体核心代码**：PDF/Word/MD/OCR 解析器、本地/云端 Embedding 工厂、Chroma 适配器、多轮记忆与溯源智能体；
6. [ ] **自动化测试套件**：全量 Controller 与核心功能集成单元测试；
7. [ ] **测试与运行指导文档**：`docs/HOW_TO_TEST.md`。
