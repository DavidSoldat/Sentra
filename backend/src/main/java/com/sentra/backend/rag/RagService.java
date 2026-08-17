package com.sentra.backend.rag;

import com.sentra.backend.ai.ModelSelectionService;
import com.sentra.backend.billing.UsageEnforcementService;
import com.sentra.backend.repo.RepoEntity;
import com.sentra.backend.repo.RepoRepository;
import com.sentra.backend.repo.RepoStatus;
import com.sentra.backend.web.dto.AskResponse;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.anthropic.AnthropicChatModel;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.rag.content.Content;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.filter.Filter;
import dev.langchain4j.store.embedding.filter.MetadataFilterBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RagService {

    private final RepoRepository repoRepository;
    private final QuestionRepository questionRepository;
    private final ModelSelectionService modelSelectionService;
    private final EmbeddingStore<TextSegment> embeddingStore;
    private final EmbeddingModel embeddingModel;
    private final UsageEnforcementService usageEnforcementService;

    @Value("${sentra.rag.top-k}")
    private int topK;

    @Transactional
    public AskResponse ask(Long repoId, Long userId, String question) {
        RepoEntity repo = repoRepository.findById(repoId)
                .filter(r -> r.getUser().getId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("Repo not found: " + repoId));

        if (repo.getStatus() != RepoStatus.READY) {
            throw new IllegalStateException(
                    "Repo %d is not ready for querying (status: %s)".formatted(repoId, repo.getStatus()));
        }

        usageEnforcementService.checkAndIncrementQuestions(repo.getUser());

        ModelSelectionService.ResolvedModel resolved = modelSelectionService.resolveModel(repo.getUser());

        List<Content> repoContents = retrieveForRepo(repoId, question);

        log.debug("Retrieved {} chunks for repo={}", repoContents.size(), repoId);

        String prompt = buildPrompt(question, repoContents);
        String answer = resolved.chatModel().chat(prompt);

        List<String> sources = repoContents.stream()
                .map(c -> c.textSegment().metadata().getString("file_path"))
                .filter(path -> path != null && !path.isBlank())
                .distinct()
                .sorted()
                .toList();

        QuestionEntity saved = questionRepository.save(new QuestionEntity(repo, question, answer));
        log.info("Q&A saved: questionId={}, repoId={}, sources={}", saved.getId(), repoId, sources);

        return new AskResponse(answer, sources, resolved.model().getDisplayName());
    }

    private String buildPrompt(String question, List<Content> contents) {
        StringBuilder sb = new StringBuilder();

        sb.append("""
                You are a codebase assistant. Answer questions about the code below accurately and concisely.
                If the answer is not evident from the provided code context, say so — do not guess.
                When referencing specific code, cite the file path and approximate line numbers.
                """);

        if (contents.isEmpty()) {
            sb.append("""
                This repository has already been indexed and searched automatically for this question.
                No code relevant to it was found, which most likely means the codebase does not
                contain anything related to this topic. State that plainly and directly —
                do not ask the user to paste or share code, since you already have full access
                to search it yourself.
                """);
        } else {
            sb.append("--- CODE CONTEXT ---\n");
            for (Content content : contents) {
                TextSegment seg = content.textSegment();
                String filePath  = seg.metadata().getString("file_path");
                String startLine = seg.metadata().getString("start_line");
                String endLine   = seg.metadata().getString("end_line");

                sb.append("### ").append(filePath)
                        .append(" (lines ").append(startLine).append("–").append(endLine).append(")\n");
                sb.append(seg.text()).append("\n\n");
            }
            sb.append("--- END CONTEXT ---\n\n");
        }

        sb.append("Question: ").append(question);

        return sb.toString();
    }

    public String retrieveContextForReview(Long repoId, String queryText) {
        List<Content> repoContents = retrieveForRepo(repoId, queryText);

        if (repoContents.isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        for (Content content : repoContents) {
            TextSegment seg = content.textSegment();
            String filePath = seg.metadata().getString("file_path");
            sb.append("### ").append(filePath).append("\n");
            sb.append(seg.text()).append("\n\n");
        }

        return sb.toString();
    }

    private List<Content> retrieveForRepo(Long repoId, String question) {
        Embedding queryEmbedding = embeddingModel.embed(question).content();

        Filter repoFilter = MetadataFilterBuilder
                .metadataKey("repo_id")
                .isEqualTo(String.valueOf(repoId));

        EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .maxResults(topK)
                .minScore(0.3)
                .filter(repoFilter)
                .build();

        EmbeddingSearchResult<TextSegment> result = embeddingStore.search(request);

        return result.matches().stream()
                .map(match -> Content.from(match.embedded()))
                .toList();
    }

    public List<QuestionHistoryItem> getHistory(Long repoId, Long userId) {
        repoRepository.findById(repoId)
                .filter(r -> r.getUser().getId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("Repo not found: " + repoId));

        return questionRepository.findByRepoIdOrderByCreatedAtAsc(repoId).stream()
                .map(q -> new QuestionHistoryItem(q.getId(), q.getQuestion(), q.getAnswer(), q.getCreatedAt()))
                .toList();
    }


    public record QuestionHistoryItem(Long id, String question, String answer, Instant createdAt) {}
}