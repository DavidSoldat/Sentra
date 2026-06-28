package com.sentra.backend.web.dto;

import com.sentra.backend.repo.RepoEntity;

import java.time.Instant;

public record RepoResponse(
        Long id,
        String url,
        String name,
        String status,
        Instant indexedAt,
        Instant createdAt
) {
    public static RepoResponse from(RepoEntity e) {
        return new RepoResponse(
                e.getId(), e.getUrl(), e.getName(),
                e.getStatus().name(), e.getIndexedAt(), e.getCreatedAt());
    }
}