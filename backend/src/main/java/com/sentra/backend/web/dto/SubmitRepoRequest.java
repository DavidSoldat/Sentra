package com.sentra.backend.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SubmitRepoRequest(
        @NotBlank(message = "url must not be blank")
        @Pattern(
                regexp = "https://github\\.com/[\\w.-]+/[\\w.-]+",
                message = "must be a valid GitHub repo URL (https://github.com/owner/repo)"
        )
        String url
) {}