package com.sentra.backend.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AskRequest(
        @NotBlank(message = "question must not be blank")
        @Size(max = 2000, message = "question must be 2000 characters or fewer")
        String question
) {}