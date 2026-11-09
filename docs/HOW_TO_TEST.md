# 电商企业级 RAG 知识库智能体系统 - 测试与运行验证指南 (HOW TO TEST)

本文档提供详细的本地环境搭建、配置说明、自动化测试运行以及端到端接口（cURL）测试指南。由于本项目为纯后端架构，按照本文档指引即可完整验证全部业务与智能体功能。

---

## 1. 前置运行环境依赖

- **Java 开发环境**：JDK 21 (LTS)；
- **构建工具**：Apache Maven 3.8+ / 3.10+；
- **关系型数据库**：MySQL 8.0+（创建数据库 `dianshan_rag`）；
- **缓存与分布式锁**：Redis 5.0+（默认端口 6379）；
- **向量数据库（可选）**：ChromaDB（若本地未安装 Chroma，可通过配置一键启用内置内存向量库，无需外部容器即可测试）。

---

## 2. 基础配置说明 (`src/main/resources/application.yaml`)

启动前请检查配置文件中的核心连接参数：

```yaml
server:
  port: 8080

spring:
  application:
    name: dianshanRag
  datasource:
    url: jdbc:mysql://localhost:3306/dianshan_rag?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
    username: root
    password: your_mysql_password
    driver-class-name: com.mysql.cj.jdbc.Driver
  data:
    redis:
      host: localhost
      port: 6379
      password: "" # 若有密码请填写

# Redisson 配置
redisson:
  address: "redis://127.0.0.1:6379"
  password: ""

# JWT 鉴权配置
jwt:
  secret: "EnterpriseEcommerceRagKnowledgeBaseSecretKey2026SecureJwtToken!"
  expiration: 86400000 # 24 小时 (毫秒)

# AI 与 RAG 智能体配置
rag:
  llm:
    provider: openai-compatible # 支持 DeepSeek / Qwen / OpenAI / Ollama 等
    base-url: "https://api.openai.com/v1" # 或第三方聚合接口地址
    api-key: "sk-your-api-key"
    model-name: "gpt-4o-mini"
  embedding:
    provider: local # 可选: local (内置 ONNX BGE-Small-ZH 模型) 或 online (OpenAI 兼容接口)
    online:
      base-url: "https://api.openai.com/v1"
      api-key: "sk-your-api-key"
      model-name: "text-embedding-3-small"
  chroma:
    host: "http://localhost:8000"
    collection-name: "ecommerce_knowledge"
    fallback-to-in-memory: true # 若 Chroma 未启动，自动降级为 InMemory 模式，方便零环境秒测
```

---

## 3. 数据库初始化

在 MySQL 中执行初始化脚本：
1. 创建数据库：
   ```sql
   CREATE DATABASE IF NOT EXISTS `dianshan_rag` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE `dianshan_rag`;
   ```
2. 执行表结构与初始种子数据：
   - 表结构脚本：`src/main/resources/sql/schema.sql`
   - 初始化商品与测试数据：`src/main/resources/sql/data.sql`

---

## 4. 自动化单元测试运行 (JUnit 5 + MockMvc)

项目提供了完备的自动化测试套件，通过 Maven 命令即可一键触发：

```bash
# 执行全部单元与集成测试
mvn test
```

### 核心测试用例清单与验证重点：
1. **`AuthControllerTest`**：
   - 验证用户注册成功与重复注册冲突校验；
   - 验证正确密码登录生成 JWT Token，以及错误密码拒绝访问。
2. **`ProductControllerTest`**：
   - 验证商品详情 Cache-Aside 模式（首次查库写入 Redis，后续直命中缓存）；
   - **防缓存穿透验证**：查询不存在的 ID（如 `-999`），检查 Redis 是否写入空值占位符，TTL 是否在 60 秒内；
   - **防缓存雪崩验证**：正常商品写入 Redis 时，检查 TTL 是否为基准时间叠加了随机扰动值。
3. **`OrderConcurrencyTest` (Redisson 分布式锁)**：
   - 模拟高并发超卖测试：10 个并发线程同时争抢库存仅剩 3 件的商品，验证在 Redisson 锁保护下，仅有 3 笔订单成功创建，库存准确归零，绝对无负库存产生。
4. **`RagDocumentParserTest`**：
   - 分别测试 PDF、Word (.docx)、Markdown 以及图片本地 OCR 的文本提取与元数据（页码/标题）切分。
5. **`RagChatTest`**：
   - 验证多轮对话问答；
   - 验证回答末尾标准化格式输出精准来源引用（包含文档名、页码、相似度）。

---

## 5. 端到端手工接口测试步骤 (cURL 示例)

### 第一步：用户注册与登录获取 JWT
```bash
# 1. 注册
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "Password123", "phone": "13800000000"}'

# 2. 登录并提取 Token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "Password123"}'

# 响应示例:
# {"code":200,"message":"登录成功","data":{"token":"eyJhbGciOi..."}}
```
> 请将返回的 token 赋值为环境变量：`TOKEN="eyJhbGciOi..."`

---

### 第二步：商品浏览与缓存验证
```bash
# 1. 分页浏览商品
curl -X GET "http://localhost:8080/api/products?page=1&size=5"

# 2. 查看商品详情 (触发 Redis 缓存)
curl -X GET http://localhost:8080/api/products/1

# 3. 验证防缓存穿透 (查询不存在的商品)
curl -X GET http://localhost:8080/api/products/999999
# 登录 Redis 终端验证是否生成了空值缓存: redis-cli GET ecommerce:product:999999
```

---

### 第三步：购物车与高并发下单
```bash
# 1. 添加商品到购物车
curl -X POST http://localhost:8080/api/cart/add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "quantity": 2}'

# 2. 查看我的购物车
curl -X GET http://localhost:8080/api/cart/list \
  -H "Authorization: Bearer $TOKEN"

# 3. 提交订单 (Redisson 锁保护库存扣减)
curl -X POST http://localhost:8080/api/order/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items": [{"productId": 1, "quantity": 1}]}'
```

---

### 第四步：多源知识库上传与切片入库
```bash
# 上传 PDF / Word / MD 或图片文件
curl -X POST http://localhost:8080/api/rag/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@售后政策与商品手册.pdf"
```

---

### 第五步：多轮智能体问答与来源溯源追踪
```bash
# 第一轮对话：询问商品规格与退换货政策
curl -X POST http://localhost:8080/api/rag/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-1001",
    "question": "请问这件商品的售后退换货政策是怎样的？有哪些保修条例？"
  }'

# 响应示例：
# {
#   "code": 200,
#   "message": "success",
#   "data": {
#     "answer": "根据售后政策，商品自签收之日起支持 7 天无理由退货，质保期为 1 年[引用1]...",
#     "sources": [
#       {
#         "fileName": "售后政策与商品手册.pdf",
#         "pageNumber": 3,
#         "similarityScore": 0.91,
#         "contentSnippet": "商品自签收之日起支持 7 天无理由退货..."
#       }
#     ]
#   }
# }

# 第二轮对话：多轮追问 (继承上一轮上下文)
curl -X POST http://localhost:8080/api/rag/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-1001",
    "question": "那人为损坏在保修范围内吗？"
  }'
```

---

## 6. 常见问题排查与容灾兜底 (FAQ)

1. **若本地未运行 Chroma 容器：**
   - 检查 `application.yaml` 中 `rag.chroma.fallback-to-in-memory: true`；
   - 系统将自动加载内存向量存储 `InMemoryEmbeddingStore`，无需启动任何 Docker 容器即可直接跑通全部上传与问答流程。
2. **若无云端 OpenAI API Key：**
   - 将 `rag.embedding.provider` 设为 `local`，系统将在 JVM 内直接运行纯 Java ONNX BGE-Small 向量模型；
   - LLM 接口可对接本地 Ollama（如 `http://localhost:11434/v1`），或配置任意国内兼容 OpenAI 协议的免费/测试 API 密钥。
