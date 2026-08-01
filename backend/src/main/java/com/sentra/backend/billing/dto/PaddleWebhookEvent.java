package com.sentra.backend.billing.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PaddleWebhookEvent(
        @JsonProperty("event_id") String eventId,
        @JsonProperty("event_type") String eventType,
        @JsonProperty("occurred_at") String occurredAt,
        PaddleSubscriptionData data
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PaddleSubscriptionData(
            String id,
            String status,
            @JsonProperty("customer_id") String customerId,
            @JsonProperty("custom_data") Map<String, String> customData,
            List<PaddleItem> items
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PaddleItem(PaddlePrice price) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PaddlePrice(
            String id,
            @JsonProperty("product_id") String productId
    ) {}
}