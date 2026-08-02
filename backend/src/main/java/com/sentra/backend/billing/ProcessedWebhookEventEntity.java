package com.sentra.backend.billing;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "processed_webhook_events")
@Getter
@NoArgsConstructor
public class ProcessedWebhookEventEntity {

    @Id
    private String eventId;

    private Instant processedAt = Instant.now();

    public ProcessedWebhookEventEntity(String eventId) {
        this.eventId = eventId;
    }
}