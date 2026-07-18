package com.sentra.backend.web;

import com.sentra.backend.billing.RepoLimitExceededException;
import com.sentra.backend.ingestion.IngestionService;
import com.sentra.backend.repo.RepoEntity;
import com.sentra.backend.repo.RepoRepository;
import com.sentra.backend.user.UserEntity;
import com.sentra.backend.user.UserRepository;
import com.sentra.backend.web.dto.RepoResponse;
import com.sentra.backend.web.dto.SubmitRepoRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/repos")
@RequiredArgsConstructor
public class RepoController {

    private final RepoRepository repoRepository;
    private final UserRepository userRepository;
    private final IngestionService ingestionService;

    @GetMapping
    public ResponseEntity<List<RepoResponse>> listRepos(@AuthenticationPrincipal Long userId) {
        List<RepoResponse> repos = repoRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(RepoResponse::from)
                .toList();

        return ResponseEntity.ok(repos);
    }

    @PostMapping
    public ResponseEntity<RepoResponse> submitRepo(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody SubmitRepoRequest request) {

        return repoRepository.findByUserIdAndUrl(userId, request.url())
                .map(existing -> ResponseEntity.ok(RepoResponse.from(existing)))
                .orElseGet(() -> {
                    UserEntity user = userRepository.findById(userId)
                            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

                    long currentRepoCount = repoRepository.countByUserId(userId);
                    if (currentRepoCount >= user.getTier().getMaxRepos()) {
                        throw new RepoLimitExceededException(user.getTier().getMaxRepos());
                    }

                    String name = parseRepoName(request.url());

                    RepoEntity saved = repoRepository.save(
                            new RepoEntity(user, request.url(), name));

                    ingestionService.indexRepo(saved.getId());

                    URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                            .path("/{id}")
                            .buildAndExpand(saved.getId())
                            .toUri();

                    return ResponseEntity.accepted()
                            .location(location)
                            .body(RepoResponse.from(saved));
                });
    }

    @GetMapping("/{id}")
    public ResponseEntity<RepoResponse> getRepo(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {

        return repoRepository.findById(id)
                .filter(repo -> repo.getUser().getId().equals(userId))
                .map(repo -> ResponseEntity.ok(RepoResponse.from(repo)))
                .orElse(ResponseEntity.notFound().build());
    }

    private String parseRepoName(String url) {
        String cleaned = url.strip().replaceAll("/$", "").replaceAll("\\.git$", "");
        String[] parts = cleaned.split("/");
        if (parts.length < 2) return cleaned;
        return parts[parts.length - 2] + "/" + parts[parts.length - 1];
    }
}