package com.sentra.backend.ai.enums;

import lombok.Getter;

@Getter
public enum AiModel {
    CLAUDE_HAIKU(ModelBand.EFFICIENT, "Claude Haiku", "Anthropic"),
    GPT_4O_MINI(ModelBand.EFFICIENT, "GPT-4o mini", "OpenAI"),
    CLAUDE_SONNET(ModelBand.PREMIUM, "Claude Sonnet", "Anthropic"),
    GPT_4O(ModelBand.PREMIUM, "GPT-4o", "OpenAI");

    private final ModelBand band;
    private final String displayName;
    private final String provider;

    AiModel(ModelBand band, String displayName, String provider) {
        this.band = band;
        this.displayName = displayName;
        this.provider = provider;
    }
}