package com.sentra.backend.web.dto;

import java.time.Instant;

public record AgentResultResponse(
        String agent,
        String status,
        String findings,
        String severity,
        Instant completedAt
) {}