package com.sentra.backend.web.dto;

import java.time.LocalDate;

public record UsageResponse(
        int questionsUsed,
        int questionsLimit,
        int reviewsUsed,
        int reviewsLimit,
        LocalDate periodStart,
        LocalDate resetsAt
) {}