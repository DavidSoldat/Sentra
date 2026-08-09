package com.sentra.backend.billing;

import com.sentra.backend.billing.dto.PaddlePortalSessionResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Slf4j
@Component
public class PaddleApiClient {

    private final RestClient restClient;

    public PaddleApiClient(
            @Value("${paddle.api-key}") String apiKey,
            @Value("${paddle.api-base-url}") String baseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, "application/json")
                .build();
    }

    public String createPortalSessionUrl(String customerId) {
        PaddlePortalSessionResponse response = restClient.post()
                .uri("/customers/{customerId}/portal-sessions", customerId)
                .retrieve()
                .body(PaddlePortalSessionResponse.class);

        if (response == null || response.data() == null
                || response.data().urls() == null
                || response.data().urls().general() == null) {
            throw new IllegalStateException(
                    "Paddle returned no portal session URL for customer " + customerId);
        }

        return response.data().urls().general().overview();
    }

    public void cancelSubscription(String subscriptionId) {
        restClient.post()
                .uri("/subscriptions/{subscriptionId}/cancel", subscriptionId)
                .body(java.util.Map.of("effective_from", "immediately"))
                .retrieve()
                .toBodilessEntity();
    }
}