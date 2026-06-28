package com.sentra.backend.ingestion;

import com.sentra.backend.ingestion.dto.TreeItem;
import com.sentra.backend.repo.RepoEntity;
import com.sentra.backend.repo.RepoRepository;
import com.sentra.backend.repo.RepoStatus;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.store.embedding.EmbeddingStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class IngestionService {

    private final RepoRepository repoRepository;
    private final GitHubClient gitHubClient;
    private final ChunkingService chunkingService;
    private final EmbeddingModel embeddingModel;
    private final EmbeddingStore<TextSegment> embeddingStore;

    @Value("${sentra.ingestion.repo.max-files:500}")
    private int maxFiles;

    @Async("ingestionExecutor")
    public void indexRepo(Long repoId) {
        log.info("Starting ingestion for repo id={}", repoId);

        RepoEntity repo = repoRepository.findById(repoId)
                .orElseThrow(() -> new IllegalArgumentException("Repo not found: " + repoId));

        try {
            markIndexing(repo);

            String[] ownerAndName = parseOwnerAndName(repo.getUrl());
            String owner = ownerAndName[0];
            String repoName = ownerAndName[1];

            List<TreeItem> files = gitHubClient.getIndexableFiles(owner, repoName);
            log.info("Repo {}/{}: {} indexable files found", owner, repoName, files.size());


            if (files.size() > maxFiles) {
                log.warn("Capping {} → {} files for repo {}/{}", files.size(), maxFiles, owner, repoName);
                files = files.subList(0, maxFiles);
            }

            int chunksStored = 0;
            for (TreeItem file : files) {
                chunksStored += processFile(repoId, owner, repoName, file);
            }

            log.info("Ingestion complete for repo id={}: {} total chunks stored", repoId, chunksStored);
            markReady(repo);

        } catch (Exception e) {
            log.error("Ingestion failed for repo id={}", repoId, e);
            markFailed(repo);
        }
    }

    private int processFile(Long repoId, String owner, String repoName, TreeItem file) {
        String path = file.path();

        return gitHubClient.getFileContent(owner, repoName, path)
                .map(content -> {
                    if (content.contains("\0")) {
                        log.debug("Skipping binary file (null bytes): {}", path);
                        return 0;
                    }

                    List<ChunkingService.CodeChunk> chunks = chunkingService.chunk(path, content);
                    if (chunks.isEmpty()) return 0;

                    List<TextSegment> segments = chunks.stream()
                            .map(c -> {
                                Metadata metadata = new Metadata();
                                metadata.put("file_path", c.filePath());
                                metadata.put("start_line", String.valueOf(c.startLine()));
                                metadata.put("end_line", String.valueOf(c.endLine()));
                                metadata.put("repo_id", String.valueOf(repoId));
                                return TextSegment.from(c.content(), metadata);
                            })
                            .toList();

                    Response<List<Embedding>> response = embeddingModel.embedAll(segments);
                    List<Embedding> embeddings = response.content();

                    embeddingStore.addAll(embeddings, segments);

                    log.debug("Stored {} chunks for {}", chunks.size(), path);
                    return chunks.size();
                })
                .orElse(0);
    }

    protected void markIndexing(RepoEntity repo) {
        repo.setStatus(RepoStatus.INDEXING);
        repoRepository.save(repo);
    }

    protected void markReady(RepoEntity repo) {
        repo.setStatus(RepoStatus.READY);
        repo.setIndexedAt(Instant.now());
        repoRepository.save(repo);
    }

    protected void markFailed(RepoEntity repo) {
        repo.setStatus(RepoStatus.FAILED);
        repoRepository.save(repo);
    }

    private String[] parseOwnerAndName(String url) {
        String cleaned = url.strip().replaceAll("/$", "").replaceAll("\\.git$", "");
        String[] parts = cleaned.split("/");
        if (parts.length < 2) {
            throw new IllegalArgumentException("Can't parse owner/name from URL: " + url);
        }
        return new String[]{parts[parts.length - 2], parts[parts.length - 1]};
    }
}