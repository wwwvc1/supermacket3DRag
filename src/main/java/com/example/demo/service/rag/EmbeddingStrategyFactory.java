package com.example.demo.service.rag;

import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.bgesmallzh.BgeSmallZhEmbeddingModel;
import dev.langchain4j.model.openai.OpenAiEmbeddingModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 动态 Embedding 策略工厂：支持本地小模型 (ONNX BGE-Small-ZH) 与云端模型 (OpenAI-Compatible) 一键切换
 */
@Component
public class EmbeddingStrategyFactory {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingStrategyFactory.class);

    @Value("${rag.embedding.provider:local}")
    private String provider;

    @Value("${rag.embedding.online.base-url:https://api.openai.com/v1}")
    private String onlineBaseUrl;

    @Value("${rag.embedding.online.api-key:demo-api-key}")
    private String onlineApiKey;

    @Value("${rag.embedding.online.model-name:text-embedding-3-small}")
    private String onlineModelName;

    private volatile EmbeddingModel cachedModel;

    /**
     * 获取当前生效的 EmbeddingModel
     */
    public synchronized EmbeddingModel getEmbeddingModel() {
        if (cachedModel != null) {
            return cachedModel;
        }

        if ("online".equalsIgnoreCase(provider)) {
            log.info("启用【云端 OpenAI 兼容】Embedding 模型: URL={}, Model={}", onlineBaseUrl, onlineModelName);
            cachedModel = OpenAiEmbeddingModel.builder()
                    .baseUrl(onlineBaseUrl)
                    .apiKey(onlineApiKey)
                    .modelName(onlineModelName)
                    .build();
        } else {
            log.info("启用【本地 JVM 内置 ONNX】Embedding 模型: BGE-Small-ZH (零外部环境依赖)");
            cachedModel = new BgeSmallZhEmbeddingModel();
        }

        return cachedModel;
    }

    /**
     * 支持运行时动态切换模式 (便于测试和演示切换)
     *
     * @param targetProvider "local" 或 "online"
     */
    public synchronized void switchProvider(String targetProvider) {
        this.provider = targetProvider;
        this.cachedModel = null;
        getEmbeddingModel();
        log.info("Embedding 引擎已成功热切换至: {}", targetProvider);
    }

    public String getCurrentProvider() {
        return provider;
    }
}
