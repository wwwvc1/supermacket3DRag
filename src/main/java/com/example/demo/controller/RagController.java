package com.example.demo.controller;

import com.example.demo.common.result.Result;
import com.example.demo.entity.KnowledgeDocument;
import com.example.demo.model.dto.ChatRequestDTO;
import com.example.demo.model.vo.ChatResponseVO;
import com.example.demo.service.rag.EmbeddingStrategyFactory;
import com.example.demo.service.rag.RagAgentService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * RAG 知识库与智能体问答控制器
 */
@RestController
@RequestMapping("/api/rag")
public class RagController {

    private final RagAgentService ragAgentService;
    private final EmbeddingStrategyFactory embeddingStrategyFactory;

    public RagController(RagAgentService ragAgentService,
                         EmbeddingStrategyFactory embeddingStrategyFactory) {
        this.ragAgentService = ragAgentService;
        this.embeddingStrategyFactory = embeddingStrategyFactory;
    }

    /**
     * 上传多源文档入库并自动切片向量化 (支持 PDF, Word, Markdown, 图片)
     */
    @PostMapping("/upload")
    public Result<KnowledgeDocument> uploadDocument(@RequestParam("file") MultipartFile file) throws Exception {
        KnowledgeDocument document = ragAgentService.ingestDocument(file);
        return Result.success(document);
    }

    /**
     * 多轮对话智能体问答 (自动检索向量库并生成带精准溯源的回答)
     */
    @PostMapping("/chat")
    public Result<ChatResponseVO> chat(@RequestBody ChatRequestDTO request) {
        ChatResponseVO response = ragAgentService.chat(request);
        return Result.success(response);
    }

    /**
     * 获取所有已入库的知识库文档记录
     */
    @GetMapping("/documents")
    public Result<List<KnowledgeDocument>> listDocuments() {
        List<KnowledgeDocument> list = ragAgentService.listDocuments();
        return Result.success(list);
    }

    /**
     * 动态切换 Embedding 模型引擎 (local: JVM ONNX / online: 云端 OpenAI 兼容)
     */
    @PostMapping("/embedding/switch")
    public Result<String> switchEmbeddingProvider(@RequestParam String provider) {
        embeddingStrategyFactory.switchProvider(provider);
        return Result.success("Embedding 模型已成功切换为: " + embeddingStrategyFactory.getCurrentProvider());
    }
}
