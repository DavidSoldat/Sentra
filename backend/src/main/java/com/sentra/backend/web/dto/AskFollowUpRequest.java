package com.sentra.backend.web.dto;

import jakarta.validation.constraints.NotBlank;

public record AskFollowUpRequest(@NotBlank String question) {}