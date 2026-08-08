package com.sentra.backend.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RenameRepoRequest(
        @NotBlank(message = "Name must not be blank")
        @Size(max = 255, message = "Name must be 255 characters or fewer")
        String name
) {}