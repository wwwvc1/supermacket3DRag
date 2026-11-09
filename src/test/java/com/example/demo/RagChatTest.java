package com.example.demo;

import com.example.demo.model.dto.ChatRequestDTO;
import com.example.demo.model.vo.ChatResponseVO;
import com.example.demo.service.rag.EmbeddingStrategyFactory;
import com.example.demo.service.rag.RagAgentService;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class RagChatTest {

    @Autowired
    private RagAgentService ragAgentService;

    @Autowired
    private EmbeddingStrategyFactory embeddingStrategyFactory;

    @Autowired
    private EmbeddingStore<TextSegment> embeddingStore;

    @Test
    @DisplayName("测试 RAG 检索增强多轮问答与精准来源溯源")
    void testRagChatAndCitations() {
        // 1. 预先向向量库写入一条带有元数据的切片
        String docText = "Apple iPhone 16 Pro 暗夜黑支持 25W 快速无线充电，并在签收 7 天内享受无理由退换。";
        Metadata metadata = new Metadata();
        metadata.put("source_file", "iPhone16规格与售后手册.pdf");
        metadata.put("file_type", "PDF");
        metadata.put("page_number", "第3页");
        metadata.put("chunk_id", "1");

        TextSegment segment = TextSegment.from(docText, metadata);
        EmbeddingModel model = embeddingStrategyFactory.getEmbeddingModel();
        Embedding embedding = model.embed(segment).content();
        embeddingStore.addAll(List.of(embedding), List.of(segment));

        // 2. 第一轮提问
        String sessionId = "test-session-" + System.currentTimeMillis();
        ChatRequestDTO request1 = new ChatRequestDTO(sessionId, "请问 iPhone 16 支持多大功率的无线快充？退换货政策如何？");
        ChatResponseVO response1 = ragAgentService.chat(request1);

        assertNotNull(response1);
        assertNotNull(response1.getAnswer());
        assertFalse(response1.getSources().isEmpty(), "必须成功召回切片并附带溯源列表");

        // 验证来源溯源细节
        assertEquals("iPhone16规格与售后手册.pdf", response1.getSources().getFirst().getFileName());
        assertEquals("第3页", response1.getSources().getFirst().getPageNumber());
        assertTrue(response1.getAnswer().contains("[引用1]"), "回答正文必须包含 [引用1] 标注");

        // 3. 第二轮连续追问 (多轮会话继承)
        ChatRequestDTO request2 = new ChatRequestDTO(sessionId, "那它是什么颜色的？");
        ChatResponseVO response2 = ragAgentService.chat(request2);

        assertNotNull(response2);
        assertNotNull(response2.getAnswer());
    }

    @Test
    @DisplayName("测试 Embedding 本地/云端双引擎动态热切换")
    void testEmbeddingStrategySwitching() {
        // 默认应当为本地 JVM ONNX 模式
        assertEquals("local", embeddingStrategyFactory.getCurrentProvider());
        assertNotNull(embeddingStrategyFactory.getEmbeddingModel());

        // 动态切换为云端在线模式
        embeddingStrategyFactory.switchProvider("online");
        assertEquals("online", embeddingStrategyFactory.getCurrentProvider());
        assertNotNull(embeddingStrategyFactory.getEmbeddingModel());

        // 切换回本地模式
        embeddingStrategyFactory.switchProvider("local");
        assertEquals("local", embeddingStrategyFactory.getCurrentProvider());
    }
}
