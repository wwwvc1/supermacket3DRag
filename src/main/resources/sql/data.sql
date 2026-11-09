-- 电商企业级 RAG 知识库智能体系统 - 种子数据脚本

-- 初始管理员/测试用户 (密码: 123456 的 BCrypt 哈希)
INSERT INTO `user` (`id`, `username`, `password`, `phone`) VALUES
(1, 'testuser', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '13800138000')
ON DUPLICATE KEY UPDATE `username`=`username`;

-- 初始商品数据
INSERT INTO `product` (`id`, `name`, `category`, `price`, `stock`, `description`) VALUES
(1, 'iPhone 16 Pro Max 256GB 暗夜黑', '手机数码', 9999.00, 50, 'A18 Pro 芯片，超视网膜 XDR 屏，钛金属机身，支持 25W 无线快充与 7 天无理由退货。'),
(2, 'Sony WH-1000XM5 无线降噪头戴耳机', '数码影音', 2299.00, 30, '双芯驱动旗舰降噪，30小时超长续航，支持 LDAC 高清音频传输，一年全国联保。'),
(3, '客制化三模机械键盘 87键 RGB', '电脑外设', 499.00, 100, '热插拔轴座，Gasket 结构，全键无冲，PBT 双色键帽，支持蓝牙/2.4G/有线三模。'),
(4, 'Apple Watch Series 10 智能手表', '智能穿戴', 3199.00, 20, '全天候视网膜显示屏，ECG 心电图检测，50米深度防水，支持快速充电与体温感应。'),
(5, '4K 144Hz Mini-LED 电竞显示器 27英寸', '电脑办公', 2799.00, 15, '1152 分区背光，HDR1000 认证，1ms 极速响应，支持 Type-C 90W 反向供电。')
ON DUPLICATE KEY UPDATE `name`=`name`;
