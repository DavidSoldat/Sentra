package com.sentra.backend.web.dto;

import java.time.Instant;

public record ReviewSummaryResponse(
        Long id,
        String prUrl,
        String prTitle,
        Integer prNumber,
        String status,
        Instant createdAt,
        Instant completedAt
) {}
