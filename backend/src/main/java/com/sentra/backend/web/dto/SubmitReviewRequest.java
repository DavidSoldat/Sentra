package com.sentra.backend.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SubmitReviewRequest(
        @NotBlank(message = "prUrl must not be blank")
        @Pattern(
                regexp = "https://github\\.com/[\\w.-]+/[\\w.-]+/pull/\\d+/?",
                message = "must be a valid GitHub PR URL (https://github.com/owner/repo/pull/123)"
        )
        String prUrl
) {}