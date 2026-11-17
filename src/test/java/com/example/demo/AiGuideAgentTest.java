package com.example.demo;

import com.example.demo.common.result.Result;
import com.example.demo.controller.AiGuideController;
import com.example.demo.model.dto.GuideRouteRequestDTO;
import com.example.demo.model.vo.GuideRouteResponseVO;
import com.example.demo.model.vo.WaypointVO;
import com.example.demo.service.rag.AiGuideAgentService;
import com.example.demo.service.rag.tool.EcommerceTools;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * AI 智能导购机器人与 3D 空间动线规划单元测试
 */
@SpringBootTest
class AiGuideAgentTest {

    @Autowired
    private AiGuideAgentService guideAgentService;

    @Autowired
    private AiGuideController aiGuideController;

    @Autowired
    private EcommerceTools ecommerceTools;

    @Test
    @DisplayName("测试自然语言清单意图解析与最近邻 3D 导购动线规划")
    void testGuideRoutePlanning() {
        GuideRouteRequestDTO request = new GuideRouteRequestDTO(
                "我想买一箱牛奶，一台笔记本电脑，还要一副降噪耳机"
        );

        Result<GuideRouteResponseVO> result = aiGuideController.planRoute(request);
        assertNotNull(result);
        assertEquals(200, result.getCode());

        GuideRouteResponseVO response = result.getData();
        assertNotNull(response);
        assertNotNull(response.getSummary(), "导购总览播报词不能为空");
        assertTrue(response.getTotalStops() >= 2, "应当至少匹配出牛奶、笔记本电脑或耳机等在架商品");

        List<WaypointVO> waypoints = response.getWaypoints();
        assertNotNull(waypoints);
        assertEquals(response.getTotalStops(), waypoints.size());

        // 校验动线点位严格自增并具备 3D 空间导向数据
        int expectedStep = 1;
        for (WaypointVO wp : waypoints) {
            assertEquals(expectedStep++, wp.getStep(), "动线导航步骤编号必须依次自增");
            assertNotNull(wp.getProductId());
            assertNotNull(wp.getProductName());
            assertNotNull(wp.getShelfCode());
            assertNotNull(wp.getPositionX(), "导航点位必须具备 X 坐标");
            assertNotNull(wp.getPositionY(), "导航点位必须具备 Y 坐标");
            assertNotNull(wp.getPositionZ(), "导航点位必须具备 Z 坐标");
            assertNotNull(wp.getCameraTargetX(), "必须附带 3D 镜头特写巡检机位 X");
            assertNotNull(wp.getCameraTargetY(), "必须附带 3D 镜头特写巡检机位 Y");
            assertNotNull(wp.getCameraTargetZ(), "必须附带 3D 镜头特写巡检机位 Z");
            assertNotNull(wp.getGuideSpeech(), "点位专属导购语音播报文案不能为空");
            assertFalse(wp.getGuideSpeech().isBlank());
        }
    }

    @Test
    @DisplayName("测试空清单或未匹配商品的优雅兜底处理")
    void testEmptyListRoutePlanning() {
        GuideRouteRequestDTO emptyRequest = new GuideRouteRequestDTO("");

        Result<GuideRouteResponseVO> result = aiGuideController.planRoute(emptyRequest);
        assertNotNull(result);
        assertEquals(200, result.getCode());
        GuideRouteResponseVO response = result.getData();
        assertNotNull(response);
        assertEquals(0, response.getTotalStops());
        assertTrue(response.getWaypoints().isEmpty());
    }

    @Test
    @DisplayName("测试中英文品牌别名字典及量词切分边界（三星手机 + 茅台）")
    void testBilingualQuantifierAndBrandLookup() {
        GuideRouteRequestDTO request = new GuideRouteRequestDTO("我想买一部三星手机和茅台");
        Result<GuideRouteResponseVO> result = aiGuideController.planRoute(request);

        assertNotNull(result);
        assertEquals(200, result.getCode());
        GuideRouteResponseVO response = result.getData();
        assertNotNull(response);
        assertTrue(response.getTotalStops() >= 2, "应当同时命中三星手机与贵州茅台酒");

        List<WaypointVO> waypoints = response.getWaypoints();
        assertTrue(
                waypoints.stream().anyMatch(wp -> wp.getProductName() != null && wp.getProductName().contains("Samsung")),
                "导购路径应命中 Samsung Galaxy S22 Ultra"
        );
        assertTrue(
                waypoints.stream().anyMatch(wp -> wp.getProductName() != null && wp.getProductName().contains("茅台")),
                "导购路径应命中贵州茅台酒"
        );

        String toolSummary = ecommerceTools.queryProductByName("你好，请问店里现在有什么三星手机？");
        assertNotNull(toolSummary);
        assertTrue(toolSummary.contains("Samsung Galaxy S22 Ultra"),
                "EcommerceTools 应展开寒暄词与三星英文别名并命中 Samsung Galaxy S22 Ultra");
    }
}
