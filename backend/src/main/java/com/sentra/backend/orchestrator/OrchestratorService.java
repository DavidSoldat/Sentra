package com.sentra.backend.orchestrator;

import com.sentra.backend.agent.*;
import com.sentra.backend.ai.ModelSelectionService;
import com.sentra.backend.ingestion.GitHubClient;
import com.sentra.backend.ingestion.GitHubUrlParser;
import com.sentra.backend.ingestion.dto.PullRequestInfo;
import com.sentra.backend.rag.RagService;
import com.sentra.backend.review.ReviewSseService;
import com.sentra.backend.review.entity.AgentResultEntity;
import com.sentra.backend.review.entity.ReviewEntity;
import com.sentra.backend.review.enums.AgentResultStatus;
import com.sentra.backend.review.enums.ReviewStatus;
import com.sentra.backend.review.repository.AgentResultRepository;
import com.sentra.backend.review.repository.ReviewRepository;
import com.sentra.backend.user.UserEntity;
import com.sentra.backend.user.UserRepository;
import com.sentra.backend.web.dto.AgentResultResponse;
import com.sentra.backend.web.dto.ReviewStatusUpdate;
import dev.langchain4j.model.chat.ChatModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrchestratorService {

    private final ReviewRepository reviewRepository;
    private final AgentResultRepository agentResultRepository;
    private final GitHubClient gitHubClient;
    private final RagService ragService;
    private final ReviewSseService reviewSseService;
    private final UserRepository userRepository;
    private final ModelSelectionService modelSelectionService;

    private final SecurityAgent securityAgent;
    private final ArchitectureAgent architectureAgent;
    private final PerformanceAgent performanceAgent;
    private final DocsAgent docsAgent;


    @Async("ingestionExecutor")
    public void runReview(Long reviewId) {
        log.info("Starting multi-agent review for reviewId={}", reviewId);

        ReviewEntity review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));

        try {
            markReviewRunning(review);

            var parsed = GitHubUrlParser.parsePrUrl(review.getPrUrl());

            String accessToken = userRepository.findById(
                    reviewRepository.findOwnerIdByReviewId(reviewId)).orElseThrow().getGithubAccessToken();


            PullRequestInfo info = gitHubClient.getPullRequestInfo(
                    accessToken, parsed.owner(), parsed.repoName(), parsed.prNumber());
            review.setPrTitle(info.title());
            reviewRepository.save(review);

            String diff = gitHubClient.getPullRequestDiff(
                    accessToken, parsed.owner(), parsed.repoName(), parsed.prNumber());

            log.info("Fetched diff for review {}: {} chars", reviewId, diff.length());

            String codebaseContext = fetchCodebaseContext(review, diff);

            UserEntity owner = userRepository.findById(reviewRepository.findOwnerIdByReviewId(reviewId))
                    .orElseThrow(() -> new IllegalStateException("Owner not found for review " + reviewId));
            ChatModel model = modelSelectionService.resolveModel(owner).chatModel();

            List<AgentResultEntity> agentRows = agentResultRepository.findByReviewId(reviewId);

            CompletableFuture<Void> securityFuture =
                    runAgent(securityAgent, diff, codebaseContext, findRow(agentRows, securityAgent.getType()), model);
            CompletableFuture<Void> architectureFuture =
                    runAgent(architectureAgent, diff, codebaseContext, findRow(agentRows, architectureAgent.getType()), model);
            CompletableFuture<Void> performanceFuture =
                    runAgent(performanceAgent, diff, codebaseContext, findRow(agentRows, performanceAgent.getType()), model);
            CompletableFuture<Void> docsFuture =
                    runAgent(docsAgent, diff, codebaseContext, findRow(agentRows, docsAgent.getType()), model);


            CompletableFuture.allOf(
                    securityFuture, architectureFuture, performanceFuture, docsFuture
            ).join();

            markReviewCompleted(review);
            log.info("Review {} completed: all 4 agents finished", reviewId);

        } catch (Exception e) {
            log.error("Review {} failed", reviewId, e);
            markReviewFailed(review);
        }
    }

    private CompletableFuture<Void> runAgent(
            BaseAgent agent, String diff, String codebaseContext, AgentResultEntity row, ChatModel model) {

        return CompletableFuture.runAsync(() -> {
            try {
                markAgentRunning(row);

                AgentResult result = agent.review(diff, codebaseContext, model);

                markAgentDone(row, result);

            } catch (Exception e) {
                log.error("{} agent failed for review {}", agent.getType(), row.getReview().getId(), e);
                markAgentFailed(row);
            }
        });
    }


    private String fetchCodebaseContext(ReviewEntity review, String diff) {
        try {
            String queryText = diff.length() > 2000 ? diff.substring(0, 2000) : diff;

            return ragService.retrieveContextForReview(review.getRepo().getId(), queryText);
        } catch (Exception e) {
            log.warn("Could not retrieve codebase context for review {}, proceeding with diff only",
                    review.getId(), e);
            return "";
        }
    }

    private AgentResultEntity findRow(List<AgentResultEntity> rows, com.sentra.backend.review.enums.AgentType type) {
        return rows.stream()
                .filter(r -> r.getAgent() == type)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No AgentResultEntity row for type " + type));
    }


    private void markReviewRunning(ReviewEntity review) {
        review.setStatus(ReviewStatus.RUNNING);
        reviewRepository.save(review);
        reviewSseService.publishReviewStatus(review.getId(),
                new ReviewStatusUpdate(review.getStatus().name(), null));
    }

    private void markReviewCompleted(ReviewEntity review) {
        review.setStatus(ReviewStatus.COMPLETED);
        review.setCompletedAt(Instant.now());
        reviewRepository.save(review);
        reviewSseService.publishReviewStatus(review.getId(), new ReviewStatusUpdate(review.getStatus().name(), review.getCompletedAt()));
    }

    private void markReviewFailed(ReviewEntity review) {
        review.setStatus(ReviewStatus.FAILED);
        reviewRepository.save(review);
        reviewSseService.publishReviewStatus(review.getId(),
                new ReviewStatusUpdate(review.getStatus().name(), null));
    }

    private void markAgentRunning(AgentResultEntity row) {
        row.setStatus(AgentResultStatus.RUNNING);
        agentResultRepository.save(row);
        reviewSseService.publishAgentUpdate(row.getReview().getId(), toAgentResponse(row));
    }

    private void markAgentDone(AgentResultEntity row, AgentResult result) {
        row.setStatus(AgentResultStatus.DONE);
        row.setFindings(result.findings());
        row.setSeverity(result.severity());
        row.setCompletedAt(Instant.now());
        agentResultRepository.save(row);
        reviewSseService.publishAgentUpdate(row.getReview().getId(), toAgentResponse(row));
    }

    private void markAgentFailed(AgentResultEntity row) {
        row.setStatus(AgentResultStatus.FAILED);
        row.setCompletedAt(Instant.now());
        agentResultRepository.save(row);
        reviewSseService.publishAgentUpdate(row.getReview().getId(), toAgentResponse(row));
    }

    private AgentResultResponse toAgentResponse(AgentResultEntity row) {
        return new AgentResultResponse(
                row.getAgent().name(),
                row.getStatus().name(),
                row.getFindings(),
                row.getSeverity() != null ? row.getSeverity().name() : null,
                row.getCompletedAt());
    }
}