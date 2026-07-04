package com.sentra.backend.web.dto;

import java.time.Instant;
import java.util.List;

public record ReviewResponse(
        Long id,
        String prUrl,
        String prTitle,
        Integer prNumber,
        String status,
        Instant createdAt,
        Instant completedAt,
        List<AgentResultResponse> agents) {}