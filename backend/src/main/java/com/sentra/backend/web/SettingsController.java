package com.sentra.backend.web;

import com.sentra.backend.ai.enums.AiModel;
import com.sentra.backend.ai.enums.ModelBand;
import com.sentra.backend.billing.Tier;
import com.sentra.backend.billing.UsageEnforcementService;

import com.sentra.backend.billing.entity.UsageTrackingEntity;
import com.sentra.backend.user.UserEntity;
import com.sentra.backend.user.UserRepository;
import com.sentra.backend.web.dto.AiModelOption;
import com.sentra.backend.web.dto.UpdateModelPreferenceRequest;
import com.sentra.backend.web.dto.UsageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final UserRepository userRepository;
    private final UsageEnforcementService usageEnforcementService;

    @GetMapping("/usage")
    public ResponseEntity<UsageResponse> getUsage(@AuthenticationPrincipal Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        UsageTrackingEntity usage = usageEnforcementService.getOrCreateCurrentPeriod(user);

        return ResponseEntity.ok(new UsageResponse(
                usage.getQuestionsUsed(),
                user.getTier().getMaxQuestionsPerMonth(),
                usage.getReviewsUsed(),
                user.getTier().getMaxReviewsPerMonth(),
                usage.getPeriodStart(),
                usage.getPeriodStart().plusMonths(1)
        ));
    }

    @GetMapping("/models")
    public ResponseEntity<List<AiModelOption>> listModels() {
        List<AiModelOption> options = Arrays.stream(AiModel.values())
                .map(m -> new AiModelOption(m, m.getDisplayName(), m.getProvider(), m.getBand()))
                .toList();
        return ResponseEntity.ok(options);
    }

    @PutMapping("/model")
    public ResponseEntity<Void> updateModelPreference(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody UpdateModelPreferenceRequest request) {

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (request.preferredModel().getBand() == ModelBand.PREMIUM && user.getTier() != Tier.PRO) {
            throw new IllegalStateException("Premium models require a Pro subscription");
        }

        user.setPreferredModel(request.preferredModel());
        userRepository.save(user);

        return ResponseEntity.noContent().build();
    }
}