package com.sentra.backend.web;

import com.sentra.backend.billing.UsageEnforcementService;
import com.sentra.backend.ingestion.GitHubClient;
import com.sentra.backend.ingestion.GitHubUrlParser;
import com.sentra.backend.orchestrator.OrchestratorService;
import com.sentra.backend.repo.RepoEntity;
import com.sentra.backend.repo.RepoRepository;
import com.sentra.backend.review.PrivateRepoShareConfirmationRequiredException;
import com.sentra.backend.review.ReviewSseService;
import com.sentra.backend.review.entity.AgentResultEntity;
import com.sentra.backend.review.entity.ReviewEntity;
import com.sentra.backend.review.enums.AgentResultStatus;
import com.sentra.backend.review.enums.AgentType;
import com.sentra.backend.review.enums.ReviewStatus;
import com.sentra.backend.review.repository.AgentResultRepository;
import com.sentra.backend.review.repository.ReviewRepository;
import com.sentra.backend.user.UserEntity;
import com.sentra.backend.user.UserRepository;
import com.sentra.backend.web.dto.AgentResultResponse;
import com.sentra.backend.web.dto.ReviewResponse;
import com.sentra.backend.web.dto.ReviewStatusUpdate;
import com.sentra.backend.web.dto.SubmitReviewRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final AgentResultRepository agentResultRepository;
    private final RepoRepository repoRepository;
    private final OrchestratorService orchestratorService;
    private final UsageEnforcementService usageEnforcementService;
    private final UserRepository userRepository;
    private final ReviewSseService reviewSseService;
    private final GitHubClient gitHubClient;

    @PostMapping
    public ResponseEntity<ReviewResponse> submitReview(@AuthenticationPrincipal Long userId, @Valid @RequestBody SubmitReviewRequest request) {
        var parsed = GitHubUrlParser.parsePrUrl(request.prUrl());
        String repoUrl = "https://github.com/%s/%s".formatted(parsed.owner(), parsed.repoName());

        RepoEntity repo = repoRepository.findByUserIdAndUrl(userId, repoUrl)
                .orElseThrow(() -> new IllegalStateException(
                        "Repo %s is not indexed yet. Index it first via POST /api/repos before requesting a PR review."
                                .formatted(repoUrl)));

        Optional<ReviewEntity> existing = reviewRepository
                .findFirstByRepoIdAndPrNumberOrderByCreatedAtDesc(repo.getId(), parsed.prNumber());

        if (existing.isPresent() && existing.get().getStatus() != ReviewStatus.FAILED) {
            return ResponseEntity.ok(toResponse(existing.get()));
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        usageEnforcementService.checkAndIncrementReviews(user);

        ReviewEntity review = reviewRepository.save(
                new ReviewEntity(repo, request.prUrl(), parsed.prNumber(), null));

        for (AgentType type : AgentType.values()) {
            agentResultRepository.save(new AgentResultEntity(review, type));
        }

        reviewRepository.flush();
        agentResultRepository.flush();

        orchestratorService.runReview(review.getId());

        return ResponseEntity.accepted().body(toResponse(review));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReviewResponse> getReview(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {

        if (!reviewRepository.existsByIdAndRepoUserId(id, userId)) {
            return ResponseEntity.notFound().build();
        }

        return reviewRepository.findById(id)
                .map(review -> ResponseEntity.ok(toResponse(review)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping(value = "/{id}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamReview(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {

        if (!reviewRepository.existsByIdAndRepoUserId(id, userId)) {
            throw new IllegalArgumentException("Review not found: " + id);
        }

        ReviewEntity review = reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + id));

        SseEmitter emitter = reviewSseService.subscribe(id);

        if (review.getStatus() == ReviewStatus.COMPLETED || review.getStatus() == ReviewStatus.FAILED) {
            reviewSseService.publishReviewStatus(id,
                    new ReviewStatusUpdate(review.getStatus().name(), review.getCompletedAt()));
        }

        return emitter;
    }

    @PostMapping("/{id}/post-to-github")
    public ResponseEntity<ReviewResponse> postToGithub(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {

        if (!reviewRepository.existsByIdAndRepoUserId(id, userId)) {
            throw new IllegalArgumentException("Review not found: " + id);
        }

        ReviewEntity review = reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + id));

        if (review.getStatus() != ReviewStatus.COMPLETED) {
            throw new IllegalStateException("Review must be completed before posting to GitHub");
        }

        if (review.getGithubCommentUrl() != null) {
            return ResponseEntity.ok(toResponse(review));
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        var parsed = GitHubUrlParser.parsePrUrl(review.getPrUrl());
        String body = buildReviewCommentBody(review);

        String commentUrl = gitHubClient.postReviewComment(
                user.getGithubAccessToken(), parsed.owner(), parsed.repoName(), parsed.prNumber(), body);

        review.setGithubCommentUrl(commentUrl);
        review.setPostedToGithubAt(Instant.now());
        reviewRepository.save(review);

        return ResponseEntity.ok(toResponse(review));
    }

    @PostMapping("/{id}/agents/{agentType}/retry")
    public ResponseEntity<ReviewResponse> retryAgent(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @PathVariable AgentType agentType) {

        if (!reviewRepository.existsByIdAndRepoUserId(id, userId)) {
            throw new IllegalArgumentException("Review not found: " + id);
        }

        AgentResultEntity row = agentResultRepository.findByReviewIdAndAgent(id, agentType)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No result for agent " + agentType + " on review " + id));

        if (row.getStatus() != AgentResultStatus.FAILED) {
            throw new IllegalStateException(
                    "Only a failed agent can be retried (current status: " + row.getStatus() + ")");
        }

        orchestratorService.retryAgent(id, agentType);

        ReviewEntity review = reviewRepository.findById(id).orElseThrow();
        return ResponseEntity.accepted().body(toResponse(review));
    }

    private String buildReviewCommentBody(ReviewEntity review) {
        List<AgentResultEntity> results = agentResultRepository.findByReviewId(review.getId());
        Map<AgentType, String> emoji = Map.of(
                AgentType.SECURITY, "🔒", AgentType.ARCHITECTURE, "🏗️",
                AgentType.PERFORMANCE, "⚡", AgentType.DOCS, "📝");

        StringBuilder sb = new StringBuilder("## 🤖 Sentra AI Review\n\n");
        for (AgentResultEntity r : results) {
            sb.append("### ").append(emoji.get(r.getAgent())).append(" ")
                    .append(r.getAgent().name().charAt(0)).append(r.getAgent().name().substring(1).toLowerCase())
                    .append("\n\n");

            if (r.getStatus() == AgentResultStatus.DONE) {
                sb.append(r.getFindings() != null ? r.getFindings() : "No findings — clean pass.");
            } else {
                sb.append("_This agent didn't complete successfully._");
            }
            sb.append("\n\n");
        }
        sb.append("---\n*Reviewed by [Sentra](https://github.com/DavidSoldat/Sentra)*");
        return sb.toString();
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<ReviewResponse> shareReview(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean confirm) {

        if (!reviewRepository.existsByIdAndRepoUserId(id, userId)) {
            throw new IllegalArgumentException("Review not found: " + id);
        }

        ReviewEntity review = reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + id));

        if (review.getStatus() != ReviewStatus.COMPLETED) {
            throw new IllegalStateException("Review must be completed before it can be shared");
        }

        if (review.getShareToken() == null) {
            if (!confirm) {
                UserEntity user = userRepository.findById(userId)
                        .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
                var parsed = GitHubUrlParser.parsePrUrl(review.getPrUrl());
                var repoInfo = gitHubClient.getRepoInfo(
                        user.getGithubAccessToken(), parsed.owner(), parsed.repoName());

                if (repoInfo.isPrivate()) {
                    throw new PrivateRepoShareConfirmationRequiredException();
                }
            }
            review.setShareToken(UUID.randomUUID().toString());
            reviewRepository.save(review);
        }

        return ResponseEntity.ok(toResponse(review));
    }

    @DeleteMapping("/{id}/share")
    public ResponseEntity<Void> unshareReview(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {

        if (!reviewRepository.existsByIdAndRepoUserId(id, userId)) {
            throw new IllegalArgumentException("Review not found: " + id);
        }

        ReviewEntity review = reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + id));

        review.setShareToken(null);
        reviewRepository.save(review);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<String> exportReview(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {

        if (!reviewRepository.existsByIdAndRepoUserId(id, userId)) {
            throw new IllegalArgumentException("Review not found: " + id);
        }

        ReviewEntity review = reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + id));

        String markdown = buildReviewCommentBody(review);
        String filename = "sentra-review-%d.md".formatted(review.getId());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/markdown"))
                .body(markdown);
    }

    private ReviewResponse toResponse(ReviewEntity review) {
        List<AgentResultEntity> results = agentResultRepository.findByReviewId(review.getId());

        List<AgentResultResponse> agentResponses = results.stream()
                .map(r -> new AgentResultResponse(
                        r.getAgent().name(),
                        r.getStatus().name(),
                        r.getFindings(),
                        r.getSeverity() != null ? r.getSeverity().name() : null,
                        r.getCompletedAt()))
                .toList();

        return new ReviewResponse(
                review.getId(),
                review.getPrUrl(),
                review.getPrTitle(),
                review.getPrNumber(),
                review.getStatus().name(),
                review.getCreatedAt(),
                review.getCompletedAt(),
                review.getGithubCommentUrl(),
                review.getShareToken(),
                agentResponses);
    }
}