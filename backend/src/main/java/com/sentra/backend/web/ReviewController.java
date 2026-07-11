package com.sentra.backend.web;

import com.sentra.backend.ingestion.GitHubUrlParser;
import com.sentra.backend.orchestrator.OrchestratorService;
import com.sentra.backend.repo.RepoEntity;
import com.sentra.backend.repo.RepoRepository;
import com.sentra.backend.review.entity.AgentResultEntity;
import com.sentra.backend.review.entity.ReviewEntity;
import com.sentra.backend.review.enums.AgentType;
import com.sentra.backend.review.repository.AgentResultRepository;
import com.sentra.backend.review.repository.ReviewRepository;
import com.sentra.backend.web.dto.AgentResultResponse;
import com.sentra.backend.web.dto.ReviewResponse;
import com.sentra.backend.web.dto.SubmitReviewRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final AgentResultRepository agentResultRepository;
    private final RepoRepository repoRepository;
    private final OrchestratorService orchestratorService;

    @PostMapping
    public ResponseEntity<ReviewResponse> submitReview(@AuthenticationPrincipal Long userId, @Valid @RequestBody SubmitReviewRequest request) {
        var parsed = GitHubUrlParser.parsePrUrl(request.prUrl());
        String repoUrl = "https://github.com/%s/%s".formatted(parsed.owner(), parsed.repoName());

        RepoEntity repo = repoRepository.findByUserIdAndUrl(userId, repoUrl)
                .orElseThrow(() -> new IllegalStateException(
                        "Repo %s is not indexed yet. Index it first via POST /api/repos before requesting a PR review."
                                .formatted(repoUrl)));

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
    public ResponseEntity<ReviewResponse> getReview(@PathVariable Long id) {
        return reviewRepository.findById(id)
                .map(review -> ResponseEntity.ok(toResponse(review)))
                .orElse(ResponseEntity.notFound().build());
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
                agentResponses);
    }
}