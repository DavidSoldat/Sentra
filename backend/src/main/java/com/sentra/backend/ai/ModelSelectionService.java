package com.sentra.backend.ai;

import com.sentra.backend.ai.enums.AiModel;
import com.sentra.backend.ai.enums.ModelBand;
import com.sentra.backend.billing.Tier;
import com.sentra.backend.user.UserEntity;
import dev.langchain4j.model.chat.ChatModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ModelSelectionService {

    private final Map<AiModel, ChatModel> models;

    public record ResolvedModel(AiModel model, ChatModel chatModel) {
    }

    public ResolvedModel resolveModel(UserEntity user) {
        AiModel preferred = user.getPreferredModel();

        if (preferred.getBand() == ModelBand.PREMIUM && user.getTier() != Tier.PRO) {
            log.debug("User {} prefers {} (PREMIUM) but is on {} — falling back to Efficient default",
                    user.getId(), preferred, user.getTier());
            preferred = AiModel.CLAUDE_HAIKU;
        }

        return new ResolvedModel(preferred, models.get(preferred));
    }
}