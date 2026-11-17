# 🛒 dianshan-rag × KORA：企业级 RAG 智能体与 3D 空间电商交易系统

<p align="center">
  <b>融合高并发电商交易中台（Redisson + Redis）、企业级私有 RAG 知识库与 AI 3D 导购、WebGL2 六幕式空间商城以及支付宝沙箱支付闭环的纯 Java + React 全栈工程</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-21%20LTS-orange.svg" alt="Java 21 LTS">
  <img src="https://img.shields.io/badge/Spring%20Boot-4.1.2-brightgreen.svg" alt="Spring Boot 4.1.2">
  <img src="https://img.shields.io/badge/MyBatis--Plus-3.5.17-blue.svg" alt="MyBatis-Plus 3.5.17">
  <img src="https://img.shields.io/badge/Redis-Redisson%203.43-red.svg" alt="Redisson 3.43">
  <img src="https://img.shields.io/badge/AI%20%2F%20RAG-LangChain4j%200.36-blueviolet.svg" alt="LangChain4j 0.36">
  <img src="https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-61dafb.svg" alt="React 18 + TS">
  <img src="https://img.shields.io/badge/3D%20%26%20Motion-Three.js%20%2B%20GSAP-black.svg" alt="Three.js + GSAP">
</p>

---

## 📖 项目简介

**dianshan-rag × KORA** 是一个面向新零售与多品类陈列场景构建的现代化企业级电商与智能体全栈系统。

项目由 **Java 21 + Spring Boot 4.1.2** 单体中台与 **React 18 + Three.js WebGL2 + GSAP** 六幕式空间旗舰店前端组成，将高并发电商底层架构与前沿空间视觉、私有知识库智能体和第三方支付网关融为一体：

- **沉浸式六幕空间商城（`frontend-supermarket`）**：打破传统图文列表，覆盖**高定服饰悬架滑轨**、**旗舰数码广角畸变转盘（Warp Carousel）**、**名酒/典藏器物水波纹玻璃展柜（Water Ripple Vitrine）**等差异化展陈，配合全局 **WebSocket `/ws/supermarket`** 实时刷新库存与售罄警示状态。
- **企业级私有 RAG 与 AI 导购中枢（LangChain4j）**：支持 `.pdf` / `.docx` / `.md` / 图片本地 OCR（Tess4J）解析入库，具备 **本地 JVM ONNX (`BGE-Small-ZH`) / 云端 OpenAI 兼容模型**双引擎动态工厂与 **ChromaDB / 内存向量库自动降级**；支持自然语言购物清单的 **3D 空间最近邻航路规划** 与中英文商品实时 `@Tool` 检索。
- **高并发防超卖与支付宝沙箱预接入**：通过 **Redisson 分布式可重入锁** 与 SQL 原子扣减保障库存安全，支持 **JWT 无状态鉴权**、**订单创建 -> 支付宝沙箱 RSA2 收银台 / 本地预演付款 -> 异步回调验签 (`PENDING -> PAID`) -> 取消订单锁保护库存回滚 (`CANCELLED`)** 完整商业闭环。

---

## ✨ 核心特性矩阵

### 1. 🎭 KORA × TACTILE ARCHIVE 六幕式 3D / WebGL2 空间商城
前端主站位于 [`frontend-supermarket`](frontend-supermarket)（默认运行于 `http://localhost:5173`），支持滚轮 GSAP Observer 丝滑切幕与全库空间快搜直达：

| 幕次 | 场景代号 | 核心视觉与交互特性 |
| :--- | :--- | :--- |
| **Scene 01** | `OPTICAL PORTAL` | WebGL2 45° 光栅色散流光场开场序列，支持探索入馆或直通 AI 导购 |
| **Scene 02** | `GARMENT RAIL` (Stage I) | 高定服饰物理金属悬架滑轨，支持挂钩阻尼碰撞、正反侧三视图与 3D 旋转检视，毛玻璃 `GlassButton` 一键加购 |
| **Scene 03** | `TECH TABLE` (Stage II) | 旗舰数码专属 **WebGL2 Warp Carousel** 广角畸变滑动转盘 + 优雅暗纹流光背景，支持 `DISPLAY WAKE` / `OPTICS & CHASSIS` / `X-RAY` 检视模态 |
| **Scene 04** | `VITRINE GALLERY` (Stage III) | 典藏名酒与稀缺器物 **博物馆玻璃防尘钟罩** + **Water Ripple WebGL2 水波纹动效**，悬停钟罩自动升起、支持 360° 旋钮鉴赏 |
| **Scene 05** | `NEURAL ATELIER` | 液态虹彩噪波球体双舱面板：左侧 **AI 3D ROUTE PLANNER** 规划多展区航路点，右侧 **RAG ORACLE CHAT** 问答带标准溯源引用 |
| **Scene 06** | `STUDIO CONSOLE` | 内嵌极简商户控制台：直连 MySQL 修改实时库存、切换上下架、发布展厅新商品、切换 Embedding 策略及上传 RAG 文档 |

> 仓库同时保留了独立 Vue 3 + Element Plus 管理端工程 [`frontend-merchant`](frontend-merchant)（端口 `5174`）供可选使用。

### 2. ⚡ 高并发交易中台、缓存防线与实时通信
- **Redisson 分布式锁防超卖 + 原子回滚**：多商品结算按商品 ID 升序加锁彻底杜绝死锁；扣减成功自动清理购物车并触发 WebSocket 广播；取消待支付订单同样持锁恢复库存。
- **Redis 缓存穿透与雪崩防护**：查询空商品写入短 TTL 空值标记；缓存过期时间叠加随机抖动值（Random Jitter）。
- **Spring 原生 WebSocket 实时广播（`/ws/supermarket`）**：无论是用户下单、取消订单还是商户后台调库存/下架，均向全场客户端推送 `INVENTORY_CHANGED` 事件，联动维护货架 `NORMAL` / `OUT_OF_STOCK` 状态。

### 3. 🤖 企业级 RAG 知识库与双语 AI 导购引擎
- **多源文档解析**：内置 `PDFBox`（PDF 分页提取）、`Apache POI`（`.docx`）、Markdown 切片与 `Tess4J` 本地图像 OCR。
- **双引擎 Embedding 工厂与零容器运行兜底**：可通过 `application.yaml` 或接口动态切换本地 `ONNX BGE-Small-ZH` 与在线向量模型；ChromaDB 不可达时自动平滑降级为 `InMemoryEmbeddingStore`。
- **精准溯源与业务 Tool 联动**：回答自动附带 `[引用X: 文件名 ...]` 溯源列表；`EcommerceTools` 支持中英文品牌别名字典（如 `三星 -> Samsung / Galaxy`、`大疆 -> DJI` 等）与量词边界保护，结合相关度评分检索在售商品实时售价与库存。
- **3D 空间最优漫游规划**：从原点出发基于最近邻欧氏距离排序各展区货架三维坐标，输出结构化 `Waypoints` 与视角聚焦机位。

### 4. 💳 支付架构与支付宝沙箱预接入
- **订单全生命周期**：支持 `PENDING`（待支付）、`PAID`（已支付）、`CANCELLED`（已取消），数据库完整记录 `payment_method`、`trade_no`、`paid_at` 与 `pay_subject`。
- **纯 JDK RSA2（`SHA256withRSA`）签名器**：[`AlipayRsa2Signer`](src/main/java/com/example/demo/service/payment/AlipayRsa2Signer.java) 按支付宝规范拼接 ASCII 字典序参数串，完成主动请求加签与异步回调公钥验签（无需额外三方支付 SDK 即可运行）。
- **双模式无缝切换**：未填写密钥时启用 **`SANDBOX_SIMULATION` 预演收银台**完成前后端全链路联调；填入沙箱 `APPID`、应用私钥与支付宝公钥并将 `alipay.enabled` 置为 `true` 后，自动切换为真实支付宝沙箱网关表单跳转与 `/api/payment/alipay/notify` 验签闭环。

---

## 🏗️ 技术栈

| 分层 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **后端运行时** | Java 21 (LTS) + Spring Boot 4.1.2 | 标准分层 MVC 架构，纯 Java 原生工程 |
| **持久层与数据库** | MySQL 8.0+ / MyBatis-Plus 3.5.17 / H2 | 启动期 [`DatabaseSchemaSyncRunner`](src/main/java/com/example/demo/config/DatabaseSchemaSyncRunner.java) 自动幂等校验扩展列与展厅种子数据；单测默认跑 H2 内存库 |
| **缓存与分布式锁** | Redis 5+ / Spring Data Redis / Redisson 3.43.0 | 可重入锁 `RLock`、空值防穿透、TTL 随机抖动防雪崩 |
| **安全体系** | Spring Security + JJWT 0.12.6 | 无状态 `SecurityFilterChain`，统一 JSON HTTP 401 响应 |
| **AI 与知识库** | LangChain4j 0.36.2 / ONNX BGE-Small-ZH / Chroma | `ChatMemory` 多轮对话、OpenAI 兼容接口接入、本地 OCR（Tess4J） |
| **文档解析** | PDFBox 3.0.3 / Apache POI 5.2.5 / Tess4J 5.13.0 | 支持 `.pdf`、`.docx`、`.md`、`.txt` 及图片文字提取 |
| **前端主站** | React 18 + TypeScript + Vite 5 + TailwindCSS | `frontend-supermarket`（端口 `5173`，Vite 内置 `/api` 与 `/ws` 反向代理） |
| **3D 图形与动效** | Three.js 0.170 + 原生 WebGL2 Shader + GSAP 3.13 | 光栅色散、Warp Carousel、水波纹、液态球体与平滑场景切换 |

---

## 📁 目录结构

```text
dianshanRag/
├── src/main/java/com/example/demo/
│   ├── common/                              # 统一 Result<T>、BusinessException、Redis/JWT 工具与常量
│   ├── config/                              # Security、Redis/Redisson、MyBatis-Plus、RAG、WebSocket、支付宝配置与库表自动同步
│   ├── controller/                          # Auth / Product / Cart / Order / Payment / Rag / SupermarketScene / AiGuide / Merchant*
│   ├── entity/                              # User, Product, Shelf, CartItem, Orders, OrderItem, KnowledgeDocument
│   ├── mapper/                              # MyBatis-Plus BaseMapper 与原子库存扣减/回滚 SQL
│   ├── model/                               # 请求 DTO 与响应 VO
│   ├── security/                            # JwtAuthenticationFilter 与 UserPrincipal
│   ├── service/
│   │   ├── impl/                            # User / Product / Cart / Order / Payment 核心业务实现
│   │   ├── payment/                         # AlipayRsa2Signer (SHA256withRSA 加签与回调验签)
│   │   ├── merchant/                        # 商户商品与货架点位维护服务
│   │   ├── supermarket/                     # 3D 全景空间组装与直跳检索
│   │   └── rag/                             # 文档解析、Embedding 工厂、RAG 智能体、AI 导购寻路与 EcommerceTools
│   └── websocket/                           # SupermarketWebSocketHandler & SupermarketEventPublisher
├── src/main/resources/
│   ├── application.yaml                     # 服务端端口、MySQL、Redis、JWT、RAG 与支付宝沙箱配置
│   └── sql/                                 # schema.sql 建表 DDL 与 data.sql 预置三大展厅数据
├── src/test/java/com/example/demo/          # JUnit 5 全栈集成测试套件
├── frontend-supermarket/                    # KORA × TACTILE ARCHIVE 六幕空间体验主端 (React 18, 端口 5173)
│   ├── src/api/                             # Axios 客户端、JWT 自动注入与 401 事件派发
│   ├── src/components/
│   │   ├── chrome/                          # 顶部导航、购物袋/订单/支付宝收银台抽屉、登录模态框、磁性光标
│   │   ├── scenes/                          # 01~06 六幕完整场景组件
│   │   ├── stage/                           # Three.js / WebGL2 全局背景舞台与着色器
│   │   └── ui/                              # ProductRailHero、TechTableHero、WarpCarousel、VitrineGallery、WaterRipple、GlassButton 等
│   └── src/lib/                             # 后端展厅数据适配器、WebSocket 增量同步、安全 Storage 封装
├── frontend-merchant/                       # 可选独立商户管理后台 (Vue 3 + Element Plus, 端口 5174)
└── pom.xml                                  # Maven 依赖管理
```

---

## 🔌 核心 API 接口概览

| 模块 | 主要端点 | 说明 |
| :--- | :--- | :--- |
| **认证中心** | `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` | 注册、签发 JWT 与登录态校验 |
| **商品与 3D 场景** | `GET /api/products` · `GET /api/products/{id}` · `GET /api/supermarket/scene` · `GET /api/supermarket/products/search` | 商品缓存查询、全量展厅货架点位与空间搜索 |
| **购物车与订单** | `POST /api/cart/add` · `GET /api/cart/list` · `DELETE /api/cart/{id}`<br>`POST /api/order/create` · `GET /api/order/my-orders` · `GET /api/order/{orderNo}` · `POST /api/order/{orderNo}/cancel` | 持久化购物车、Redisson 锁防超卖下单与取消订单库存回滚 |
| **支付与沙箱** | `GET /api/payment/alipay/config-status` · `POST /api/payment/alipay/create` · `POST /api/payment/alipay/sandbox-confirm` · `POST /api/payment/alipay/notify` · `GET /api/payment/orders/{orderNo}` | 沙箱配置检测、生成 RSA2 加签收银台表单、沙箱预演、异步回调验签与查单 |
| **RAG 与 AI 导购** | `POST /api/supermarket/guide/route`<br>`POST /api/rag/upload` · `POST /api/rag/chat` · `GET /api/rag/documents` · `POST /api/rag/embedding/switch` | 购物清单 3D 路径规划、多源文档入库、带溯源多轮问答与 Embedding 引擎切换 |
| **商户后台** | `GET/POST /api/merchant/products` · `PUT /api/merchant/products/{id}` · `PUT /api/merchant/products/{id}/status` · `PUT /api/merchant/products/{id}/stock`<br>`GET/POST /api/merchant/shelves` | 商户商品管理、上下架/库存调控（自动广播 WebSocket）及 3D 货架坐标维护 |
| **实时推送** | `ws://localhost:8080/ws/supermarket` | 库存变动与货架 `OUT_OF_STOCK` 状态实时广播 |

---

## 🚀 快速上手

### 1. 环境要求
- **JDK**：21（LTS）
- **Maven**：3.9+
- **Node.js**：v18+（推荐 v20+）
- **MySQL**：5.7 / 8.0+（默认端口 `3306`，连接串已配置 `createDatabaseIfNotExist=true`）
- **Redis**：5.0+（默认端口 `6379`，Redisson 与缓存必需）

### 2. 配置与数据库初始化
1. 检查 [`src/main/resources/application.yaml`](src/main/resources/application.yaml) 中的 MySQL（默认 `root` / `123456`，库名 `dianshan_rag`）、Redis 地址以及 `rag.llm` 模型服务参数。
2. 如需手动执行建表与初始化数据（可选，推荐首次导入）：
   ```bash
   mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS dianshan_rag DEFAULT CHARACTER SET utf8mb4;"
   mysql -u root -p123456 dianshan_rag < src/main/resources/sql/schema.sql
   mysql -u root -p123456 dianshan_rag < src/main/resources/sql/data.sql
   ```
   > 后端启动时也会通过 `DatabaseSchemaSyncRunner` 自动幂等校验扩展字段与三大展厅货架/商品数据，不覆盖既有库存。

### 3. 启动后端服务（端口 `8080`）
```bash
mvn spring-boot:run
```

### 4. 启动六幕式 3D 空间商城前端（端口 `5173`）
```bash
cd frontend-supermarket
npm install
npm run dev
```
启动后访问 **`http://localhost:5173/`**，内置默认测试账户：
- **用户名**：`testuser`
- **密码**：`123456`

*(可选)* 如需运行独立 Vue 3 商户后台（端口 `5174`）：
```bash
cd frontend-merchant
npm install
npm run dev
```

---

## 💳 支付宝沙箱接入配置说明

项目当前默认开启 `sandbox-simulation-enabled: true`，**无需外部密钥即可在本地体验完整的下单、沙箱收银台与状态流转闭环**。

如需接入真实的支付宝开放平台沙箱网关：
1. 登录支付宝开放平台控制台进入 **沙箱应用**，使用官方密钥工具生成 **RSA2 / PKCS8（Java 适用）** 应用私钥与应用公钥，并将应用公钥填入沙箱后台获取 **支付宝公钥**。
2. 编辑 [`src/main/resources/application.yaml`](src/main/resources/application.yaml) 的 `alipay:` 段落：
   ```yaml
   alipay:
     enabled: true
     sandbox-simulation-enabled: false # 仅走真实沙箱付款时关闭模拟接口
     app-id: "你的沙箱APPID"
     private-key: "你的PKCS8应用私钥"
     alipay-public-key: "支付宝平台返回的支付宝公钥"
     gateway-url: "https://openapi-sandbox.dl.gateway.alipaydev.com/gateway.do"
     notify-url: "https://你的公网域名或内网穿透地址/api/payment/alipay/notify"
     return-url: "http://localhost:5173/?pay_status=success"
   ```
3. 本地调试 `notify_url` 需配合 `cpolar` / `ngrok` / `frp` 将 `localhost:8080` 映射到公网 HTTPS，以便接收支付宝异步回调；**切换真实生产环境上线时务必同步更换正式网关、开启真实企业资质签约、关闭 `sandbox-simulation-enabled` 并使用环境变量托管密钥**。

---

## 🧪 自动化测试与构建验证

> 注意：后端测试通过 `src/test/resources/application.yaml` 使用 H2 内存库模拟 MySQL，但运行前请确保本地 Redis（`127.0.0.1:6379`）处于启动状态。

- **运行后端全量测试**（覆盖高并发防超卖锁、订单支付与取消回滚、RSA2 签名、双语 AI 导购规划、RAG 文档解析与问答、WebSocket 广播等）：
  ```bash
  mvn clean test
  ```
- **运行前端单元测试与生产构建**：
  ```bash
  cd frontend-supermarket
  npm test
  npm run build
  ```

---

## ⚠️ 开源推送安全提示

在推送到公开 Git 仓库之前，请确认检查 [`src/main/resources/application.yaml`](src/main/resources/application.yaml) 中的 `rag.llm.api-key`、`jwt.secret`、`alipay.*` 以及数据库密码，建议改为 `${ENV_VAR}` 环境变量注入，避免将真实密钥提交至公开代码库。
