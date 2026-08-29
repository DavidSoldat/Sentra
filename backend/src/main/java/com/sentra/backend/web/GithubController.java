package com.sentra.backend.web;

import com.sentra.backend.ingestion.GitHubClient;
import com.sentra.backend.ingestion.GitHubUrlParser;
import com.sentra.backend.ingestion.dto.GitHubRepoSummary;
import com.sentra.backend.repo.RepoRepository;
import com.sentra.backend.user.UserEntity;
import com.sentra.backend.user.UserRepository;
import com.sentra.backend.web.dto.GitHubRepoPickerItem;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/github")
@RequiredArgsConstructor
public class GithubController {

    private final GitHubClient gitHubClient;
    private final UserRepository userRepository;
    private final RepoRepository repoRepository;

    @GetMapping("/repos")
    public ResponseEntity<List<GitHubRepoPickerItem>> listRepos(@AuthenticationPrincipal Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        List<GitHubRepoSummary> repos = gitHubClient.listUserRepos(user.getGithubAccessToken());

        Set<String> addedFullNames = repoRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(r -> {
                    try {
                        var parsed = GitHubUrlParser.parseRepoUrl(r.getUrl());
                        return (parsed.owner() + "/" + parsed.repoName()).toLowerCase();
                    } catch (IllegalArgumentException e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<GitHubRepoPickerItem> items = repos.stream()
                .map(r -> new GitHubRepoPickerItem(
                        r.fullName(),
                        r.htmlUrl(),
                        r.isPrivate(),
                        r.description(),
                        addedFullNames.contains(r.fullName().toLowerCase())))
                .toList();

        return ResponseEntity.ok(items);
    }
}