package com.sentra.backend.web;

import com.sentra.backend.review.entity.AgentResultEntity;
import com.sentra.backend.review.entity.ReviewEntity;
import com.sentra.backend.review.enums.AgentResultStatus;
import com.sentra.backend.review.enums.SeverityStatus;
import com.sentra.backend.review.repository.AgentResultRepository;
import com.sentra.backend.review.repository.ReviewRepository;
import com.sentra.backend.user.UserEntity;
import com.sentra.backend.user.UserRepository;
import com.sentra.backend.web.dto.ActivityFeedResponse;
import com.sentra.backend.web.dto.ActivityItemResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/activity")
@RequiredArgsConstructor
public class ActivityController {

    private static final List<SeverityStatus> SEVERITY_ORDER =
            List.of(SeverityStatus.HIGH, SeverityStatus.MEDIUM, SeverityStatus.LOW);
    private static final int FEED_LIMIT = 50;

    private final ReviewRepository reviewRepository;
    private final AgentResultRepository agentResultRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ActivityFeedResponse> getActivity(@AuthenticationPrincipal Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        List<ReviewEntity> reviews = reviewRepository.findRecentByUserId(
                userId, PageRequest.of(0, FEED_LIMIT));

        List<ActivityItemResponse> items = reviews.stream()
                .map(r -> new ActivityItemResponse(
                        r.getId(),
                        r.getRepo().getId(),
                        r.getRepo().getName(),
                        r.getPrTitle(),
                        r.getPrNumber(),
                        r.getPrUrl(),
                        r.getStatus().name(),
                        resolveSeverity(r.getId()),
                        r.getCreatedAt(),
                        r.getCompletedAt()))
                .toList();

        return ResponseEntity.ok(new ActivityFeedResponse(user.getActivityFeedLastViewedAt(), items));
    }

    @PostMapping("/mark-seen")
    public ResponseEntity<Void> markSeen(@AuthenticationPrincipal Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        user.setActivityFeedLastViewedAt(Instant.now());
        userRepository.save(user);

        return ResponseEntity.noContent().build();
    }

    private String resolveSeverity(Long reviewId) {
        List<AgentResultEntity> results = agentResultRepository.findByReviewId(reviewId);

        return SEVERITY_ORDER.stream()
                .filter(level -> results.stream().anyMatch(r ->
                        r.getStatus() == AgentResultStatus.DONE && r.getSeverity() == level))
                .findFirst()
                .map(SeverityStatus::name)
                .orElse(null);
    }
}