package com.sentra.backend.ai;

import com.sentra.backend.ai.enums.AiModel;
import com.sentra.backend.ai.enums.ModelBand;
import com.sentra.backend.billing.Tier;
import com.sentra.backend.user.UserEntity;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ModelSelectionService {

    private final Map<AiModel, ChatModel> models;
    private final Map<AiModel, StreamingChatModel> streamingModels;

    public record ResolvedModel(AiModel model, ChatModel chatModel) {
    }

    public record ResolvedStreamingModel(AiModel model, StreamingChatModel chatModel) {
    }


    public ResolvedModel resolveModel(UserEntity user) {
        AiModel preferred = resolveEffectiveModel(user);

        return new ResolvedModel(preferred, models.get(preferred));
    }

    public ResolvedStreamingModel resolveStreamingModel(UserEntity user) {
        AiModel preferred = resolveEffectiveModel(user);
        return new ResolvedStreamingModel(preferred, streamingModels.get(preferred));
    }

    private AiModel resolveEffectiveModel(UserEntity user) {
        AiModel preferred = user.getPreferredModel();

        if (preferred.getBand() == ModelBand.PREMIUM && user.getTier() != Tier.PRO) {
            log.debug("User {} prefers {} (PREMIUM) but is on {} — falling back to Efficient default",
                    user.getId(), preferred, user.getTier());
            preferred = AiModel.CLAUDE_HAIKU;
        }

        log.info("Resolved model {} for user {}", preferred, user.getId());
        return preferred;
    }
}