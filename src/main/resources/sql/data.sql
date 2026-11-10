-- 电商企业级 RAG 知识库与 3D 数字孪生超市 - 种子数据脚本

-- 初始管理员/测试用户 (密码: 123456 的 BCrypt 哈希)
INSERT INTO `user` (`id`, `username`, `password`, `phone`) VALUES
(1, 'testuser', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '13800138000')
ON DUPLICATE KEY UPDATE `username`=`username`;

-- 初始 3D 数字孪生商业街独立店铺货架 (Three.js 右手空间直角坐标，沿街两侧分布，以米为单位)
INSERT INTO `shelf` (`id`, `shelf_code`, `name`, `zone`, `position_x`, `position_y`, `position_z`, `rotation_y`, `camera_target_x`, `camera_target_y`, `camera_target_z`, `status`) VALUES
(1, 'A01', '源头直采 · 鲜果果蔬市集', '生鲜果蔬区', 12.0, 0.0, 10.0, 0.0, 9.5, 1.6, 10.0, 'NORMAL'),
(2, 'B01', 'Sony 索尼声学 · 旗舰影音店', '数码影音区', -12.0, 0.0, -3.0, 0.0, -9.5, 1.6, -3.0, 'NORMAL'),
(3, 'C01', 'ROG 玩家极客 · 电竞外设馆', '电脑外设区', -12.0, 0.0, -16.0, 0.0, -9.5, 1.6, -16.0, 'NORMAL'),
(4, 'D01', 'iWatch · 智能穿戴与健康生活馆', '智能穿戴区', 12.0, 0.0, -16.0, 0.0, 9.5, 1.6, -16.0, 'NORMAL'),
(5, 'E01', 'UltraVision · 高端电竞超显中心', '电脑办公区', 0.0, 0.0, -28.0, 0.0, 0.0, 1.6, -25.0, 'NORMAL'),
(6, 'F01', 'Apple 旗舰店 · 手机数码馆', '手机数码区', -12.0, 0.0, 10.0, 0.0, -9.5, 1.6, 10.0, 'NORMAL'),
(7, 'G01', '特仑苏 · 有机乳品与低温冷饮吧', '乳品冷饮区', 12.0, 0.0, -3.0, 0.0, 9.5, 1.6, -3.0, 'NORMAL')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `position_x`=VALUES(`position_x`), `position_z`=VALUES(`position_z`);

-- 初始商品数据 (绑定对应 3D 货架)
INSERT INTO `product` (`id`, `shelf_id`, `name`, `category`, `price`, `stock`, `status`, `description`) VALUES
(1, 6, 'iPhone 16 Pro Max 256GB 暗夜黑', '手机数码', 9999.00, 50, 'ON_SHELF', 'A18 Pro 芯片，超视网膜 XDR 屏，钛金属机身，支持 25W 无线快充与 7 天无理由退货。'),
(2, 2, 'Sony WH-1000XM5 无线降噪头戴耳机', '数码影音', 2299.00, 30, 'ON_SHELF', '双芯驱动旗舰降噪，30小时超长续航，支持 LDAC 高清音频传输，一年全国联保。'),
(3, 3, '客制化三模机械键盘 87键 RGB', '电脑外设', 499.00, 100, 'ON_SHELF', '热插拔轴座，Gasket 结构，全键无冲，PBT 双色键帽，支持蓝牙/2.4G/有线三模。'),
(4, 4, 'Apple Watch Series 10 智能手表', '智能穿戴', 3199.00, 20, 'ON_SHELF', '全天候视网膜显示屏，ECG 心电图检测，50米深度防水，支持快速充电与体温感应。'),
(5, 5, '4K 144Hz Mini-LED 电竞显示器 27英寸', '电脑办公', 2799.00, 15, 'ON_SHELF', '1152 分区背光，HDR1000 认证，1ms 极速响应，支持 Type-C 90W 反向供电。'),
(6, 7, '特仑苏有机全脂纯牛奶 250ml*12盒', '乳品冷饮', 68.00, 80, 'ON_SHELF', '优质乳蛋白 3.8g/100ml，原生高钙，天然有机牧场奶源。'),
(7, 1, '烟台红富士苹果 净重5斤特级果', '生鲜果蔬', 39.90, 60, 'ON_SHELF', '产地直采，脆甜多汁，果香浓郁，冷链新鲜直达。')
ON DUPLICATE KEY UPDATE `name`=`name`;
