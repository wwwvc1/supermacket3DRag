# AGENTS.md - 电商企业级 RAG 知识库智能体系统开发指南

本文档为参与本项目（`dianshanRag`）的所有 AI 智能体与开发人员提供统一的技术规范、架构准则和实施约束。所有代码修改、功能新增和重构均必须严格遵循本指南。

---

## 一、 项目背景与核心愿景

本项目是一个面向电商企业的**高可靠、高并发、企业级 RAG 知识库智能体后端系统**（纯后端，无前端）。系统不仅涵盖完整的电商中台核心交易链路，还深度融合了以 **LangChain4j** 为核心引擎的私有知识库检索增强生成（RAG）与多轮会话智能体。

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
| **向量数据库** | **ChromaDB + 内存备用兜底** | 生产与常规开发使用 `ChromaEmbeddingStore`；同时配置支持降级为 `InMemoryEmbeddingStore`，确保无容器环境下本地自测秒级跑通。 |
| **Embedding 策略** | **双引擎动态切换（工厂模式）** | 通过 `application.yaml` 配置属性一键切换：<br>1. **本地小模型**：JVM 进程内直接运行 ONNX 模型（如 `BGE-Small-ZH-ONNX`），零外部模型服务依赖；<br>2. **云端模型**：OpenAI 兼容 Embedding API。 |
| **文档与多模态** | **PDF / Word / Markdown / 本地 OCR** | 支持上传与解析 `.pdf`、`.docx`、`.md` 及图片文件（图片通过纯本地 OCR 提取文字与元数据入库）。 |
| **溯源与智能体** | **精准来源引用 + 多轮记忆 + Tool** | 1. **多轮问答**：基于 `ChatMemory` 维护上下文；<br>2. **精准溯源**：回答必须在末尾标准化附带 `[引用1: 文件名 第X页/段落]` 溯源列表；<br>3. **业务联动**：智能体通过 `@Tool` 注解挂载电商商品实时查询能力。 |
| **接口与测试** | **标准 RESTful + MockMvc 单元测试** | 遵循标准 HTTP 状态码与统一 JSON 包装；不引入 Swagger 等冗余文档依赖，编写完整的 Controller 单元测试覆盖核心链路。 |

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
│   └── RagConfig.java              # LangChain4j、Chroma、Embedding 策略装配
├── controller/                     # MVC 控制器层（RESTful API）
│   ├── AuthController.java         # 用户注册、登录、Token 刷新
│   ├── ProductController.java      # 商品列表、详情（Redis 缓存/防穿透/防雪崩）
│   ├── CartController.java         # 购物车增删改查
│   ├── OrderController.java        # 下单结算（Redisson 分布式锁防超卖）
│   └── RagController.java          # 文档上传、知识库检索、多轮对话智能体
├── entity/                         # 数据库实体（对应 MySQL 表）
├── mapper/                         # MyBatis-Plus Mapper 接口
├── model/                          # 数据传输模型
│   ├── dto/                        # 接收请求入参 DTO
│   └── vo/                         # 返回前端出参 VO
├── service/                        # 业务逻辑接口及实现
│   ├── UserService.java / impl/
│   ├── ProductService.java / impl/
│   ├── CartService.java / impl/
│   ├── OrderService.java / impl/
│   └── rag/                        # RAG 专有业务与管道服务
│       ├── DocumentParserService.java  # PDF/Word/MD/OCR 多源解析
│       ├── EmbeddingStrategyFactory.java # 本地/云端 Embedding 动态工厂
│       ├── RagAgentService.java        # 智能体问答、多轮记忆与溯源组装
│       └── tool/EcommerceTools.java    # 挂载供智能体调用的商品查询工具
└── security/                       # 安全过滤器与上下文
    └── JwtAuthenticationFilter.java
```

---

## 四、 核心设计模式与技术落地要点

### 1. Redis 5 并发控制与缓存保护
- **Redisson 分布式锁**：
  - 锁粒度：`lock:order:product:{productId}`
  - 获取锁超时设定：`tryLock(5, 10, TimeUnit.SECONDS)`
  - 核心场景：下单扣减商品库存时加锁，事务提交后安全释放锁，严防高并发超卖。
- **缓存防穿透**：
  - 查询商品若数据库不存在，向 Redis 写入空值占位符（如 `NULL_OBJECT`），并设置较短 TTL（如 60 秒）。
- **缓存防雪崩**：
  - 商品正常缓存基准 TTL（如 1 小时），写入时附加随机抖动时间（如 `ThreadLocalRandom.current().nextInt(0, 300)` 秒）。

### 2. 双 Embedding 策略动态工厂
- 定义统一的 `EmbeddingModel` 接口。
- 根据配置文件 `rag.embedding.provider` 的值（`local` 或 `online`）：
  - `local`：初始化 LangChain4j 进程内 ONNX 模型（如 `BgeSmallZhEmbeddingModel`），免外部调用；
  - `online`：初始化 `OpenAiEmbeddingModel`，对接兼容 API；
- 实现运行时动态解耦，对上层 `ContentRetriever` 和向量持久化透明。

### 3. 多源文档解析与多轮溯源
- 解析流程：用户上传文件 -> 根据后缀路由解析器（PDFBox / POI / MD / OCR） -> 文本切分器（`DocumentSplitters.recursive(300, 30)`） -> 附带元数据（`source_file`, `page_number`, `chunk_id`） -> 向量化入库 Chroma。
- 问答流程：用户提问 -> 结合 `ChatMemory` 读取历史上下文 -> Retriever 检索相关 TextSegment -> 提取 Metadata -> 拼接 Prompt -> LLM 生成回答 -> 附带格式化引用列表：
  ```text
  [引用1] 用户手册.pdf (第2页, 相似度: 0.89)
  [引用2] 售后政策.docx (段落3, 相似度: 0.85)
  ```

---

## 五、 智能体协作与代码修改规则

1. **坚持测试驱动与自测验证**：新增或修改功能时，必须保证 `mvn clean test` 编译与测试通过。
2. **严禁破坏文档注释**：所有类、公共方法、复杂算法（如分布式锁、切片逻辑）必须保留完整中文注释。
3. **保持轻量与单一职责**：不要引入未经批准的额外重型框架（如额外引入复杂 Python 环境或重量级微服务组件）。
4. **提交与交付准则**：代码交付时，需同步校验 PRD 需求清单与 HOW_TO_TEST 操作手册的对齐情况。
