package com.sentra.backend.web.dto;

import java.time.Instant;
import java.util.List;

public record PublicReviewResponse(
        String prUrl,
        String prTitle,
        Integer prNumber,
        String status,
        Instant completedAt,
        List<AgentResultResponse> agents
) {}