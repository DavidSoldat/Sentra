package com.sentra.backend.billing.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PaddleTransactionEvent(
        @JsonProperty("event_type") String eventType,
        PaddleTransactionData data
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PaddleTransactionData(
            String status,
            @JsonProperty("customer_id") String customerId,
            @JsonProperty("subscription_id") String subscriptionId,
            @JsonProperty("custom_data") Map<String, String> customData,
            List<PaddleWebhookEvent.PaddleItem> items
    ) {}
}