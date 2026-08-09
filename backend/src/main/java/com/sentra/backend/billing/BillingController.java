package com.sentra.backend.billing;

import com.sentra.backend.billing.entity.SubscriptionEntity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private final SubscriptionRepository subscriptionRepository;
    private final PaddleApiClient paddleApiClient;

    public BillingController(SubscriptionRepository subscriptionRepository, PaddleApiClient paddleApiClient) {
        this.subscriptionRepository = subscriptionRepository;
        this.paddleApiClient = paddleApiClient;
    }

    @GetMapping("/portal")
    public Map<String, String> getPortalUrl(@AuthenticationPrincipal Long userId) {
        SubscriptionEntity subscription = subscriptionRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("No subscription found for user " + userId));

        if (subscription.getPaddleCustomerId() == null) {
            throw new IllegalStateException("Subscription for user " + userId + " has no Paddle customer ID");
        }

        String url = paddleApiClient.createPortalSessionUrl(subscription.getPaddleCustomerId());
        log.info("Generated portal session for user {}", userId);
        return Map.of("url", url);
    }
}