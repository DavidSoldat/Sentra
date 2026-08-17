package com.sentra.backend.config;

import com.sentra.backend.ai.enums.AiModel;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.anthropic.AnthropicChatModel;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2q.AllMiniLmL6V2QuantizedEmbeddingModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.pgvector.PgVectorEmbeddingStore;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.util.Map;

@Configuration
public class AiConfig {

    @Value("${anthropic.api-key}")
    private String anthropicApiKey;

    @Value("${openai.api-key}")
    private String openAiApiKey;

    @Value("${sentra.rag.top-k}")
    private int topK;

    @Bean
    public EmbeddingModel embeddingModel() {
        return new AllMiniLmL6V2QuantizedEmbeddingModel();
    }

    @Bean
    public EmbeddingStore<TextSegment> embeddingStore(DataSource dataSource) {
        return PgVectorEmbeddingStore.datasourceBuilder()
                .datasource(dataSource)
                .table("code_chunks")
                .dimension(384)
                .createTable(false)
                .build();
    }

    @Bean
    @Qualifier("claudeHaiku")
    public ChatModel claudeHaikuModel() {
        return AnthropicChatModel.builder()
                .apiKey(anthropicApiKey)
                .modelName("claude-haiku-4-5-20251001")
                .maxTokens(2048)
                .temperature(0.0)
                .build();
    }

    @Bean
    @Qualifier("claudeSonnet")
    public ChatModel claudeSonnetModel() {
        return AnthropicChatModel.builder()
                .apiKey(anthropicApiKey)
                .modelName("claude-sonnet-4-6")
                .maxTokens(2048)
                .temperature(0.0)
                .build();
    }

    @Bean
    @Qualifier("gpt4oMini")
    public ChatModel gpt4oMiniModel() {
        return OpenAiChatModel.builder()
                .apiKey(openAiApiKey)
                .modelName("gpt-4o-mini")
                .maxTokens(2048)
                .temperature(0.0)
                .build();
    }

    @Bean
    @Qualifier("gpt4o")
    public ChatModel gpt4oModel() {
        return OpenAiChatModel.builder()
                .apiKey(openAiApiKey)
                .modelName("gpt-4o")
                .maxTokens(2048)
                .temperature(0.0)
                .build();
    }

    @Bean
    public Map<AiModel, ChatModel> aiModels(
            @Qualifier("claudeHaiku") ChatModel claudeHaiku,
            @Qualifier("claudeSonnet") ChatModel claudeSonnet,
            @Qualifier("gpt4oMini") ChatModel gpt4oMini,
            @Qualifier("gpt4o") ChatModel gpt4o) {
        return Map.of(
                AiModel.CLAUDE_HAIKU, claudeHaiku,
                AiModel.CLAUDE_SONNET, claudeSonnet,
                AiModel.GPT_4O_MINI, gpt4oMini,
                AiModel.GPT_4O, gpt4o
        );
    }
}