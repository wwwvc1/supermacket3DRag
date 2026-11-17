package com.example.demo.config;

import com.example.demo.entity.Product;
import com.example.demo.entity.Shelf;
import com.example.demo.mapper.ProductMapper;
import com.example.demo.mapper.ShelfMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 数据库结构与三大 3D 旗舰展厅种子数据幂等同步器
 * <p>应用启动后自动检测 MySQL/H2 缺失的新增列（商品多视角图路径、展厅分类、支付宝沙箱订单字段），
 * 并按需补齐 02/03/04 三大展厅的货架与商品记录，不覆盖已有业务库存。</p>
 */
@Component
public class DatabaseSchemaSyncRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSchemaSyncRunner.class);

    private final DataSource dataSource;
    private final ShelfMapper shelfMapper;
    private final ProductMapper productMapper;

    public DatabaseSchemaSyncRunner(DataSource dataSource, ShelfMapper shelfMapper, ProductMapper productMapper) {
        this.dataSource = dataSource;
        this.shelfMapper = shelfMapper;
        this.productMapper = productMapper;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            ensureColumnsExist();
            ensureShowroomShelvesExist();
            ensureShowroomProductsExist();
        } catch (Exception e) {
            log.warn("数据库结构与展厅种子数据幂等校验异常（不影响基础启动）: {}", e.getMessage());
        }
    }

    private void ensureColumnsExist() throws Exception {
        try (Connection conn = dataSource.getConnection()) {
            Set<String> productCols = loadColumnNames(conn, "product");
            try (Statement st = conn.createStatement()) {
                if (!productCols.contains("image_url")) {
                    st.execute("ALTER TABLE `product` ADD COLUMN `image_url` VARCHAR(512) DEFAULT NULL");
                }
                if (!productCols.contains("back_image_url")) {
                    st.execute("ALTER TABLE `product` ADD COLUMN `back_image_url` VARCHAR(512) DEFAULT NULL");
                }
                if (!productCols.contains("side_image_url")) {
                    st.execute("ALTER TABLE `product` ADD COLUMN `side_image_url` VARCHAR(512) DEFAULT NULL");
                }
                if (!productCols.contains("showroom_stage")) {
                    st.execute("ALTER TABLE `product` ADD COLUMN `showroom_stage` VARCHAR(32) DEFAULT NULL");
                }
                if (!productCols.contains("color_hex")) {
                    st.execute("ALTER TABLE `product` ADD COLUMN `color_hex` VARCHAR(32) DEFAULT NULL");
                }
            }

            Set<String> orderCols = loadColumnNames(conn, "orders");
            try (Statement st = conn.createStatement()) {
                if (!orderCols.contains("payment_method")) {
                    st.execute("ALTER TABLE `orders` ADD COLUMN `payment_method` VARCHAR(32) NOT NULL DEFAULT 'UNPAID'");
                }
                if (!orderCols.contains("trade_no")) {
                    st.execute("ALTER TABLE `orders` ADD COLUMN `trade_no` VARCHAR(64) DEFAULT NULL");
                }
                if (!orderCols.contains("paid_at")) {
                    st.execute("ALTER TABLE `orders` ADD COLUMN `paid_at` DATETIME DEFAULT NULL");
                }
                if (!orderCols.contains("pay_subject")) {
                    st.execute("ALTER TABLE `orders` ADD COLUMN `pay_subject` VARCHAR(255) DEFAULT NULL");
                }
            }
        }
    }

    private Set<String> loadColumnNames(Connection conn, String tableName) throws Exception {
        Set<String> cols = new HashSet<>();
        DatabaseMetaData meta = conn.getMetaData();
        String catalog = conn.getCatalog();
        try (ResultSet rs = meta.getColumns(catalog, null, tableName, null)) {
            while (rs.next()) {
                cols.add(rs.getString("COLUMN_NAME").toLowerCase());
            }
        }
        if (cols.isEmpty()) {
            try (ResultSet rs = meta.getColumns(catalog, null, tableName.toUpperCase(), null)) {
                while (rs.next()) {
                    cols.add(rs.getString("COLUMN_NAME").toLowerCase());
                }
            }
        }
        return cols;
    }

    private void ensureShowroomShelvesExist() {
        List<Shelf> showroomShelves = List.of(
                new Shelf(8L, "R01", "KORA · 高定服饰金属悬架滑轨区", "高定服饰区", -6.0, 0.0, 4.0, 0.0, -4.0, 1.6, 5.5, "NORMAL"),
                new Shelf(9L, "T01", "HORIZON · 旗舰数码广角转盘体验区", "旗舰数码展厅", 0.0, 0.0, -8.0, 0.0, 0.0, 1.5, -5.5, "NORMAL"),
                new Shelf(10L, "V01", "VITRINE · 名酒与典藏水波纹玻璃展柜区", "名酒与典藏展柜", 6.0, 0.0, -14.0, 0.0, 4.5, 1.5, -12.0, "NORMAL")
        );

        for (Shelf s : showroomShelves) {
            if (shelfMapper.selectById(s.getId()) == null) {
                insertExplicitShelf(s);
            }
        }
    }

    private void insertExplicitShelf(Shelf s) {
        try (Connection conn = dataSource.getConnection();
             var ps = conn.prepareStatement(
                     "INSERT INTO `shelf` (`id`, `shelf_code`, `name`, `zone`, `position_x`, `position_y`, `position_z`, `rotation_y`, `camera_target_x`, `camera_target_y`, `camera_target_z`, `status`) " +
                             "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
             )) {
            ps.setLong(1, s.getId());
            ps.setString(2, s.getShelfCode());
            ps.setString(3, s.getName());
            ps.setString(4, s.getZone());
            ps.setDouble(5, s.getPositionX());
            ps.setDouble(6, s.getPositionY());
            ps.setDouble(7, s.getPositionZ());
            ps.setDouble(8, s.getRotationY());
            ps.setDouble(9, s.getCameraTargetX());
            ps.setDouble(10, s.getCameraTargetY());
            ps.setDouble(11, s.getCameraTargetZ());
            ps.setString(12, s.getStatus());
            ps.executeUpdate();
            log.info("已自动同步展厅 3D 货架点位: [{} - {}]", s.getShelfCode(), s.getName());
        } catch (Exception ignored) {
            // 若并发或 H2 已存在则跳过
        }
    }

    private void ensureShowroomProductsExist() {
        List<Product> seeds = List.of(
                seed(101L, 8L, "Heavyweight tee · Bone", "高定服饰", "48.00", 18, "240 gsm organic cotton with a tonal DHxWHY embroidery on the chest.", "https://cdn.21st.dev/assets/mirror/14/1485bf44725b18fcdba71bfae54d67d648ab3bff4b24215a042c0cc4c895a2e6.webp", "https://cdn.21st.dev/assets/mirror/69/69937e656430ae33d950303e0d53051273e5b02189750ef1e7429ec4bbf95e20.webp", "https://cdn.21st.dev/assets/mirror/83/838468c32f16b4acba62e4601276737411156052444712ff2534fefe994a7bed.webp", "STAGE_RAIL", "#EFEBE2"),
                seed(102L, 8L, "Graphic tee · CCgather", "高定服饰", "52.00", 16, "Black tee with the CCgather wordmark printed front and back.", "https://cdn.21st.dev/assets/mirror/d7/d769f183472d0fd98a7aff2a643593748cd36ef9da1497d9bf6f0d87d1025a9b.webp", "https://cdn.21st.dev/assets/mirror/fe/fec6f7e96b198cc5b9aad333ca2c4c10968a746d87f6dc11d9c118607b509058.webp", "https://cdn.21st.dev/assets/mirror/b3/b3b6984ea94b8b8cd19fb15387e89dca457ac0f947115c2a54a33217e4fb4571.webp", "STAGE_RAIL", "#101214"),
                seed(103L, 8L, "Oxford shirt · Sky", "高定服饰", "74.00", 14, "Pale sky oxford with a button-down collar and a tiny Maestiq embroidery.", "https://cdn.21st.dev/assets/mirror/47/470a7723cef068f81e8a4c09d1ab3f8630c61b734c2168b10f3858e45efbf31f.webp", "https://cdn.21st.dev/assets/mirror/9b/9be14e5dce879756775677e2d82dadc2ad9a1690b7df2f82de360cb3600d0ee5.webp", "https://cdn.21st.dev/assets/mirror/59/5984d5ca60fd1aeee7e688ec33c2219a1c537fcde90d2accab813c13985f8632.webp", "STAGE_RAIL", "#A3D3EB"),
                seed(104L, 8L, "Knit cardigan · Olive", "高定服饰", "96.00", 12, "Chunky olive wool cardigan with wooden buttons and ribbed trims.", "https://cdn.21st.dev/assets/mirror/58/581b13c5ca241c653dc94d2c8048c92a60f022cfbaaf153261076d3a6655827e.webp", "https://cdn.21st.dev/assets/mirror/d9/d9178d906d37268565cf10af3431aee543aacfc73610f7fa7b0fa4758c498cb3.webp", "https://cdn.21st.dev/assets/mirror/de/dee1c529600e0460413f1a9b07a29bedb7ea7dc96181fce5d9d6501231e6e45d.webp", "STAGE_RAIL", "#758151"),
                seed(105L, 8L, "Hoodie · Maestiq", "高定服饰", "88.00", 15, "Heather fleece hoodie with the Maestiq wordmark across the chest.", "https://cdn.21st.dev/assets/mirror/51/51750ba098dd622df46695bca781b3f0ec336a36b93b070e638cc04455def6d6.webp", "https://cdn.21st.dev/assets/mirror/e7/e75c4ac8fb7f14caae756338a31f81f1437bb312b78e0d7d906e9f956e7968fa.webp", "https://cdn.21st.dev/assets/mirror/a2/a2eb2463d52146c341ede6bb9f6067e917a23eb29b7b1d1d4c40ac084a01c7ce.webp", "STAGE_RAIL", "#A0A5AB"),
                seed(106L, 8L, "Crewneck sweatshirt · Lilac", "高定服饰", "78.00", 18, "Muted lilac fleece crewneck with a raised DHxWHY puff print.", "https://cdn.21st.dev/assets/mirror/8e/8e38660e2add9637c27846d9b8d620f2abb228a5a153ccfd7b1c808b6845e1f8.webp", "https://cdn.21st.dev/assets/mirror/b9/b9214a6e009ce4b3044595a51ea010c299135bab5b26775c43d7175c86e77898.webp", "https://cdn.21st.dev/assets/mirror/59/591872e42b483c43c1cd08a3ac4d7d40c0b5fa2bc585a36096faded2e696e84e.webp", "STAGE_RAIL", "#CCB2E0"),
                seed(107L, 8L, "Piqué polo · Forest", "高定服饰", "62.00", 20, "Forest piqué polo with a bone CCgather embroidery on the chest.", "https://cdn.21st.dev/assets/mirror/19/19fe43cb681195ae227e3164088d86a07a1b6e33cc54c6e35637374736a16894.webp", "https://cdn.21st.dev/assets/mirror/e0/e095182b1a7f04e600c5662aa871b4c055c294b152586817d84e312c22f744cf.webp", "https://cdn.21st.dev/assets/mirror/00/005a8e10be234bc40917f3153208b8196ba1610c53c987e39942da1f4a7cd808.webp", "STAGE_RAIL", "#185B37"),
                seed(108L, 8L, "Henley · Brick", "高定服饰", "56.00", 17, "Dusty brick henley with a three-button placket, worn in from day one.", "https://cdn.21st.dev/assets/mirror/84/84aa4b0e21ed11fcbc083647a607b94ee3a6c21cb66c114cfb1dad0792c15499.webp", "https://cdn.21st.dev/assets/mirror/01/01c299df56a29afca8dad4a64858bd506667338bfbd0435118e6c3698c7881b3.webp", "https://cdn.21st.dev/assets/mirror/9c/9ca38eeb156aae7d199d3c1ffb7947e395f77d1f094eea006c1b5fbb22352b4e.webp", "STAGE_RAIL", "#B05139"),
                seed(109L, 8L, "Breton long sleeve", "高定服饰", "58.00", 15, "Classic ink-and-bone Breton stripe with a boat neck.", "https://cdn.21st.dev/assets/mirror/09/096002a95aba7de9c197de4cb5c78cbbe17c1677b19c547cc20c6dbef47a899c.webp", "https://cdn.21st.dev/assets/mirror/74/74408a7dbb4f4fc6761ebb8d6ed93187248cddf75e1c2e70d38d04dfdd328776.webp", "https://cdn.21st.dev/assets/mirror/ed/eda3afca537071a80d7d82b3f0d1055b56f1f3263c20772224bae6660bf4072c.webp", "STAGE_RAIL", "#E4DFD3"),
                seed(110L, 8L, "Oversized tee · CCgather", "高定服饰", "52.00", 19, "Boxy ochre tee with a small chest mark and a large CCgather back print.", "https://cdn.21st.dev/assets/mirror/72/7208c811f54e123dd7b1a5c1c3926f43ca832f6c4c20c45de10671ffd544409d.webp", "https://cdn.21st.dev/assets/mirror/d3/d356989b7bc741c5cfc934cac34983dfb24d5d6a6b6e7b8b7f6b27cd3eceae69.webp", "https://cdn.21st.dev/assets/mirror/bf/bf94beeafb21f9cb21aa45057a67dc8a2e23ba95c7ac0f79dd27ba3ce4a1230c.webp", "STAGE_RAIL", "#DE9C31"),
                seed(201L, 9L, "Samsung Galaxy S22 Ultra · Burgundy", "手机数码", "8999.00", 14, "Built-in S Pen flagship with 108MP pro-grade quad camera system, Armor Aluminum frame, and Dynamic AMOLED 2X.", "/products/samsung-s22-ultra.png", "/products/samsung-s22-ultra.png", null, "STAGE_TECH", "#00F0FF"),
                seed(202L, 9L, "HUAWEI Mate RS · Porsche Design", "手机数码", "9999.00", 8, "Aerospace-cooled microcapsule PCM chassis with Leica triple optics and dual in-screen fingerprint architecture.", "/products/huawei-mate-rs.jpg", "/products/huawei-mate-rs.jpg", null, "STAGE_TECH", "#FF2A54"),
                seed(203L, 9L, "Apple iPhone 12 · Mint Edition", "手机数码", "5499.00", 16, "Ceramic Shield front glass with aerospace-grade aluminum edges, A14 Bionic neural engine, and Super Retina XDR.", "/products/iphone-12-mint.png", "/products/iphone-12-mint.png", null, "STAGE_TECH", "#A8E6CF"),
                seed(204L, 9L, "DJI Mavic 3 Enterprise · RTK Drone", "航拍数码", "23800.00", 5, "4/3 CMOS Hasselblad wide camera with 56× hybrid zoom tele lens, omnidirectional obstacle sensing, and RTK module.", "/products/dji-mavic-3.png", "/products/dji-mavic-3.png", null, "STAGE_TECH", "#FFA500"),
                seed(205L, 9L, "DJI Osmo Mobile · 3-Axis Gimbal", "影像配件", "999.00", 22, "Foldable magnetic 3-axis smartphone stabilizer with built-in extension rod, ActiveTrack 6.0, and ShotGuides.", "/products/dji-osmo-mobile.png", "/products/dji-osmo-mobile.png", null, "STAGE_TECH", "#C8C3F2"),
                seed(301L, 10L, "贵州茅台酒 · 飞天典藏 500ml", "典藏名酒", "2799.00", 10, "核心产区坤沙大曲酱香工艺，五年陶坛陈酿勾调，乳白避光瓷瓶配经典飞天飘带礼盒。", "/products/moutai-feitian.jpg", "/products/moutai-feitian.jpg", null, "STAGE_VITRINE", "#A8E6CF"),
                seed(302L, 10L, "五粮液 · 52度水晶礼盒纪念酒", "典藏名酒", "1399.00", 8, "五种粮食古法包包曲酿造，高透多面切割亚克力水晶防尘礼盒封装，窖香浓郁回甘。", "/products/wuliangye-crystal.jpg", "/products/wuliangye-crystal.jpg", null, "STAGE_VITRINE", "#C8C3F2"),
                seed(303L, 10L, "Beringer · 贝灵哲私家珍藏赤霞珠干红", "典藏名酒", "1680.00", 6, "纳帕谷百年名庄私家珍藏（Private Reserve），法国全新橡木桶陈酿 20 个月，深邃黑醋栗与雪松单宁。", "/products/beringer-reserve.jpg", "/products/beringer-reserve.jpg", null, "STAGE_VITRINE", "#DDD9FB"),
                seed(304L, 10L, "Briar Artisan · 石楠木手工弯式烟斗", "典藏器物", "3280.00", 5, "地中海百年老根石楠木火焰纹手工打磨，纯银戒圈配手工硫化硬胶咬嘴与真皮礼盒。", "/products/briar-pipe.jpg", "/products/briar-pipe.jpg", null, "STAGE_VITRINE", "#DE9C31"),
                seed(305L, 10L, "Mavic 3 Enterprise · 航测典藏套装", "典藏器物", "25999.00", 4, "配备 RTK 厘米级高精度定位模块与哈苏 4/3 CMOS 广角镜头，博物馆级独立恒温防尘柜陈列。", "/products/dji-mavic-3.png", "/products/dji-mavic-3.png", null, "STAGE_VITRINE", "#00F0FF"),
                seed(306L, 10L, "Porsche Design · 徕卡三摄限量典藏版", "典藏器物", "12999.00", 3, "保时捷设计工作室联名流线超跑八曲面机身，航空级微胶囊散热与徕卡三摄光学模组。", "/products/huawei-mate-rs.jpg", "/products/huawei-mate-rs.jpg", null, "STAGE_VITRINE", "#00FF66")
        );

        for (Product p : seeds) {
            if (productMapper.selectById(p.getId()) == null) {
                insertExplicitProduct(p);
            }
        }
    }

    private Product seed(Long id, Long shelfId, String name, String category, String price, int stock,
                         String desc, String img, String backImg, String sideImg, String stage, String colorHex) {
        Product p = new Product(id, shelfId, name, category, new BigDecimal(price), stock, "ON_SHELF", desc);
        p.setImageUrl(img);
        p.setBackImageUrl(backImg);
        p.setSideImageUrl(sideImg);
        p.setShowroomStage(stage);
        p.setColorHex(colorHex);
        p.setCreatedAt(LocalDateTime.now());
        p.setUpdatedAt(LocalDateTime.now());
        return p;
    }

    private void insertExplicitProduct(Product p) {
        try (Connection conn = dataSource.getConnection();
             var ps = conn.prepareStatement(
                     "INSERT INTO `product` (`id`, `shelf_id`, `name`, `category`, `price`, `stock`, `status`, `description`, `image_url`, `back_image_url`, `side_image_url`, `showroom_stage`, `color_hex`) " +
                             "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
             )) {
            ps.setLong(1, p.getId());
            ps.setLong(2, p.getShelfId());
            ps.setString(3, p.getName());
            ps.setString(4, p.getCategory());
            ps.setBigDecimal(5, p.getPrice());
            ps.setInt(6, p.getStock());
            ps.setString(7, p.getStatus());
            ps.setString(8, p.getDescription());
            ps.setString(9, p.getImageUrl());
            ps.setString(10, p.getBackImageUrl());
            ps.setString(11, p.getSideImageUrl());
            ps.setString(12, p.getShowroomStage());
            ps.setString(13, p.getColorHex());
            ps.executeUpdate();
            log.info("已自动同步旗舰展厅商品: [id={}, stage={}, name={}]", p.getId(), p.getShowroomStage(), p.getName());
        } catch (Exception ignored) {
            // 若已存在则保留原库存
        }
    }
}
