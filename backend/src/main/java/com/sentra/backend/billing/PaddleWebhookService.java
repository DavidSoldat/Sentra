package com.sentra.backend.billing;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentra.backend.billing.dto.PaddleTransactionEvent;
import com.sentra.backend.billing.dto.PaddleWebhookEvent;
import com.sentra.backend.user.UserEntity;
import com.sentra.backend.user.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
public class PaddleWebhookService {

    private static final Set<String> ACTIVE_STATUSES = Set.of("active", "trialing");
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final ProcessedWebhookEventRepository processedEventRepository;

    public PaddleWebhookService(
            UserRepository userRepository,
            SubscriptionRepository subscriptionRepository,
            ProcessedWebhookEventRepository processedEventRepository) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.processedEventRepository = processedEventRepository;
    }

    @Transactional
    public void process(String rawBody) {
        com.fasterxml.jackson.databind.JsonNode root;
        try {
            root = OBJECT_MAPPER.readTree(rawBody);
        } catch (Exception e) {
            log.error("Failed to parse Paddle webhook payload", e);
            return;
        }

        String eventId = root.path("event_id").asText(null);
        String eventType = root.path("event_type").asText(null);

        if (eventId == null || eventType == null) {
            log.warn("Paddle webhook missing event_id or event_type — cannot process");
            return;
        }

        if (processedEventRepository.existsById(eventId)) {
            log.info("Skipping already-processed Paddle event {} ({})", eventId, eventType);
            return;
        }

        switch (eventType) {
            case "subscription.created", "subscription.updated" -> handleSubscriptionUpsert(rawBody);
            case "subscription.canceled" -> handleSubscriptionCanceled(rawBody);
            case "transaction.completed" -> handleTransactionCompleted(rawBody);
            default -> log.debug("Ignoring unhandled Paddle event type: {}", eventType);
        }

        processedEventRepository.save(new ProcessedWebhookEventEntity(eventId));
    }

    private void handleSubscriptionUpsert(String rawBody) {
        PaddleWebhookEvent event = parseOrNull(rawBody, PaddleWebhookEvent.class, "subscription upsert");
        if (event == null) return;

        var data = event.data();
        if (data == null) {
            log.warn("Paddle event {} had no data payload", event.eventType());
            return;
        }

        Long userId = extractUserId(data.customData());
        if (userId == null) {
            log.warn("Paddle event {} for subscription {} had no custom_data.userId — cannot map to a user",
                    event.eventType(), data.id());
            return;
        }

        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("Paddle event {} referenced unknown userId {}", event.eventType(), userId);
            return;
        }

        var firstItem = data.items() != null && !data.items().isEmpty() ? data.items().getFirst() : null;
        String priceId = firstItem != null ? firstItem.price().id() : null;
        String productId = firstItem != null ? firstItem.price().productId() : null;

        SubscriptionEntity subscription = subscriptionRepository.findById(userId)
                .orElseGet(() -> new SubscriptionEntity(user));

        subscription.setPaddleSubscriptionId(data.id());
        subscription.setPaddleCustomerId(data.customerId());
        subscription.setStatus(data.status());
        subscription.setPriceId(priceId);
        subscription.setProductId(productId);
        subscription.setCancelAt(
                data.scheduledChange() != null && "cancel".equals(data.scheduledChange().action())
                        ? Instant.parse(data.scheduledChange().effectiveAt())
                        : null
        );
        subscription.setUpdatedAt(Instant.now());
        subscriptionRepository.save(subscription);

        user.setTier(ACTIVE_STATUSES.contains(data.status()) ? Tier.PRO : Tier.FREE);
        userRepository.save(user);

        log.info("Synced subscription {} for user {}: status={}, tier={}",
                data.id(), userId, data.status(), user.getTier());
    }

    private void handleSubscriptionCanceled(String rawBody) {
        PaddleWebhookEvent event = parseOrNull(rawBody, PaddleWebhookEvent.class, "subscription cancellation");
        if (event == null) return;

        var data = event.data();
        if (data == null) return;

        Long userId = extractUserId(data.customData());
        if (userId == null) {
            log.warn("subscription.canceled had no custom_data.userId — cannot map to a user");
            return;
        }

        subscriptionRepository.findById(userId).ifPresentOrElse(sub -> {
            sub.setStatus(data.status());
            sub.setUpdatedAt(Instant.now());
            subscriptionRepository.save(sub);
        }, () -> log.warn("subscription.canceled for user {} but no subscription row existed", userId));

        userRepository.findById(userId).ifPresentOrElse(user -> {
            user.setTier(Tier.FREE);
            userRepository.save(user);
            log.info("Subscription canceled for user {} — reverted to FREE", userId);
        }, () -> log.warn("subscription.canceled referenced unknown userId {}", userId));
    }

    private void handleTransactionCompleted(String rawBody) {
        PaddleTransactionEvent event = parseOrNull(rawBody, PaddleTransactionEvent.class, "transaction completed");
        if (event == null) return;

        var data = event.data();
        if (data == null || !"completed".equals(data.status())) return;

        Long userId = extractUserId(data.customData());
        if (userId == null) {
            log.warn("transaction.completed had no custom_data.userId — cannot map to a user");
            return;
        }

        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("transaction.completed referenced unknown userId {}", userId);
            return;
        }

        var firstItem = data.items() != null && !data.items().isEmpty() ? data.items().getFirst() : null;
        String priceId = firstItem != null ? firstItem.price().id() : null;
        String productId = firstItem != null ? firstItem.price().productId() : null;

        SubscriptionEntity subscription = subscriptionRepository.findById(userId)
                .orElseGet(() -> new SubscriptionEntity(user));

        if (subscription.getPaddleSubscriptionId() == null) {
            subscription.setPaddleSubscriptionId(data.subscriptionId());
        }
        subscription.setPaddleCustomerId(data.customerId());
        if (subscription.getStatus() == null) {
            subscription.setStatus("active");
        }
        if (subscription.getPriceId() == null) subscription.setPriceId(priceId);
        if (subscription.getProductId() == null) subscription.setProductId(productId);
        subscription.setUpdatedAt(Instant.now());
        subscriptionRepository.save(subscription);

        if (user.getTier() != Tier.PRO) {
            user.setTier(Tier.PRO);
            userRepository.save(user);
            log.info("Granted PRO to user {} via transaction.completed (subscription {})",
                    userId, data.subscriptionId());
        } else {
            log.debug("transaction.completed for user {} — already PRO, no change", userId);
        }
    }

    private <T> T parseOrNull(String rawBody, Class<T> type, String context) {
        try {
            return OBJECT_MAPPER.readValue(rawBody, type);
        } catch (Exception e) {
            log.error("Failed to parse Paddle {} payload", context, e);
            return null;
        }
    }

    private Long extractUserId(Map<String, String> customData) {
        if (customData == null) return null;
        String raw = customData.get("userId");
        if (raw == null) return null;
        try {
            return Long.valueOf(raw);
        } catch (NumberFormatException e) {
            log.warn("custom_data.userId was not a valid number: {}", raw);
            return null;
        }
    }
}