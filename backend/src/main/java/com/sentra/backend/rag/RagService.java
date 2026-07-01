package com.sentra.backend.rag;

import com.sentra.backend.repo.RepoEntity;
import com.sentra.backend.repo.RepoRepository;
import com.sentra.backend.repo.RepoStatus;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.anthropic.AnthropicChatModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.rag.content.Content;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.rag.query.Query;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RagService {

    private final RepoRepository repoRepository;
    private final QuestionRepository questionRepository;
    private final EmbeddingStoreContentRetriever contentRetriever;
    private final AnthropicChatModel chatModel;


    @Transactional
    public AskResponse ask(Long repoId, String question) {
        RepoEntity repo = repoRepository.findById(repoId)
                .orElseThrow(() -> new IllegalArgumentException("Repo not found: " + repoId));

        if (repo.getStatus() != RepoStatus.READY) {
            throw new IllegalStateException(
                    "Repo %d is not ready for querying (status: %s)".formatted(repoId, repo.getStatus()));
        }

        List<Content> allContents = contentRetriever.retrieve(Query.from(question));

        if (!allContents.isEmpty()) {
            var meta = allContents.getFirst().textSegment().metadata();
            log.info("First chunk metadata: {}", meta.toMap());
        }

        log.info("Total retrieved: {}, repo_id values: {}",
                allContents.size(),
                allContents.stream()
                        .map(c -> c.textSegment().metadata().getString("repo_id"))
                        .toList());

        List<Content> repoContents = allContents.stream()
                .filter(c -> String.valueOf(repoId).equals(
                        c.textSegment().metadata().getString("repo_id")))
                .toList();

        log.debug("After repo filter: {}", repoContents.size());

        log.debug("Retrieved {} chunks for repo={} (filtered from {})",
                repoContents.size(), repoId, allContents.size());

        String prompt = buildPrompt(question, repoContents);

        String answer = chatModel.chat(prompt);

        List<String> sources = repoContents.stream()
                .map(c -> c.textSegment().metadata().getString("file_path"))
                .filter(path -> path != null && !path.isBlank())
                .distinct()
                .sorted()
                .toList();

        QuestionEntity saved = questionRepository.save(
                new QuestionEntity(repo, question, answer));

        log.info("Q&A saved: questionId={}, repoId={}, sources={}", saved.getId(), repoId, sources);

        return new AskResponse(answer, sources);
    }

    private String buildPrompt(String question, List<Content> contents) {
        StringBuilder sb = new StringBuilder();

        sb.append("""
                You are a codebase assistant. Answer questions about the code below accurately and concisely.
                If the answer is not evident from the provided code context, say so — do not guess.
                When referencing specific code, cite the file path and approximate line numbers.
                """);

        if (contents.isEmpty()) {
            sb.append("No relevant code context was found for this question.\n\n");
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
        List<Content> allContents = contentRetriever.retrieve(Query.from(queryText));

        List<Content> repoContents = allContents.stream()
                .filter(c -> String.valueOf(repoId).equals(
                        c.textSegment().metadata().getString("repo_id")))
                .toList();

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

    public record AskResponse(String answer, List<String> sources) {}
}