package com.sentra.backend.billing;

import com.sentra.backend.billing.entity.ProcessedWebhookEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcessedWebhookEventRepository extends JpaRepository<ProcessedWebhookEventEntity, String> {
}