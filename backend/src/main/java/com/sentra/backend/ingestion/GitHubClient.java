package com.sentra.backend.ingestion;

import com.sentra.backend.ingestion.dto.ContentResponse;
import com.sentra.backend.ingestion.dto.TreeItem;
import com.sentra.backend.ingestion.dto.TreeResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
public class GitHubClient {

    private static final String BASE_URL = "https://api.github.com";

    private static final List<String> SKIP_EXTENSIONS = List.of(
            ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".avif", ".bmp", ".tiff",
            ".pdf", ".zip", ".jar", ".class", ".war", ".tar", ".gz", ".7z",
            ".lock", ".sum",
            ".woff", ".woff2", ".ttf", ".eot",
            ".mp4", ".mp3", ".wav", ".ogg"
    );
    private static final List<String> SKIP_PATH_PREFIXES = List.of(
            "node_modules/", "vendor/", "build/", "dist/", ".git/",
            "target/", ".gradle/"
    );

    private final RestClient restClient;

    public GitHubClient(@Value("${github.token:}") String token) {
        RestClient.Builder builder = RestClient.builder()
                .baseUrl(BASE_URL)
                .defaultHeader(HttpHeaders.ACCEPT, "application/vnd.github+json")
                .defaultHeader("X-GitHub-Api-Version", "2022-11-28");

        if (token != null && !token.isBlank()) {
            builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        } else {
            log.warn("No GITHUB_TOKEN set. Rate limit is 60 req/hr. " +
                    "Set GITHUB_TOKEN in .env for 5,000/hr.");
        }

        this.restClient = builder.build();
    }

    public List<TreeItem> getIndexableFiles(String owner, String repoName) {
        String url = "/repos/{owner}/{repo}/git/trees/HEAD?recursive=1";
        TreeResponse tree = restClient.get()
                .uri(url, owner, repoName)
                .retrieve()
                .body(TreeResponse.class);

        if (tree == null || tree.tree() == null) return List.of();

        return tree.tree().stream()
                .filter(item -> "blob".equals(item.type()))
                .filter(item -> item.size() != null && item.size() < 200_000)
                .filter(item -> isIndexable(item.path()))
                .toList();
    }

    public Optional<String> getFileContent(String owner, String repoName, String path) {
        try {
            ContentResponse content = restClient.get()
                    .uri("/repos/{owner}/{repo}/contents/{path}", owner, repoName, path)
                    .retrieve()
                    .body(ContentResponse.class);

            if (content == null || content.content() == null) return Optional.empty();

            String raw = content.content().replace("\n", "");
            return Optional.of(new String(Base64.getDecoder().decode(raw)));
        } catch (Exception e) {
            log.debug("Skipping file {}: {}", path, e.getMessage());
            return Optional.empty();
        }
    }

    private boolean isIndexable(String path) {
        if (path == null) return false;
        String lower = path.toLowerCase();
        for (String prefix : SKIP_PATH_PREFIXES) {
            if (lower.startsWith(prefix) || lower.contains("/" + prefix)) return false;
        }
        for (String ext : SKIP_EXTENSIONS) {
            if (lower.endsWith(ext)) return false;
        }
        return true;
    }
}