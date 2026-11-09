package com.example.demo.service.rag;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.entity.KnowledgeDocument;
import com.example.demo.mapper.KnowledgeDocumentMapper;
import com.example.demo.model.dto.ChatRequestDTO;
import com.example.demo.model.vo.ChatResponseVO;
import com.example.demo.model.vo.SourceCitationVO;
import com.example.demo.service.rag.tool.EcommerceTools;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.memory.ChatMemory;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * RAG 智能体会话与多源知识库检索增强核心服务
 */
@Service
public class RagAgentService {

    private static final Logger log = LoggerFactory.getLogger(RagAgentService.class);

    private final DocumentParserService documentParserService;
    private final EmbeddingStrategyFactory embeddingStrategyFactory;
    private final EmbeddingStore<TextSegment> embeddingStore;
    private final KnowledgeDocumentMapper knowledgeDocumentMapper;
    private final ChatLanguageModel chatLanguageModel;
    private final EcommerceTools ecommerceTools;

    /**
     * 会话维度内存记忆：根据 sessionId 隔离多轮会话上下文
     */
    private final Map<String, ChatMemory> sessionMemories = new ConcurrentHashMap<>();

    public RagAgentService(DocumentParserService documentParserService,
                           EmbeddingStrategyFactory embeddingStrategyFactory,
                           EmbeddingStore<TextSegment> embeddingStore,
                           KnowledgeDocumentMapper knowledgeDocumentMapper,
                           ChatLanguageModel chatLanguageModel,
                           EcommerceTools ecommerceTools) {
        this.documentParserService = documentParserService;
        this.embeddingStrategyFactory = embeddingStrategyFactory;
        this.embeddingStore = embeddingStore;
        this.knowledgeDocumentMapper = knowledgeDocumentMapper;
        this.chatLanguageModel = chatLanguageModel;
        this.ecommerceTools = ecommerceTools;
    }

    /**
     * 上传多源文档并向量化入库 (PDF / Word / Markdown / 本地图片 OCR)
     */
    public KnowledgeDocument ingestDocument(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename();
        log.info("开始处理上传文档: {}", filename);

        // 1. 文档解析与文本切分
        List<TextSegment> segments = documentParserService.parseAndSplit(file);
        if (segments.isEmpty()) {
            throw new IllegalArgumentException("未能从文件中解析出有效文本内容: " + filename);
        }

        // 2. 向量化并批量写入向量数据库 (Chroma / InMemory)
        EmbeddingModel embeddingModel = embeddingStrategyFactory.getEmbeddingModel();
        List<Embedding> embeddings = embeddingModel.embedAll(segments).content();
        embeddingStore.addAll(embeddings, segments);
        log.info("文档 [{}] 的 {} 个切片已成功向量化并存入向量库", filename, segments.size());

        // 3. 记录文档元数据至 MySQL
        String fileType = "UNKNOWN";
        if (filename != null && filename.contains(".")) {
            fileType = filename.substring(filename.lastIndexOf(".") + 1).toUpperCase();
        }

        KnowledgeDocument doc = new KnowledgeDocument(
                filename,
                fileType,
                file.getSize(),
                segments.size(),
                "SUCCESS"
        );
        knowledgeDocumentMapper.insert(doc);

        return doc;
    }

    /**
     * 多轮对话 RAG 问答与精准来源溯源
     */
    public ChatResponseVO chat(ChatRequestDTO request) {
        String sessionId = (request.getSessionId() != null && !request.getSessionId().isBlank())
                ? request.getSessionId().trim()
                : "default_session";
        String question = request.getQuestion();

        if (question == null || question.isBlank()) {
            return new ChatResponseVO("提问内容不能为空。", List.of());
        }

        // 1. 获取或创建当前会话的上下文记忆 (保留最近 10 条交互)
        ChatMemory chatMemory = sessionMemories.computeIfAbsent(sessionId, id ->
                MessageWindowChatMemory.withMaxMessages(10));

        // 2. 向量检索相关知识库切片 (Top 3)
        EmbeddingModel embeddingModel = embeddingStrategyFactory.getEmbeddingModel();
        Embedding questionEmbedding = embeddingModel.embed(question).content();
        dev.langchain4j.store.embedding.EmbeddingSearchRequest searchRequest =
                dev.langchain4j.store.embedding.EmbeddingSearchRequest.builder()
                        .queryEmbedding(questionEmbedding)
                        .maxResults(3)
                        .minScore(0.4)
                        .build();
        List<EmbeddingMatch<TextSegment>> matches = embeddingStore.search(searchRequest).matches();

        List<SourceCitationVO> citations = new ArrayList<>();
        StringBuilder contextBuilder = new StringBuilder();

        int index = 1;
        for (EmbeddingMatch<TextSegment> match : matches) {
            TextSegment segment = match.embedded();
            String sourceFile = segment.metadata().getString("source_file");
            String fileType = segment.metadata().getString("file_type");
            String pageNumber = segment.metadata().getString("page_number");
            String chunkId = segment.metadata().getString("chunk_id");

            SourceCitationVO citation = new SourceCitationVO(
                    index,
                    sourceFile != null ? sourceFile : "未知文档",
                    fileType != null ? fileType : "TXT",
                    pageNumber != null ? pageNumber : "1",
                    chunkId != null ? chunkId : "1",
                    Math.round(match.score() * 100.0) / 100.0,
                    segment.text()
            );
            citations.add(citation);

            contextBuilder.append(String.format("[引用%d] 来源: %s (页码/段落: %s)\n%s\n\n",
                    index, citation.getFileName(), citation.getPageNumber(), segment.text()));
            index++;
        }

        // 3. 检查是否涉及电商商品实时查询工具
        String toolInfo = "";
        if (question.contains("商品") || question.contains("库存") || question.contains("价格")
                || question.contains("多少钱") || question.contains("手机") || question.contains("耳机")) {
            toolInfo = ecommerceTools.queryProductByName(question.replaceAll("[?？什么有吗价格库存]", ""));
        }

        // 4. 构建结构化提示词
        StringBuilder systemPromptBuilder = new StringBuilder();
        systemPromptBuilder.append("你是一个专业的电商知识库智能导购客服助手。\n");
        systemPromptBuilder.append("请根据以下知识库参考资料回答用户问题。若回答引用了参考资料中的内容，请在语句末尾务必注明引用标号（如 [引用1]、[引用2]）。\n");
        systemPromptBuilder.append("如果参考资料不足以完全回答，请友好客观地说明。\n");

        if (!contextBuilder.isEmpty()) {
            systemPromptBuilder.append("\n【知识库检索参考资料】:\n").append(contextBuilder);
        }
        if (!toolInfo.isBlank()) {
            systemPromptBuilder.append("\n【电商系统实时商品查询结果】:\n").append(toolInfo);
        }

        List<ChatMessage> messages = new ArrayList<>(chatMemory.messages());
        messages.add(SystemMessage.from(systemPromptBuilder.toString()));
        messages.add(UserMessage.from(question));

        String answer;
        try {
            // 调用 OpenAI 兼容格式大模型
            AiMessage aiMessage = chatLanguageModel.generate(messages).content();
            answer = aiMessage.text();
        } catch (Exception e) {
            log.warn("大模型调用异常或处于测试环境，启动智能兜底应答生成: {}", e.getMessage());
            // 测试与本地兜底生成：结合检索到的切片精准合成回答
            if (!citations.isEmpty()) {
                StringBuilder fallbackAnswer = new StringBuilder();
                fallbackAnswer.append("根据电商知识库相关文档记载：\n");
                for (SourceCitationVO c : citations) {
                    fallbackAnswer.append(String.format("- %s [引用%d]\n", c.getContentSnippet(), c.getCitationIndex()));
                }
                if (!toolInfo.isBlank()) {
                    fallbackAnswer.append("\n同时为您查询到实时商城商品信息：\n").append(toolInfo);
                }
                answer = fallbackAnswer.toString();
            } else if (!toolInfo.isBlank()) {
                answer = "为您查询到当前商城实时商品数据：\n" + toolInfo;
            } else {
                answer = "您好！我是您的电商智能导购客服助手。关于您的问题「" + question + "」，知识库中暂未检索到直接匹配的规则文档，请问有什么其他商品或售后政策可以帮您？";
            }
        }

        // 5. 在回答尾部格式化追加标准化来源引用清单
        if (!citations.isEmpty()) {
            StringBuilder sourceFooter = new StringBuilder("\n\n【参考来源与溯源】");
            for (SourceCitationVO c : citations) {
                sourceFooter.append(String.format("\n- [引用%d] 《%s》 (%s, 匹配度: %.2f)",
                        c.getCitationIndex(), c.getFileName(), c.getPageNumber(), c.getSimilarityScore()));
            }
            answer = answer + sourceFooter;
        }

        // 6. 沉淀至会话记忆
        chatMemory.add(UserMessage.from(question));
        chatMemory.add(AiMessage.from(answer));

        return new ChatResponseVO(answer, citations);
    }

    /**
     * 获取所有已入库的知识库文档列表
     */
    public List<KnowledgeDocument> listDocuments() {
        return knowledgeDocumentMapper.selectList(new LambdaQueryWrapper<KnowledgeDocument>()
                .orderByDesc(KnowledgeDocument::getId));
    }
}
