package com.sentra.backend.ingestion;

import com.sentra.backend.ingestion.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.util.Base64;
import java.util.List;
import java.util.Map;
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

    public GitHubClient() {
        RestClient.Builder builder = RestClient.builder()
                .baseUrl(BASE_URL)
                .defaultHeader(HttpHeaders.ACCEPT, "application/vnd.github+json")
                .defaultHeader("X-GitHub-Api-Version", "2022-11-28");

        this.restClient = builder.build();
    }

    public static boolean isIndexable(String path) {
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

    public String getPullRequestDiff(String accessToken, String owner, String repoName, int prNumber) {
        String diff = restClient.get()
                .uri("/repos/{owner}/{repo}/pulls/{prNumber}", owner, repoName, prNumber)
                .header(HttpHeaders.ACCEPT, "application/vnd.github.diff")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .body(String.class);

        if (diff == null || diff.isBlank()) {
            throw new IllegalStateException(
                    "No diff content returned for PR #%d in %s/%s".formatted(prNumber, owner, repoName));
        }

        log.debug("Fetched diff for PR #{}: {} chars", prNumber, diff.length());
        return diff;
    }

    public PullRequestInfo getPullRequestInfo(String accessToken, String owner, String repoName, int prNumber) {
        PullRequestInfo info = restClient.get()
                .uri("/repos/{owner}/{repo}/pulls/{prNumber}", owner, repoName, prNumber)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .body(PullRequestInfo.class);

        if (info == null) {
            throw new IllegalStateException(
                    "PR #%d not found in %s/%s".formatted(prNumber, owner, repoName));
        }

        return info;
    }

    public GitHubRepoSummary getRepoInfo(String accessToken, String owner, String repoName) {
        GitHubRepoSummary info = restClient.get()
                .uri("/repos/{owner}/{repo}", owner, repoName)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .body(GitHubRepoSummary.class);

        if (info == null) {
            throw new IllegalStateException(
                    "Could not fetch repo info for %s/%s".formatted(owner, repoName));
        }
        return info;
    }

    public List<PullRequestSummary> listPullRequests(String accessToken, String owner, String repoName) {
        List<PullRequestSummary> prs = restClient.get()
                .uri("/repos/{owner}/{repo}/pulls?state=all&per_page=100&sort=created&direction=desc",
                        owner, repoName)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .body(new ParameterizedTypeReference<List<PullRequestSummary>>() {
                });

        if (prs == null) {
            throw new IllegalStateException(
                    "Could not fetch pull requests for %s/%s".formatted(owner, repoName));
        }
        return prs;
    }

    public byte[] downloadTarball(String accessToken, String owner, String repoName) {
        ResponseEntity<Void> redirectResponse = restClient.get()
                .uri("/repos/{owner}/{repo}/tarball", owner, repoName)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .toBodilessEntity();

        URI downloadUrl = redirectResponse.getHeaders().getLocation();
        if (downloadUrl == null) {
            throw new IllegalStateException(
                    "GitHub did not return a redirect location for %s/%s tarball".formatted(owner, repoName));
        }

        byte[] tarball = RestClient.create()
                .get()
                .uri(downloadUrl)
                .retrieve()
                .body(byte[].class);

        if (tarball == null || tarball.length == 0) {
            throw new IllegalStateException(
                    "No tarball content returned for %s/%s".formatted(owner, repoName));
        }

        log.info("Downloaded tarball for {}/{}: {} bytes", owner, repoName, tarball.length);
        return tarball;
    }

    public List<GitHubRepoSummary> listUserRepos(String accessToken) {
        List<GitHubRepoSummary> repos = restClient.get()
                .uri("/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .body(new ParameterizedTypeReference<List<GitHubRepoSummary>>() {});

        if (repos == null) {
            throw new IllegalStateException("Could not fetch repos for the authenticated user");
        }
        return repos;
    }

    public String postReviewComment(String userAccessToken, String owner, String repoName, int prNumber, String body) {
        var response = restClient.post()
                .uri("/repos/{owner}/{repo}/pulls/{prNumber}/reviews", owner, repoName, prNumber)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAccessToken)
                .body(Map.of("body", body, "event", "COMMENT"))
                .retrieve()
                .body(Map.class);

        if (response == null || response.get("html_url") == null) {
            throw new IllegalStateException(
                    "GitHub did not return a URL for the posted review on PR #%d in %s/%s"
                            .formatted(prNumber, owner, repoName));
        }

        return response.get("html_url").toString();
    }
}