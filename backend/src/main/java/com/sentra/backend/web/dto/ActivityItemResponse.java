package com.sentra.backend.web.dto;

import java.time.Instant;

public record ActivityItemResponse(
        Long reviewId,
        Long repoId,
        String repoName,
        String prTitle,
        Integer prNumber,
        String prUrl,
        String status,
        String severity,
        Instant createdAt,
        Instant completedAt
) {}