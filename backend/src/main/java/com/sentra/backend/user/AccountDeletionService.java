package com.sentra.backend.user;

import com.sentra.backend.billing.PaddleApiClient;
import com.sentra.backend.billing.SubscriptionRepository;
import com.sentra.backend.billing.UsageTrackingRepository;
import com.sentra.backend.billing.entity.SubscriptionEntity;
import com.sentra.backend.repo.RepoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountDeletionService {

    private static final List<String> ACTIVE_STATUSES = List.of("active", "trialing");

    private final UserRepository userRepository;
    private final RepoRepository repoRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UsageTrackingRepository usageTrackingRepository;
    private final PaddleApiClient paddleApiClient;

    @Transactional
    public void deleteAccount(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        subscriptionRepository.findById(userId).ifPresent(sub -> {
            if (ACTIVE_STATUSES.contains(sub.getStatus())) {
                cancelPaddleSubscription(sub);
            }
            subscriptionRepository.delete(sub);
        });

        usageTrackingRepository.deleteById(userId);
        repoRepository.deleteAllByUserId(userId);
        userRepository.delete(user);

        log.info("Deleted account for user {}", userId);
    }

    private void cancelPaddleSubscription(SubscriptionEntity sub) {
        try {
            paddleApiClient.cancelSubscription(sub.getPaddleSubscriptionId());
        } catch (Exception e) {
            log.error("Failed to cancel Paddle subscription {} during account deletion for user {} — " +
                            "local records will still be deleted. Manual cancellation in Paddle dashboard required.",
                    sub.getPaddleSubscriptionId(), sub.getUserId(), e);
        }
    }
}