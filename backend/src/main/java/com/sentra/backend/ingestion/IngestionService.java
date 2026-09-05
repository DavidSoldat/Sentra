package com.sentra.backend.ingestion;

import com.sentra.backend.ingestion.dto.IngestionProgress;
import com.sentra.backend.repo.RepoEntity;
import com.sentra.backend.repo.RepoRepository;
import com.sentra.backend.repo.RepoStatus;
import com.sentra.backend.user.UserRepository;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.filter.Filter;
import dev.langchain4j.store.embedding.filter.MetadataFilterBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.zip.GZIPInputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class IngestionService {

    private final RepoRepository repoRepository;
    private final UserRepository userRepository;
    private final GitHubClient gitHubClient;
    private final ChunkingService chunkingService;
    private final EmbeddingModel embeddingModel;
    private final EmbeddingStore<TextSegment> embeddingStore;
    private final RepoSseService repoSseService;

    @Qualifier("fileProcessingExecutor")
    private final Executor fileProcessingExecutor;

    @Value("${sentra.ingestion.repo.max-total-extracted-bytes:52428800}")
    private long maxTotalExtractedBytes;

    @Value("${sentra.ingestion.repo.max-files:500}")
    private int maxFiles;

    private record ExtractedFile(String path, String content) {}

    @Async("ingestionExecutor")
    public void indexRepo(Long repoId) {
        log.info("Starting ingestion for repo id={}", repoId);

        RepoEntity repo = repoRepository.findById(repoId)
                .orElseThrow(() -> new IllegalArgumentException("Repo not found: " + repoId));

        String accessToken = userRepository.findById(repo.getUser().getId())
                .orElseThrow()
                .getGithubAccessToken();

        try {
            markIndexing(repo);

            String[] ownerAndName = parseOwnerAndName(repo.getUrl());
            String owner = ownerAndName[0];
            String repoName = ownerAndName[1];

            byte[] tarball = gitHubClient.downloadTarball(accessToken, owner, repoName);
            List<ExtractedFile> files = extractFiles(tarball);

            log.info("Repo {}/{}: {} indexable files found", owner, repoName, files.size());

            int totalFiles = files.size();
            AtomicInteger processedCount = new AtomicInteger(0);
            AtomicInteger chunksStored = new AtomicInteger(0);

            List<CompletableFuture<Void>> futures = files.stream()
                    .map(file -> CompletableFuture.runAsync(() -> {
                        int stored = processFile(repoId, file.path(), file.content());
                        chunksStored.addAndGet(stored);

                        int processed = processedCount.incrementAndGet();
                        if (processed % 5 == 0 || processed == totalFiles) {
                            repoSseService.publishProgress(repoId, new IngestionProgress(processed, totalFiles));
                        }
                    }, fileProcessingExecutor))
                    .toList();

            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

            log.info("Ingestion complete for repo id={}: {} total chunks stored", repoId, chunksStored.get());
            markReady(repo);

        } catch (Exception e) {
            log.error("Ingestion failed for repo id={}", repoId, e);
            markFailed(repo);
        }
    }

    private List<ExtractedFile> extractFiles(byte[] tarballBytes) {
        List<ExtractedFile> files = new ArrayList<>();
        long totalBytesExtracted = 0;

        try (var gzipIn = new GZIPInputStream(new ByteArrayInputStream(tarballBytes));
             var tarIn = new TarArchiveInputStream(gzipIn)) {

            TarArchiveEntry entry;
            while ((entry = tarIn.getNextEntry()) != null) {
                if (entry.isDirectory()) continue;
                if (entry.getSize() > 200_000) continue;

                if (totalBytesExtracted + entry.getSize() > maxTotalExtractedBytes) {
                    log.warn("Reached max total extraction size ({} bytes) while extracting tarball, stopping early",
                            maxTotalExtractedBytes);
                    break;
                }

                String rawPath = entry.getName();
                int firstSlash = rawPath.indexOf('/');
                String relativePath = firstSlash >= 0 ? rawPath.substring(firstSlash + 1) : rawPath;

                if (relativePath.isBlank() || !GitHubClient.isIndexable(relativePath)) continue;

                byte[] contentBytes = tarIn.readAllBytes();
                String content = new String(contentBytes, StandardCharsets.UTF_8);

                if (content.contains("\0")) {
                    log.debug("Skipping binary file (null bytes): {}", relativePath);
                    continue;
                }

                files.add(new ExtractedFile(relativePath, content));
                totalBytesExtracted += contentBytes.length;

                if (files.size() >= maxFiles) {
                    log.warn("Reached max-files cap ({}) while extracting tarball, stopping early", maxFiles);
                    break;
                }
            }
        } catch (IOException e) {
            throw new IllegalStateException("Failed to extract tarball", e);
        }

        return files;
    }

    private int processFile(Long repoId, String path, String content) {
        List<ChunkingService.CodeChunk> chunks = chunkingService.chunk(path, content);
        if (chunks.isEmpty()) return 0;

        List<TextSegment> segments = chunks.stream()
                .map(c -> {
                    Metadata metadata = new Metadata();
                    metadata.put("file_path", c.filePath());
                    metadata.put("start_line", String.valueOf(c.startLine()));
                    metadata.put("end_line", String.valueOf(c.endLine()));
                    metadata.put("repo_id", String.valueOf(repoId));
                    return TextSegment.from("File: " + c.filePath() + "\n\n" + c.content(), metadata);
                })
                .toList();

        Response<List<Embedding>> response = embeddingModel.embedAll(segments);
        List<Embedding> embeddings = response.content();

        embeddingStore.addAll(embeddings, segments);

        log.debug("Stored {} chunks for {}", chunks.size(), path);
        return chunks.size();
    }

    public void deleteEmbeddingsForRepo(Long repoId) {
        Filter repoFilter = MetadataFilterBuilder
                .metadataKey("repo_id")
                .isEqualTo(String.valueOf(repoId));

        embeddingStore.removeAll(repoFilter);
        log.info("Deleted embeddings for repo id={}", repoId);
    }

    protected void markIndexing(RepoEntity repo) {
        repo.setStatus(RepoStatus.INDEXING);
        repoRepository.save(repo);
    }

    protected void markReady(RepoEntity repo) {
        repo.setStatus(RepoStatus.READY);
        repo.setIndexedAt(java.time.Instant.now());
        repoRepository.save(repo);
        repoSseService.publish(repo.getId(), com.sentra.backend.web.dto.RepoResponse.from(repo));
    }

    protected void markFailed(RepoEntity repo) {
        repo.setStatus(RepoStatus.FAILED);
        repoRepository.save(repo);
        repoSseService.publish(repo.getId(), com.sentra.backend.web.dto.RepoResponse.from(repo));
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