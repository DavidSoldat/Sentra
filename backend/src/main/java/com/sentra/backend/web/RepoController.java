package com.sentra.backend.web;

import com.sentra.backend.ingestion.IngestionService;
import com.sentra.backend.repo.RepoEntity;
import com.sentra.backend.repo.RepoRepository;
import com.sentra.backend.web.dto.RepoResponse;
import com.sentra.backend.web.dto.SubmitRepoRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/repos")
@RequiredArgsConstructor
public class RepoController {

    private final RepoRepository repoRepository;
    private final IngestionService ingestionService;

    @PostMapping
    public ResponseEntity<RepoResponse> submitRepo(@Valid @RequestBody SubmitRepoRequest request) {

        return repoRepository.findByUrl(request.url())
                .map(existing -> ResponseEntity.ok(RepoResponse.from(existing)))
                .orElseGet(() -> {
                    String name = parseRepoName(request.url());
                    RepoEntity saved = repoRepository.save(new RepoEntity(request.url(), name));

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
    public ResponseEntity<RepoResponse> getRepo(@PathVariable Long id) {
        return repoRepository.findById(id)
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