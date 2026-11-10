# 电商企业级 RAG 知识库与 3D 数字孪生超市系统 - 测试与运行验证指南 (HOW TO TEST)

本文档提供详细的本地环境搭建、配置说明、自动化测试运行以及端到端接口（cURL 与 WebSocket）测试指南。由于本项目为纯后端架构，按照本文档指引即可完整验证 3D 数字孪生超市、AI 导购机器人、商户后台、高并发电商交易与 RAG 智能体的全部功能。

---

## 1. 前置运行环境依赖

- **Java 开发环境**：JDK 21 (LTS)；
- **构建工具**：Apache Maven 3.8+ / 3.10+；
- **关系型数据库**：MySQL 8.0+（创建数据库 `dianshan_rag`）；
- **缓存与分布式锁**：Redis 5.0+（默认端口 6379）；
- **向量数据库（可选）**：ChromaDB（若本地未安装 Chroma，系统已内置自动降级为 InMemory 内存向量库，无需外部容器即可测试）。

---

## 2. 基础配置说明 (`src/main/resources/application.yaml`)

```yaml
server:
  port: 8080

spring:
  application:
    name: dianshanRag
  datasource:
    url: jdbc:mysql://localhost:3306/dianshan_rag?createDatabaseIfNotExist=true&useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
    username: root
    password: your_mysql_password
    driver-class-name: com.mysql.cj.jdbc.Driver
  sql:
    init:
      mode: always
      schema-locations: classpath:sql/schema.sql
      data-locations: classpath:sql/data.sql
  data:
    redis:
      host: localhost
      port: 6379
      password: ""

redisson:
  address: "redis://127.0.0.1:6379"
  password: ""

jwt:
  secret: "EnterpriseEcommerceRagKnowledgeBaseSecretKey2026SecureJwtToken1234567890!"
  expiration: 86400000

rag:
  llm:
    provider: openai-compatible
    base-url: "https://api.openai.com/v1"
    api-key: "demo-api-key"
    model-name: "gpt-4o-mini"
  embedding:
    provider: local # 内置 ONNX BGE-Small-ZH 模型，零外部依赖
  chroma:
    host: "http://localhost:8000"
    collection-name: "ecommerce_knowledge"
    fallback-to-in-memory: true
```

---

## 3. 自动化测试套件运行 (JUnit 5 + SpringBootTest)

```bash
# 执行全部自动化单元与集成测试 (覆盖电商、RAG、3D场景、导购机器人、商户端及 WebSocket)
mvn test
```

### 自动化测试用例清单：
1. **`AuthControllerTest`**：用户注册、重复拦截、密码加密与 JWT 签发；
2. **`ProductControllerTest`**：商品详情 Cache-Aside 缓存命中、防穿透空值写入与防雪崩随机 TTL 抖动；
3. **`OrderControllerConcurrencyTest`**：Redisson 分布式锁防超卖高并发测试（10 线程并发争抢 3 件库存，精准成交 3 笔，库存准确归 0）；
4. **`RagDocumentParserTest`**：PDF（页码提取）、Word (.docx)、Markdown 及图片本地 OCR 文本解析切片；
5. **`RagChatTest`**：多轮会话记忆、精准来源引用 `[引用1]` 格式化输出与本地/云端 Embedding 动态切换；
6. **`SupermarketSceneTest`**：3D 全景场景初始化树、货架三维坐标、商品绑定及空间定位检索；
7. **`AiGuideAgentTest`**：AI 导购机器人自由文本购物清单识别、空间最近邻巡航路线与航路点（Waypoints）序列生成；
8. **`MerchantProductTest`**：商户后台商品 CRUD、上下架切换、库存修改及 Redis 缓存一致性；
9. **`WebSocketInventoryTest`**：WebSocket 实时连接建立、库存变动事件广播及货架售罄标红（`isOutOfStock: true`）断言。

---

## 4. 手工端到端接口与 WebSocket 联调验证

### 第一步：获取 3D 数字孪生超市全景场景数据
```bash
# 获取 3D 超市初始全景 (下发所有货架三维空间坐标、陈列商品明细及初始相机 Spawn 点)
curl -X GET "http://localhost:8080/api/supermarket/scene"
```

响应示例：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "totalShelves": 6,
    "initialCamera": { "x": 0.0, "y": 3.0, "z": 8.0, "lookAtX": 0.0, "lookAtY": 1.0, "lookAtZ": 0.0 },
    "shelves": [
      {
        "shelfCode": "A01",
        "name": "生鲜果蔬冷藏货架",
        "zone": "生鲜区",
        "position": { "x": -6.0, "y": 0.0, "z": -4.0 },
        "cameraTarget": { "x": -6.0, "y": 1.5, "z": -2.0 },
        "status": "NORMAL",
        "products": [ ... ]
      }
    ]
  }
}
```

---

### 第二步：商品空间定位检索 (搜索直飞货架)
```bash
# 检索“耳机”，返回商品信息及其绑定的货架 3D 飞掠坐标
curl -X GET "http://localhost:8080/api/supermarket/products/search?keyword=耳机"
```

---

### 第三步：AI 导购机器人规划购物清单空间巡航航路
```bash
# 用户输入自由文本清单，AI 机器人规划最优空间路线
curl -X POST "http://localhost:8080/api/supermarket/guide/route" \
  -H "Content-Type: application/json" \
  -d '{"shoppingListText": "我想买一箱纯牛奶，一台笔记本电脑，还要一副降噪耳机"}'
```

响应示例：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "summary": "为您规划了本次导购的最佳路线，我们将依次前往乳品冷柜区、数码影音区以及电脑办公展区...",
    "waypoints": [
      {
        "step": 1,
        "productId": 2,
        "productName": "Sony WH-1000XM5 无线降噪头戴耳机",
        "shelfCode": "B01",
        "position": { "x": -2.0, "y": 0.0, "z": -6.0 },
        "cameraTarget": { "x": -2.0, "y": 1.5, "z": -4.0 },
        "isOutOfStock": false
      }
    ],
    "unmatchedItems": []
  }
}
```

---

### 第四步：WebSocket 实时连接与售罄标红验证
在浏览器开发者控制台（F12 -> Console）或使用 `wscat` 建立连接：
```javascript
// 在浏览器控制台执行
const ws = new WebSocket("ws://localhost:8080/ws/supermarket");
ws.onopen = () => console.log("✅ WebSocket 连接已建立");
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("🔔 收到库存实时变动广播:", data);
    if (data.isOutOfStock) {
        console.warn(`🚨 货架 [${data.shelfCode}] 上的商品 [${data.productName}] 已售罄，3D 货架网格变红！`);
    } else {
        console.log(`✨ 货架 [${data.shelfCode}] 库存已恢复正常`);
    }
};
```

---

### 第五步：商户后台调控库存（触发实时广播）
```bash
# 商户后台将商品 1 的库存直接调整为 0 (触发售罄)
curl -X PUT "http://localhost:8080/api/merchant/products/1/stock?stock=0"

# 此时第四步的 WebSocket 客户端将瞬间收到广播，并且 isOutOfStock=true！
# 随后商户为商品补货为 50 件：
curl -X PUT "http://localhost:8080/api/merchant/products/1/stock?stock=50"
```

---

### 第六步：商户后台商品上下架与 CRUD
```bash
# 1. 商户分页查看商品 (包含货架绑定与状态)
curl -X GET "http://localhost:8080/api/merchant/products?page=1&size=10"

# 2. 将商品 2 下架
curl -X PUT "http://localhost:8080/api/merchant/products/2/status?status=OFF_SHELF"

# 3. 查看所有 3D 货架点位
curl -X GET "http://localhost:8080/api/merchant/shelves"
```
