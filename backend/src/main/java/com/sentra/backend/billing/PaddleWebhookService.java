package com.sentra.backend.billing;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentra.backend.billing.dto.PaddleWebhookEvent;
import com.sentra.backend.user.UserEntity;
import com.sentra.backend.user.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Set;

@Slf4j
@Service
public class PaddleWebhookService {

    private static final Set<String> ACTIVE_STATUSES = Set.of("active", "trialing");
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();


    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;

    public PaddleWebhookService(
            UserRepository userRepository,
            SubscriptionRepository subscriptionRepository) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    @Transactional
    public void process(String rawBody) {
        PaddleWebhookEvent event;
        try {
            event = OBJECT_MAPPER.readValue(rawBody, PaddleWebhookEvent.class);
        } catch (Exception e) {
            log.error("Failed to parse Paddle webhook payload", e);
            return;
        }

        switch (event.eventType()) {
            case "subscription.created", "subscription.updated" -> handleSubscriptionUpsert(event);
            case "subscription.canceled" -> handleSubscriptionCanceled(event);
            default -> log.debug("Ignoring unhandled Paddle event type: {}", event.eventType());
        }
    }

    private void handleSubscriptionUpsert(PaddleWebhookEvent event) {
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

        var firstItem = data.items() != null && !data.items().isEmpty() ? data.items().get(0) : null;
        String priceId = firstItem != null ? firstItem.price().id() : null;
        String productId = firstItem != null ? firstItem.price().productId() : null;

        SubscriptionEntity subscription = subscriptionRepository.findById(userId)
                .orElseGet(() -> new SubscriptionEntity(user));

        subscription.setPaddleSubscriptionId(data.id());
        subscription.setPaddleCustomerId(data.customerId());
        subscription.setStatus(data.status());
        subscription.setPriceId(priceId);
        subscription.setProductId(productId);
        subscription.setUpdatedAt(Instant.now());
        subscriptionRepository.save(subscription);

        user.setTier(ACTIVE_STATUSES.contains(data.status()) ? Tier.PRO : Tier.FREE);
        userRepository.save(user);

        log.info("Synced subscription {} for user {}: status={}, tier={}",
                data.id(), userId, data.status(), user.getTier());
    }

    private void handleSubscriptionCanceled(PaddleWebhookEvent event) {
        var data = event.data();
        if (data == null) return;

        Long userId = extractUserId(data.customData());
        if (userId == null) return;

        subscriptionRepository.findById(userId).ifPresent(sub -> {
            sub.setStatus(data.status());
            sub.setUpdatedAt(Instant.now());
            subscriptionRepository.save(sub);
        });

        userRepository.findById(userId).ifPresent(user -> {
            user.setTier(Tier.FREE);
            userRepository.save(user);
            log.info("Subscription canceled for user {} — reverted to FREE", userId);
        });
    }

    private Long extractUserId(java.util.Map<String, String> customData) {
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