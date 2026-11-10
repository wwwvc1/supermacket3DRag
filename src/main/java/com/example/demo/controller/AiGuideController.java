package com.example.demo.controller;

import com.example.demo.common.result.Result;
import com.example.demo.model.dto.GuideRouteRequestDTO;
import com.example.demo.model.vo.GuideRouteResponseVO;
import com.example.demo.service.rag.AiGuideAgentService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * AI 导购机器人巡航路线规划控制器
 */
@RestController
@RequestMapping("/api/supermarket/guide")
public class AiGuideController {

    private final AiGuideAgentService aiGuideAgentService;

    public AiGuideController(AiGuideAgentService aiGuideAgentService) {
        this.aiGuideAgentService = aiGuideAgentService;
    }

    /**
     * 接收用户自由文本购物清单，进行智能商品匹配与空间航路点拓扑排序规划
     */
    @PostMapping("/route")
    public Result<GuideRouteResponseVO> planRoute(@RequestBody GuideRouteRequestDTO request) {
        GuideRouteResponseVO response = aiGuideAgentService.planRoute(request);
        return Result.success(response);
    }
}
