# 电商企业级 RAG 知识库与 3D 数字孪生超市系统 - 产品需求与交付规格书 (PRD)

---

## 1. 文档概述与项目目标

### 1.1 项目定位
本项目面向电商企业业务场景，打造一套**高可靠、高并发、纯 Java 架构的企业级知识库问答智能体、3D 数字孪生超市与电商交易中台系统**。系统通过清晰的 MVC 分层结构，深度整合 LangChain4j、Chroma 向量数据库、原生 WebSocket 实时通信、Three.js 3D 空间直角坐标体系以及基于 Redis 5 的高并发电商交易核心能力。

### 1.2 核心目标
1. **3D 数字孪生空间建模与货架售罄联动**：支持 3D 空间坐标（X/Y/Z、朝向、相机飞掠注视点）的货架建模与商品绑定，提供全景 3D 初始化数据，货架售罄时实时状态联动；
2. **AI 导购机器人与清单巡航规划**：支持用户输入自由文本购物清单，智能体识别物品后，按空间就近原则生成最优漫游导览讲解与结构化 3D 航路点序列（Waypoints）；
3. **商户端后台管理**：支持商户商品的完整 CRUD、上下架切换（`ON_SHELF`/`OFF_SHELF`）、实时库存直接调控与货架点位维护；
4. **WebSocket 实时库存更新与售罄标红广播**：集成原生 Spring WebSocket，在用户下单或商户调库存时毫秒级广播变动，驱动前端 3D 货架变红警示；
5. **多格式私有知识库支持**：完整支持 PDF、Word (.docx)、Markdown 以及图片（本地 OCR）的自动化提取、切片、向量化与入库；
6. **精准多轮对话与来源溯源**：具备多轮上下文理解能力，智能体输出答案时附带精确文档来源、页码/段落与相似度评分；
7. **高并发电商交易护航**：涵盖商品浏览、购物车、下单核心业务，集成 **Redisson 分布式锁防超卖**、**Redis 缓存防穿透（空值缓存）** 与 **防雪崩（随机过期时间）**；
8. **纯后端交付与规范**：零前端依赖，提供纯 RESTful 接口与自动化单元测试，全中文详尽注释，代码结构严谨规范。

---

## 2. 详细功能需求规格 (FRD)

### 2.1 模块一：用户认证与安全体系 (Auth & Security)
- **用户注册与登录**：BCrypt 密码哈希，无状态 JWT Token（默认 24 小时）；
- **Spring Security 权限拦截**：
  - 公开白名单：`/api/auth/**`、商品浏览 `/api/products/**`、3D 超市场景 `/api/supermarket/**`、知识库公开问答、WebSocket 端点 `/ws/supermarket` 等；
  - 受保护接口：购物车 `/api/cart/**`、下单 `/api/order/**`、商户后台 `/api/merchant/**` 等要求携带 `Authorization: Bearer <token>`。

### 2.2 模块二：商品模块与高并发缓存设计 (Product & Caching)
- **商品详情与防穿透/防雪崩**：
  - **Cache-Aside 模式**：优先读取 Redis 缓存（`ecommerce:product:{id}`）；
  - **防穿透机制**：查询空对象写入空值标记（`{}`），TTL 60 秒；
  - **防雪崩机制**：基准 TTL 3600 秒叠加 0~300 秒随机抖动。

### 2.3 模块三：购物车管理 (Cart System)
- 登录用户增删查改购物车，计算商品小计金额与总价。

### 2.4 模块四：订单交易与分布式并发控制 (Order & Redisson Lock)
- **高并发下单防超卖**：Redisson 分布式锁（`lock:order:product:{productId}`），5s 等待 / 10s 租约自动续期；
- **库存扣减与广播联动**：原子扣减 MySQL 库存，成功后主动清理 Redis 缓存并触发 WebSocket 库存变动广播。

### 2.5 模块五：多源文档解析管道 (Document Parsing Pipeline)
- 支持 PDF（PDFBox 按页解析）、Word（POI 解析段落表格）、Markdown、图片纯本地 OCR（Tess4J）提取与滑动窗口递归切片（300/30），保留元数据。

### 2.6 模块六：双模式 Embedding 与 Chroma 向量库
- 支持 `local`（内置 ONNX BGE-Small-ZH 模型）与 `online`（OpenAI 兼容接口）一键切换；
- Chroma 连接器，支持未连通时自动降级为 `InMemoryEmbeddingStore`。

### 2.7 模块七：多轮对话 RAG 智能体与引用溯源 (Agent & Citation)
- `ChatMemory` 会话记忆，结构化来源引用清单 `[引用1: 文件名 第X页 (匹配度)]`；挂载商品查询 `@Tool`。

### 2.8 模块八：3D 孪生超市空间建模与全景场景服务 (3D Supermarket Scene)
- **空间坐标规范**：采用 Three.js / WebGL 标准空间直角坐标系（以米为单位，右手系，Y 轴垂直朝上）；
- **货架实体表**：记录货架编码（如 A01）、货架名称、分区名称、三维坐标 `(X, Y, Z)`、货架朝向角 `rotationY`、推荐飞掠注视点 `cameraTarget (X, Y, Z)` 以及状态（`NORMAL`/`OUT_OF_STOCK`）；
- **3D 全景场景初始化接口** (`GET /api/supermarket/scene`)：下发全场货架清单、每个货架上绑定的在架商品列表、初始相机 Spawn 点位与漫游边界；
- **商品空间定位检索** (`GET /api/supermarket/products/search`)：根据关键词搜索商品，返回商品详情及其所在货架的三维空间点位与相机飞掠目标点，前端点击直接执行运镜飞行。

### 2.9 模块九：商户端后台管理系统 (Merchant Admin Dashboard)
- **极简单门店模型**：商户后台即为管理员后台；
- **商品管理**：商户端商品分页列表、新增商品（绑定货架）、编辑商品；
- **上下架管理**：`PUT /api/merchant/products/{id}/status` 切换 `ON_SHELF` / `OFF_SHELF`；
- **实时库存调控**：`PUT /api/merchant/products/{id}/stock` 调整库存，立刻更新数据库、清理 Redis 缓存，并向 3D 客户端广播变动。

### 2.10 模块十：AI 导购机器人与购物清单空间巡航规划 (AI Guide Robot)
- **清单识别**：接收用户自由文本购物清单（`POST /api/supermarket/guide/route`）；
- **空间就近路径规划**：基于最近邻欧氏距离算法（Nearest Neighbor Search）对匹配到的货架坐标进行就近拓扑排序；
- **结构化航路点输出**：返回自然语言导览讲解 `summary`、排序后的航路点数组 `waypoints`（包含步骤编号、商品信息、货架三维坐标、相机目标点、售罄警示）以及未匹配商品列表。

### 2.11 模块十一：WebSocket 实时通信与货架售罄标红广播 (Real-time WebSocket)
- **通信端点**：`ws://localhost:8080/ws/supermarket`（支持跨域连接）；
- **触发场景**：
  1. 用户下单成功扣减库存；
  2. 商户后台调整商品库存；
  3. 商户后台上下架商品。
- **广播协议报文格式**：
  ```json
  {
    "event": "INVENTORY_CHANGED",
    "productId": 1,
    "productName": "纯牛奶",
    "shelfId": 2,
    "shelfCode": "A02",
    "stock": 0,
    "isOutOfStock": true,
    "timestamp": 1731234567890
  }
  ```
- **3D 前端联动**：前端监听消息，当 `isOutOfStock: true` 时将 3D 货架材质着色为红色；补货后恢复原色。

---

## 3. 数据库表结构设计 (MySQL DDL)

```sql
-- 1. 用户表
CREATE TABLE IF NOT EXISTS `user` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(64) NOT NULL UNIQUE,
  `password` VARCHAR(128) NOT NULL,
  `phone` VARCHAR(32) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 货架表 (3D 空间孪生)
CREATE TABLE IF NOT EXISTS `shelf` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `shelf_code` VARCHAR(32) NOT NULL UNIQUE COMMENT '货架唯一逻辑编码，如 A01',
  `name` VARCHAR(128) NOT NULL COMMENT '货架名称',
  `zone` VARCHAR(64) NOT NULL COMMENT '所属分区 (生鲜/冷藏/食品/数码等)',
  `position_x` DOUBLE NOT NULL DEFAULT 0.0 COMMENT 'Three.js X坐标',
  `position_y` DOUBLE NOT NULL DEFAULT 0.0 COMMENT 'Three.js Y坐标(高度)',
  `position_z` DOUBLE NOT NULL DEFAULT 0.0 COMMENT 'Three.js Z坐标',
  `rotation_y` DOUBLE NOT NULL DEFAULT 0.0 COMMENT '货架朝向角',
  `camera_target_x` DOUBLE NOT NULL DEFAULT 0.0 COMMENT '相机注视点X',
  `camera_target_y` DOUBLE NOT NULL DEFAULT 1.5 COMMENT '相机注视点Y',
  `camera_target_z` DOUBLE NOT NULL DEFAULT 2.0 COMMENT '相机注视点Z',
  `status` VARCHAR(32) NOT NULL DEFAULT 'NORMAL' COMMENT 'NORMAL:正常, OUT_OF_STOCK:售罄标红',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 商品表 (扩展 shelf_id 与 status)
CREATE TABLE IF NOT EXISTS `product` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `shelf_id` BIGINT DEFAULT NULL COMMENT '关联绑定的货架ID',
  `name` VARCHAR(128) NOT NULL COMMENT '商品名称',
  `category` VARCHAR(64) NOT NULL COMMENT '分类',
  `price` DECIMAL(10,2) NOT NULL COMMENT '售价',
  `stock` INT NOT NULL DEFAULT 0 COMMENT '库存',
  `status` VARCHAR(32) NOT NULL DEFAULT 'ON_SHELF' COMMENT '状态: ON_SHELF 在架, OFF_SHELF 下架',
  `description` VARCHAR(1000) DEFAULT NULL COMMENT '商品介绍',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 购物车项表
CREATE TABLE IF NOT EXISTS `cart_item` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `product_id` BIGINT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. 订单主表
CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `order_no` VARCHAR(64) NOT NULL UNIQUE,
  `user_id` BIGINT NOT NULL,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. 订单明细项表
CREATE TABLE IF NOT EXISTS `order_item` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT NOT NULL,
  `product_id` BIGINT NOT NULL,
  `product_name` VARCHAR(128) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1
);

-- 7. 知识库文档记录表
CREATE TABLE IF NOT EXISTS `knowledge_document` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `file_name` VARCHAR(255) NOT NULL,
  `file_type` VARCHAR(32) NOT NULL,
  `file_size` BIGINT NOT NULL,
  `chunk_count` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. RESTful API 与 WebSocket 接口契约

### 4.1 3D 超市场景与空间检索 (`/api/supermarket`)
| 接口方法与路径 | 请求格式 | 说明 |
| :--- | :--- | :--- |
| `GET /api/supermarket/scene` | 无 | 获取 3D 超市全景场景树（货架、商品、相机初始点与售罄状态） |
| `GET /api/supermarket/products/search` | Query: `?keyword=...` | 空间定位检索，返回匹配商品及其货架 3D 飞掠坐标 |
| `POST /api/supermarket/guide/route` | JSON: `{ "shoppingListText": "..." }` | AI 导购机器人解析清单并生成最优 3D 巡航航路点 |

### 4.2 商户管理模块 (`/api/merchant`)
| 接口方法与路径 | 请求格式 | 说明 |
| :--- | :--- | :--- |
| `GET /api/merchant/products` | Query: `?page=1&size=10&keyword=...` | 商户后台商品分页查询 |
| `POST /api/merchant/products` | JSON: `{ name, shelfId, price, stock, category, description }` | 新增商品 |
| `PUT /api/merchant/products/{id}` | JSON: 商品修改字段 | 编辑商品 |
| `PUT /api/merchant/products/{id}/status` | Query: `?status=ON_SHELF/OFF_SHELF` | 商品上下架切换 |
| `PUT /api/merchant/products/{id}/stock` | Query: `?stock=10` | 快速修改库存（触发 WebSocket 广播） |
| `GET /api/merchant/shelves` | 无 | 获取所有 3D 货架列表 |
| `POST /api/merchant/shelves` | JSON: `{ shelfCode, name, zone, positionX, positionY, positionZ, cameraTargetX, ... }` | 新增/修改货架点位 |

### 4.3 WebSocket 实时推送端点
- **连接 URL**：`ws://localhost:8080/ws/supermarket`
- **客户端收到事件样例**：
  ```json
  {
    "event": "INVENTORY_CHANGED",
    "productId": 1,
    "productName": "iPhone 16 Pro Max 256GB 暗夜黑",
    "shelfId": 6,
    "shelfCode": "F01",
    "stock": 0,
    "isOutOfStock": true,
    "timestamp": 1731234567890
  }
  ```

---

## 5. 交付物检查清单

1. [x] **升级设计方案与架构对齐**；
2. [x] **更新核心文档**（`AGENTS.md`、`docs/PRD.md`、`docs/HOW_TO_TEST.md`）；
3. [ ] **依赖配置**（升级 `pom.xml` 引入 `spring-boot-starter-websocket`）；
4. [ ] **数据层脚本与实体映射**（`schema.sql`、`data.sql`、`Shelf`、`ShelfMapper`、`Product`）；
5. [ ] **WebSocket 通信通道**（`WebSocketConfig`、`SupermarketWebSocketHandler`、`SupermarketEventPublisher`）；
6. [ ] **3D 超市场景与空间检索 API**（`SupermarketSceneController`、`SupermarketSceneService`）；
7. [ ] **商户端管理后台接口**（`MerchantProductController`、`MerchantShelfController`、`MerchantService`）；
8. [ ] **AI 导购机器人巡航规划引擎**（`AiGuideAgentService`、`AiGuideController`）；
9. [ ] **下单库存扣减与广播联动**（`OrderServiceImpl`）；
10. [ ] **自动化测试套件与全量验证**。
