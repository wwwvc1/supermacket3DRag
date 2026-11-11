# 🛒 dianshan-rag：企业级 RAG 知识库与 3D 数字孪生商业街超市系统

<p align="center">
  <b>融合企业级电商中台交易链路、私有 RAG 知识库检索增强，以及 Three.js 3D 智慧商业街/数字孪生超市的纯 Java 原生全栈开源工程</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-21%20LTS-orange.svg" alt="Java 21">
  <img src="https://img.shields.io/badge/Spring%20Boot-4.1.2-brightgreen.svg" alt="Spring Boot 4.1.2">
  <img src="https://img.shields.io/badge/MyBatis--Plus-3.5.x-blue.svg" alt="MyBatis-Plus">
  <img src="https://img.shields.io/badge/Redis-Redisson%20Distributed%20Lock-red.svg" alt="Redisson">
  <img src="https://img.shields.io/badge/AI%20%2F%20RAG-LangChain4j-blueviolet.svg" alt="LangChain4j">
  <img src="https://img.shields.io/badge/3D%20Engine-Three.js-black.svg" alt="Three.js">
  <img src="https://img.shields.io/badge/Frontend-Vue%203%20%2B%20Vite%20%2B%20TailwindCSS-42b883.svg" alt="Vue 3">
</p>

---

## 📖 项目简介

**dianshan-rag** 是一个面向电商企业与未来沉浸式购物场景研发的高性能、企业级综合系统。

系统突破了传统电商图文货架与独立客服机器人的孤立割裂体验，通过 **Spring Boot 4.1.2 + Java 21** 核心中台架构，实现了 **电商高并发交易（JWT + Redis 防穿透/防雪崩 + Redisson 分布式锁防超卖）**、**企业级私有 RAG 智能体知识库（多源文档解析/本地 OCR/动态向量检索/精准溯源）**，以及基于 **Three.js** 的 **3D 智慧商业步行街 / 数字孪生超级商城**。

用户既能以第一人称或俯瞰视角自由漫步商业街探店，实现**点击商铺运镜入店、展台商品悬浮 360° 自转交互**；系统还通过 **原生 WebSocket 全双工长连接** 驱动全场库存联动与售罄货架标红警示，并由 **AI 导购机器人** 智能解析用户自然语言购物清单，规划空间最优巡航航线。

---

## ✨ 核心特性矩阵

### 1. 🛍️ 3D 商业步行街与数字孪生超级商城 (Three.js WebGL)
- **7 座特色独立品牌旗舰门店**：Apple 旗舰店、Sony 索尼声学馆、ROG 玩家极客馆、源头直采鲜果市集、特仑苏有机乳品吧、iWatch 智能穿戴馆、UltraVision 超显中心。
- **开门入店与探店导览**：点击 3D 街区中任意商铺建筑/门头招牌，相机平滑飞掠穿门入店，停靠展台前深度浏览；顶部 HUD 支持一键退回商业大道。
- **电影级商品陈列与悬浮自转交互**：点击展台上陈列的 3D 商品模型，商品平滑浮起离开台面（`+0.38m`），伴随全息投射光环与 360° 匀速自转，侧边滑出玻璃拟态详情抽屉。
- **三态运镜与漫游支持**：
  - **上帝视角 (OrbitControls)**：全景自由旋转缩放，WASD 平滑滑行漫游；
  - **第一人称视角 (FPS Roaming)**：1.6m 成人视高，WASD 沉浸式行走探店；
  - **电影级平滑运镜 (Flight Mode)**：基于 GSAP 贝塞尔曲线在街区全景与店铺特写间丝滑飞跃。
- **写实光影与性能调优**：
  - 清朗日光天幕与青石板路面，彻底解决传统 WebGL 起雾泛白问题；
  - 阴影采样单元严密校准（解决 `MAX_TEXTURE_IMAGE_UNITS` GPU 显存溢出），稳定运行在 **140+ FPS**。

### 2. ⚡ 高并发核心交易链路与高可用设计
- **Redisson 分布式锁防超卖**：针对高并发秒杀与多商品结算，按商品 ID 排序加锁，彻底杜绝多资源死锁竞争；内层配合 SQL 乐观原子扣减，双重保障绝对不超卖。
- **Redis 缓存防穿透与防雪崩**：
  - **防穿透**：查询空对象自动注入短 TTL 标记缓存；
  - **防雪崩**：基础 TTL 叠加 `0~300s` 随机抖动值（Random Jitter），规避高并发缓存集体失效。
- **实时事件推流 (Spring 原生 WebSocket)**：
  - 端点：`/ws/supermarket`；
  - 无论用户下单扣减库存，还是商户后台调控库存/上下架，全场 3D 客户端秒级同步；商品售罄时货架自动触发红色呼吸呼吸灯与警告标牌。

### 3. 🤖 企业级私有 RAG 知识库与 AI 导购机器人 (LangChain4j)
- **多源文档解析入库**：支持 `.pdf`、`.docx`、`.md`、`.txt` 以及纯本地 OCR 图像提取（基于 Tesseract）。
- **Embedding 策略双引擎（工厂模式）**：
  - **本地 JVM 纯 Java 离线引擎**：内置 ONNX `BGE-Small-ZH` 模型，纯单体内存毫秒级向量化（5~15ms），零外部网络依赖；
  - **云端 OpenAI 兼容引擎**：支持按配置平滑接入云端向量大模型。
- **向量存储自动降级保障**：生产支持 `ChromaDB`，同时配置自动降级为 `InMemoryEmbeddingStore`，开发自测零容器秒级跑通。
- **精准溯源引用**：回答标准化附带 `[引用X: 文件名 第Y页/段落]` 溯源明细。
- **AI 导购空间路径规划**：解析自然语言清单意图，在 3D 空间中结合三维拓扑坐标，按最近邻算法输出导购说明与结构化三维航路点序列（Waypoints）。

### 4. 🏪 独立商户管理后台 (Merchant Admin)
- 独立单门店后台系统（端口 `5174`），提供直观的数据表格与调控面板。
- 支持商品 CRUD、上下架切换（`ON_SHELF` / `OFF_SHELF`）、实时库存微调、3D 货架空间坐标维护及知识库文档管理。

---

## 🏗️ 架构与技术栈

| 层次 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **基础语言与核心框架** | **Java 21 (LTS) + Spring Boot 4.1.2** | 纯 Java 原生单体工程，标准分层架构 |
| **安全体系** | **Spring Security + JWT** | 无状态 Token 过滤拦截，标准 Bearer 传递 |
| **持久层与数据库** | **MySQL + MyBatis-Plus 3.5.x** | 单表 BaseMapper 与动态 SQL，提供初始化脚本 |
| **高并发中间件** | **Redis + Redisson 官方 Starter** | 分布式可重入锁、防穿透/防雪崩缓存 |
| **实时通信** | **Spring 原生 WebSocket** | 客户端长连接池与实时 JSON 广播发布器 |
| **AI / RAG 引擎** | **LangChain4j (Java 统一生态)** | 统一对接 OpenAI 格式大模型与本地 ONNX 向量化 |
| **向量数据库** | **ChromaDB + 内存兜底** | 生产使用 Chroma，本地自测自动降级为 InMemory |
| **3D 用户客户端** | **Vue 3 + Vite + Three.js + TailwindCSS** | 运行在 `http://localhost:5173` |
| **商户端管理后台** | **Vue 3 + Vite + Element Plus + Pinia** | 运行在 `http://localhost:5174` |

---

## 📁 目录结构

```text
dianshanRag/
├── src/main/java/com/example/demo/
│   ├── common/                      # 基础响应包装、业务异常、Redis 常量
│   ├── config/                      # 安全拦截、Redis/Redisson、MyBatis-Plus、WebSocket 装配
│   ├── controller/                  # RESTful 控制器 (场景/商品/订单/RAG/商户端)
│   ├── entity/                      # 数据库实体类 (User, Product, Shelf, Orders...)
│   ├── mapper/                      # MyBatis-Plus 数据访问接口
│   ├── model/                       # DTO / VO 数据模型
│   ├── security/                    # JWT 鉴权过滤器与用户上下文
│   ├── service/                     # 业务接口及实现层
│   │   ├── merchant/                # 商户后台业务服务
│   │   ├── supermarket/             # 3D 商业街空间场景组装与检索服务
│   │   └── rag/                     # RAG 解析、双引擎向量工厂、导购与问答智能体
│   └── websocket/                   # WebSocket 长连接管理与变动广播发布器
├── src/main/resources/
│   ├── application.yaml             # 核心配置文件
│   └── sql/                         # 建表 DDL (schema.sql) 与预置商品数据 (data.sql)
├── frontend-supermarket/            # 3D 智慧商业街购物体验端 (端口 5173)
│   ├── src/three/                   # Three.js 场景构建、相机控制、商品实例化、空间拾取
│   └── src/components/              # 2D 浮动 HUD、AI 导购弹窗、购物车与商品抽屉
├── frontend-merchant/               # 独立商户后台管理系统 (端口 5174)
└── pom.xml                          # Maven 构建配置
```

---

## 🚀 快速上手与运行

### 1. 准备运行环境
- **JDK**：21 或更高版本
- **Node.js**：v18+ (推荐 v20+)
- **MySQL**：5.7 / 8.0+（端口 `3306`）
- **Redis**：5.0+（端口 `6379`）

### 2. 初始化数据库
在 MySQL 中执行初始化脚本：
```bash
mysql -u root -p123456 < src/main/resources/sql/schema.sql
mysql -u root -p123456 < src/main/resources/sql/data.sql
```

### 3. 启动后端 Spring Boot 服务
```bash
# 项目根目录下
mvn spring-boot:run
```
> 服务默认运行在 `http://localhost:8080`。

### 4. 启动 3D 商业街体验端
```bash
cd frontend-supermarket
npm install
npm run dev
```
> 浏览器访问 `http://localhost:5173`。

### 5. 启动商家管理后台
```bash
cd frontend-merchant
npm install
npm run dev
```
> 浏览器访问 `http://localhost:5174`。

---

## 🧪 自动化测试验证

项目内置完整的单元测试与集成测试套件，在根目录下执行：
```bash
mvn clean test
```
- 覆盖高并发下单防超卖并发锁测试；
- 覆盖多源文档解析（PDF、DOCX、Markdown、本地 OCR）；
- 覆盖 WebSocket 库存广播事件发布与货架售罄标红联动测试；
- 覆盖 3D 全景空间树组装与初始相机点位验证。

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源。
