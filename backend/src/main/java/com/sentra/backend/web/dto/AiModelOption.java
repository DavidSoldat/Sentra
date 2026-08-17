package com.sentra.backend.web.dto;

import com.sentra.backend.ai.enums.AiModel;
import com.sentra.backend.ai.enums.ModelBand;

public record AiModelOption(AiModel id, String displayName, String provider, ModelBand band) {}