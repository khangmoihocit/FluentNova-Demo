package com.khangmoihocit.VocabFlow.core.config;

import com.google.genai.Client;
import com.khangmoihocit.VocabFlow.integration.GeminiChatClientPool;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.ai.model.tool.ToolCallingManager;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.retry.RetryTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Slf4j(topic = "GEMINI KEY ROTATION CONFIG")
@Configuration
public class GeminiKeyRotationConfig {

    @Bean
    public GeminiChatClientPool geminiChatClientPool(
            GeminiProperties geminiProperties,
            ToolCallingManager toolCallingManager,
            ObjectProvider<RetryTemplate> retryTemplateProvider,
            ObjectProvider<ObservationRegistry> observationRegistryProvider
    ) throws Exception {

        List<String> apiKeys = geminiProperties.getApiKeys() == null
                ? List.of()
                : geminiProperties.getApiKeys().stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(key -> !key.isEmpty())
                .toList();
        if (apiKeys == null || apiKeys.isEmpty()) {
            throw new IllegalStateException(
                    "Cần cấu hình ít nhất 1 Gemini API key trong 'gemini.api-keys' tại application.yml");
        }

        // Dùng defaults nếu các bean optional không có sẵn
        RetryTemplate retryTemplate = retryTemplateProvider
                .getIfAvailable(RetryTemplate::new);
        ObservationRegistry observationRegistry = observationRegistryProvider
                .getIfAvailable(() -> ObservationRegistry.NOOP);

        // Options dùng chung cho tất cả model (cùng model name)
        GoogleGenAiChatOptions sharedOptions = GoogleGenAiChatOptions.builder()
                .model(geminiProperties.getModel())
                .build();

        List<ChatClient> clients = new ArrayList<>(apiKeys.size());
        for (int i = 0; i < apiKeys.size(); i++) {
            String apiKey = apiKeys.get(i);
            String maskedKey = apiKey.length() > 4
                    ? apiKey.substring(0, 4) + "****" + apiKey.substring(apiKey.length() - 4)
                    : "****";

            // Tạo Google GenAI Client riêng biệt cho mỗi key
            Client genAiClient = Client.builder()
                    .apiKey(apiKey)
                    .build();

            // Tạo ChatModel với key tương ứng
            GoogleGenAiChatModel chatModel = new GoogleGenAiChatModel(
                    genAiClient,
                    sharedOptions,
                    toolCallingManager,
                    retryTemplate,
                    observationRegistry
            );

            clients.add(ChatClient.builder(chatModel).build());
            log.info("Đã đăng ký Gemini API key #{}: [{}]", i + 1, maskedKey);
        }

        return new GeminiChatClientPool(clients, apiKeys, geminiProperties.getKeyCooldownSeconds());
    }
}
