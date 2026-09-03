package com.sentra.backend.web.dto;

import java.time.Instant;
import java.util.List;

public record ActivityFeedResponse(
        Instant lastViewedAt,
        List<ActivityItemResponse> items
) {}