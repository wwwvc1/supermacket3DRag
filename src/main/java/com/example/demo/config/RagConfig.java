package com.example.demo.config;

import com.example.demo.service.rag.EmbeddingStrategyFactory;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.chroma.ChromaEmbeddingStore;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * LangChain4j RAG 核心配置：装配大模型底座、向量存储与检索器
 */
@Configuration
public class RagConfig {

    private static final Logger log = LoggerFactory.getLogger(RagConfig.class);

    @Value("${rag.llm.base-url:https://api.openai.com/v1}")
    private String llmBaseUrl;

    @Value("${rag.llm.api-key:demo-api-key}")
    private String llmApiKey;

    @Value("${rag.llm.model-name:gpt-4o-mini}")
    private String llmModelName;

    @Value("${rag.chroma.host:http://localhost:8000}")
    private String chromaHost;

    @Value("${rag.chroma.collection-name:ecommerce_knowledge}")
    private String collectionName;

    @Value("${rag.chroma.fallback-to-in-memory:true}")
    private boolean fallbackToInMemory;

    /**
     * 装配 OpenAI 兼容格式大模型
     */
    @Bean
    public ChatLanguageModel chatLanguageModel() {
        log.info("初始化 LangChain4j OpenAI-Compatible LLM: URL={}, Model={}", llmBaseUrl, llmModelName);
        return OpenAiChatModel.builder()
                .baseUrl(llmBaseUrl)
                .apiKey(llmApiKey)
                .modelName(llmModelName)
                .timeout(Duration.ofSeconds(60))
                .build();
    }

    /**
     * 装配统一向量数据库存储 (支持 Chroma 与 InMemory 自动降级)
     */
    @Bean
    public EmbeddingStore<TextSegment> embeddingStore() {
        if (!fallbackToInMemory) {
            log.info("严格模式：连接独立 Chroma 向量数据库 [{}]", chromaHost);
            return ChromaEmbeddingStore.builder()
                    .baseUrl(chromaHost)
                    .collectionName(collectionName)
                    .build();
        }

        // 探测 Chroma 服务是否可达
        boolean chromaAvailable = false;
        try {
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofMillis(800)).build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(chromaHost + "/api/v1/heartbeat"))
                    .timeout(Duration.ofMillis(800))
                    .GET()
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                chromaAvailable = true;
            }
        } catch (Exception ignored) {
            // 连接失败则自动触发兜底
        }

        if (chromaAvailable) {
            log.info("成功连接独立 Chroma 服务 [{}]，启用持久化向量存储", chromaHost);
            return ChromaEmbeddingStore.builder()
                    .baseUrl(chromaHost)
                    .collectionName(collectionName)
                    .build();
        } else {
            log.info("未检测到运行中的 Chroma 服务，自动启用【InMemoryEmbeddingStore 内存向量库】兜底模式 (零外部依赖秒级跑通)", chromaHost);
            return new InMemoryEmbeddingStore<>();
        }
    }

    /**
     * 装配知识库内容检索器 (ContentRetriever)
     */
    @Bean
    public ContentRetriever contentRetriever(EmbeddingStore<TextSegment> embeddingStore,
                                            EmbeddingStrategyFactory embeddingStrategyFactory) {
        EmbeddingModel embeddingModel = embeddingStrategyFactory.getEmbeddingModel();
        return EmbeddingStoreContentRetriever.builder()
                .embeddingStore(embeddingStore)
                .embeddingModel(embeddingModel)
                .maxResults(3)
                .minScore(0.5)
                .build();
    }
}
