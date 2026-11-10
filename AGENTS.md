# AGENTS.md - 电商企业级 RAG 知识库与 3D 数字孪生超市系统开发指南

本文档为参与本项目（`dianshanRag`）的所有 AI 智能体与开发人员提供统一的技术规范、架构准则和实施约束。所有代码修改、功能新增和重构均必须严格遵循本指南。

---

## 一、 项目背景与核心愿景

本项目是一个面向电商企业的**高可靠、高并发、企业级 RAG 知识库智能体后端系统**，并在核心电商交易与私有知识库检索增强生成（RAG）的基础上，全面融合了面向 **3D 数字孪生超市（3D Digital Twin Supermarket）与 AI 导购机器人巡航（AI Shopping Guide Robot）** 的纯后端能力。

系统不仅涵盖完整的电商中台核心交易链路（JWT、MyBatis-Plus、Redis 缓存防穿透/防雪崩、Redisson 分布式锁防超卖），还通过原生 WebSocket 驱动 3D 超市中货架售罄标红与实时库存变动刷新，并通过 LangChain4j 驱动 AI 导购机器人解析用户清单规划空间最优巡航路径。

---

## 二、 核心技术栈与刚性约束

| 维度 | 技术选型 | 强制约束与说明 |
| :--- | :--- | :--- |
| **语言与框架** | **Java 21 (LTS) + Spring Boot 4.1.2** | 纯 Java 原生单体工程，严禁引入 Python 等跨语言环境依赖。 |
| **代码规范** | **标准 MVC 分层 + 全中文注释** | 严格遵循 Controller -> Service -> Mapper/DAO -> Entity 架构，所有核心类、方法、关键业务分支必须包含清晰规范的**中文注释**。 |
| **持久层** | **MySQL + MyBatis-Plus 3.5.x** | 单表操作基于 MyBatis-Plus BaseMapper，复杂联查统一规范管理；提供建表与初始化 SQL 脚本。 |
| **高并发与缓存** | **Redis 5 + Redisson 官方 Starter** | 1. **分布式锁**：必须使用 Redisson 可重入锁（`RLock`）实现商品库存扣减与防超卖；<br>2. **缓存防穿透**：查询空对象必须在 Redis 中缓存空值标记（短 TTL）；<br>3. **缓存防雪崩**：缓存过期时间必须叠加随机抖动值（Random Jitter）。 |
| **安全体系** | **Spring Security + JWT** | 基于 `SecurityFilterChain` 的无状态过滤，Header 传递 `Authorization: Bearer <token>`，自动维护安全上下文。 |
| **AI / RAG 引擎** | **LangChain4j (Java 统一生态)** | 统一对接 OpenAI 兼容格式大模型（支持 DeepSeek / Qwen / GPT / 本地 Ollama）。 |
| **3D 空间孪生建模** | **Three.js / WebGL 标准空间坐标系** | 独立 `shelf` 货架实体表，三维世界坐标遵循右手系（Y 轴垂直朝上，X 轴横向，Z 轴纵深，以米为单位）；商品关联 `shelf_id`。 |
| **实时通信广播** | **Spring 原生 WebSocket (`/ws/supermarket`)** | 无论用户下单扣减库存还是商户后台改库存，均向全场 3D 客户端广播 JSON 变动事件；商品售罄时货架联动标红。 |
| **AI 导购机器人** | **清单意图识别 + 空间就近路径规划** | 智能体解析自由文本购物清单，匹配店内商品与 3D 坐标，按最近邻算法输出导购说明与结构化 3D 航路点序列（Waypoints）。 |
| **商户后台体系** | **单门店极简管理端 (`/api/merchant/...`)** | 支持商户商品 CRUD、上下架切换（`ON_SHELF`/`OFF_SHELF`）、实时库存调控与货架点位维护。 |
| **向量数据库** | **ChromaDB + 内存备用兜底** | 生产使用 `ChromaEmbeddingStore`；同时配置支持自动降级为 `InMemoryEmbeddingStore`，确保无容器环境下本地自测秒级跑通。 |
| **Embedding 策略** | **双引擎动态切换（工厂模式）** | 通过 `application.yaml` 配置属性一键切换本地 JVM 内置 ONNX 模型与云端 OpenAI 兼容 API。 |
| **文档与多模态** | **PDF / Word / Markdown / 本地 OCR** | 支持上传与解析 `.pdf`、`.docx`、`.md` 及图片文件（图片通过纯本地 OCR 提取文字与元数据入库）。 |
| **溯源与智能体** | **精准来源引用 + 多轮记忆 + Tool** | 1. **多轮问答**：基于 `ChatMemory` 维护上下文；<br>2. **精准溯源**：回答必须在末尾标准化附带 `[引用1: 文件名 第X页/段落]` 溯源列表；<br>3. **业务联动**：智能体通过 `@Tool` 注解挂载电商商品实时查询能力。 |

---

## 三、 工程目录与包结构规范

```text
src/main/java/com/example/demo/
├── DemoApplication.java            # Spring Boot 启动入口
├── common/                         # 公共组件与基础设施
│   ├── exception/                  # 全局异常捕获与业务异常定义
│   ├── result/                     # 统一 API 响应包装（Result<T>）
│   ├── util/                       # JWT 工具类、密码加密工具等
│   └── constant/                   # 系统常量、Redis Key 前缀等
├── config/                         # 核心配置类
│   ├── SecurityConfig.java         # Spring Security 拦截规则与 Filter 配置
│   ├── RedisConfig.java            # Redisson 与 RedisTemplate 配置
│   ├── MyBatisPlusConfig.java      # MyBatis-Plus 分页插件等配置
│   ├── RagConfig.java              # LangChain4j、Chroma、Embedding 策略装配
│   └── WebSocketConfig.java        # 原生 WebSocket 端点与跨域配置
├── websocket/                      # WebSocket 实时通信组件
│   ├── SupermarketWebSocketHandler.java # 客户端连接池管理与消息通道
│   └── SupermarketEventPublisher.java   # 库存变动与售罄标红广播发布器
├── controller/                     # MVC 控制器层（RESTful API）
│   ├── AuthController.java         # 用户注册、登录、Token 刷新
│   ├── ProductController.java      # 商品列表、详情（Redis 缓存/防穿透/防雪崩）
│   ├── CartController.java         # 购物车增删改查
│   ├── OrderController.java        # 下单结算（Redisson 分布式锁防超卖）
│   ├── RagController.java          # 文档上传、知识库检索、多轮对话智能体
│   ├── SupermarketSceneController.java  # 3D 场景初始化全景、空间商品搜索直飞
│   ├── MerchantProductController.java   # 商户端商品 CRUD、上下架、库存调整
│   ├── MerchantShelfController.java     # 商户端 3D 货架空间点位维护
│   └── AiGuideController.java      # AI 导购机器人清单空间巡航规划
├── entity/                         # 数据库实体（User, Product, Shelf, CartItem, Orders...）
├── mapper/                         # MyBatis-Plus Mapper 接口
├── model/                          # 数据传输模型
│   ├── dto/                        # 接收请求入参 DTO
│   └── vo/                         # 返回前端出参 VO
├── service/                        # 业务逻辑接口及实现
│   ├── UserService.java / impl/
│   ├── ProductService.java / impl/
│   ├── CartService.java / impl/
│   ├── OrderService.java / impl/
│   ├── merchant/MerchantService.java / impl/ # 商户管理业务
│   ├── supermarket/SupermarketSceneService.java # 3D 空间组装与检索业务
│   └── rag/                        # RAG 与智能体服务
│       ├── DocumentParserService.java  # PDF/Word/MD/OCR 多源解析
│       ├── EmbeddingStrategyFactory.java # 本地/云端 Embedding 动态工厂
│       ├── RagAgentService.java        # 知识库问答、多轮记忆与溯源组装
│       ├── AiGuideAgentService.java    # AI 导购机器人清单寻路规划引擎
│       └── tool/EcommerceTools.java    # 挂载供智能体调用的商品查询工具
└── security/                       # 安全过滤器与上下文
    └── JwtAuthenticationFilter.java
```

---

## 四、 核心设计模式与技术落地要点

### 1. 3D 空间孪生货架与动态标红机制
- 货架坐标存储结构：`position: {x, y, z}`, `cameraTarget: {x, y, z}`, `rotationY`, `zone`。
- 联动逻辑：当货架上所有陈列商品的 `stock` 均降为 0 或下架时，货架状态置为 `OUT_OF_STOCK`。前端 3D 场景接收到 WebSocket 事件后将货架网格模型着色为警示红。

### 2. WebSocket 实时事件驱动设计
- 端点：`ws://localhost:8080/ws/supermarket`。
- 广播场景：
  - 用户下单扣减库存（Redisson 锁保护成功后）；
  - 商户后台快速修改库存（`PUT /api/merchant/products/{id}/stock`）；
  - 商户后台修改商品上下架（`PUT /api/merchant/products/{id}/status`）。
- 广播报文结构：
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

### 3. AI 导购机器人与最优巡航算法
- 意图提取：大模型解析用户清单中的商品词汇；
- 候选匹配：通过商品数据库与向量模型匹配店内在售商品；
- 空间拓扑排序：以起点 `(0, 1.5, 0)` 出发，按最近邻欧氏距离排序货架三维坐标，输出结构化 3D 巡航航路点数组：
  ```json
  {
    "summary": "为您规划了前往生鲜区与冷藏区的最优路线...",
    "waypoints": [
      {
        "step": 1,
        "product": { "id": 1, "name": "红富士苹果", "price": 8.5, "stock": 50 },
        "shelf": {
          "code": "A01",
          "name": "生鲜果蔬货架",
          "zone": "生鲜区",
          "position": { "x": -5.0, "y": 0.0, "z": -10.0 },
          "cameraTarget": { "x": -5.0, "y": 1.5, "z": -8.0 }
        },
        "isOutOfStock": false
      }
    ],
    "unmatchedItems": []
  }
  ```

---

## 五、 智能体协作与代码修改规则

1. **坚持测试驱动与自测验证**：新增或修改功能时，必须保证 `mvn clean test` 编译与测试通过。
2. **严禁破坏文档注释**：所有类、公共方法、复杂算法（如分布式锁、切片逻辑、空间路径规划）必须保留完整中文注释。
3. **保持轻量与单一职责**：不要引入未经批准的额外重型框架。
4. **提交与交付准则**：代码交付时，需同步校验 PRD 需求清单与 HOW_TO_TEST 操作手册的对齐情况。
