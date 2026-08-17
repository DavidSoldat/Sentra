package com.sentra.backend.web.dto;

import com.sentra.backend.ai.enums.AiModel;
import jakarta.validation.constraints.NotNull;

public record UpdateModelPreferenceRequest(@NotNull AiModel preferredModel) {}