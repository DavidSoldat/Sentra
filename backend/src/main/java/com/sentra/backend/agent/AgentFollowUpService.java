package com.sentra.backend.agent;

import com.sentra.backend.ai.ModelSelectionService;
import com.sentra.backend.billing.UsageEnforcementService;
import com.sentra.backend.ingestion.GitHubClient;
import com.sentra.backend.ingestion.GitHubUrlParser;
import com.sentra.backend.rag.RagService;
import com.sentra.backend.review.entity.AgentResultEntity;
import com.sentra.backend.review.entity.ReviewEntity;
import com.sentra.backend.review.enums.AgentResultStatus;
import com.sentra.backend.review.enums.AgentType;
import com.sentra.backend.review.repository.AgentResultRepository;
import com.sentra.backend.review.repository.ReviewRepository;
import com.sentra.backend.user.UserEntity;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.response.ChatResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AgentFollowUpService {

    private final ReviewRepository reviewRepository;
    private final AgentResultRepository agentResultRepository;
    private final AgentFollowUpMessageRepository followUpMessageRepository;
    private final GitHubClient gitHubClient;
    private final RagService ragService;
    private final ModelSelectionService modelSelectionService;
    private final UsageEnforcementService usageEnforcementService;
    private final Map<AgentType, BaseAgent> agentsByType;

    public AgentFollowUpService(
            ReviewRepository reviewRepository,
            AgentResultRepository agentResultRepository,
            AgentFollowUpMessageRepository followUpMessageRepository,
            GitHubClient gitHubClient,
            RagService ragService,
            ModelSelectionService modelSelectionService,
            UsageEnforcementService usageEnforcementService,
            List<BaseAgent> agents) {
        this.reviewRepository = reviewRepository;
        this.agentResultRepository = agentResultRepository;
        this.followUpMessageRepository = followUpMessageRepository;
        this.gitHubClient = gitHubClient;
        this.ragService = ragService;
        this.modelSelectionService = modelSelectionService;
        this.usageEnforcementService = usageEnforcementService;
        this.agentsByType = agents.stream().collect(Collectors.toMap(BaseAgent::getType, a -> a));
    }

    @Transactional
    public List<AgentFollowUpMessageEntity> askFollowUp(
            Long reviewId, AgentType agentType, Long userId, String question) {

        if (!reviewRepository.existsByIdAndRepoUserId(reviewId, userId)) {
            throw new IllegalArgumentException("Review not found: " + reviewId);
        }

        ReviewEntity review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));

        AgentResultEntity agentResult = agentResultRepository.findByReviewIdAndAgent(reviewId, agentType)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No result for agent " + agentType + " on review " + reviewId));

        if (agentResult.getStatus() != AgentResultStatus.DONE) {
            throw new IllegalStateException("This agent hasn't finished reviewing yet");
        }

        UserEntity user = review.getRepo().getUser();
        usageEnforcementService.checkAndIncrementQuestions(user);

        var resolved = modelSelectionService.resolveModel(user);

        var parsed = GitHubUrlParser.parsePrUrl(review.getPrUrl());
        String diff = gitHubClient.getPullRequestDiff(parsed.owner(), parsed.repoName(), parsed.prNumber());
        String queryText = diff.length() > 2000 ? diff.substring(0, 2000) : diff;
        String codebaseContext = ragService.retrieveContextForReview(review.getRepo().getId(), queryText);

        BaseAgent agent = agentsByType.get(agentType);
        List<ChatMessage> messages = buildMessages(agent, diff, codebaseContext, agentResult, question);

        ChatResponse response = resolved.chatModel().chat(messages);
        String answer = response.aiMessage().text();

        followUpMessageRepository.save(new AgentFollowUpMessageEntity(agentResult, MessageRole.USER, question));
        followUpMessageRepository.save(new AgentFollowUpMessageEntity(agentResult, MessageRole.ASSISTANT, answer));

        log.info("Follow-up answered for review={} agent={} using model={}",
                reviewId, agentType, resolved.model());

        return followUpMessageRepository.findByAgentResultIdOrderByCreatedAtAsc(agentResult.getId());
    }

    @Transactional(readOnly = true)
    public List<AgentFollowUpMessageEntity> getHistory(Long reviewId, AgentType agentType, Long userId) {
        if (!reviewRepository.existsByIdAndRepoUserId(reviewId, userId)) {
            throw new IllegalArgumentException("Review not found: " + reviewId);
        }

        AgentResultEntity agentResult = agentResultRepository.findByReviewIdAndAgent(reviewId, agentType)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No result for agent " + agentType + " on review " + reviewId));

        return followUpMessageRepository.findByAgentResultIdOrderByCreatedAtAsc(agentResult.getId());
    }

    private List<ChatMessage> buildMessages(
            BaseAgent agent, String diff, String codebaseContext,
            AgentResultEntity agentResult, String question) {

        StringBuilder systemPrompt = new StringBuilder();
        systemPrompt.append(agent.getSystemPrompt()).append("\n\n");

        if (codebaseContext != null && !codebaseContext.isBlank()) {
            systemPrompt.append("--- RELEVANT EXISTING CODE ---\n")
                    .append(codebaseContext).append("\n\n");
        }

        systemPrompt.append("--- PULL REQUEST DIFF ---\n").append(diff).append("\n\n");
        systemPrompt.append("""
                You already reviewed this pull request. The user now has follow-up
                questions about your findings. Answer conversationally and refer back
                to specific parts of the diff or your original findings where relevant.
                """);

        List<ChatMessage> messages = new ArrayList<>();
        messages.add(SystemMessage.from(systemPrompt.toString()));
        messages.add(UserMessage.from("Please review this pull request."));
        messages.add(AiMessage.from(agentResult.getFindings()));

        List<AgentFollowUpMessageEntity> prior =
                followUpMessageRepository.findByAgentResultIdOrderByCreatedAtAsc(agentResult.getId());
        for (AgentFollowUpMessageEntity m : prior) {
            messages.add(m.getRole() == MessageRole.USER
                    ? UserMessage.from(m.getContent())
                    : AiMessage.from(m.getContent()));
        }

        messages.add(UserMessage.from(question));
        return messages;
    }
}