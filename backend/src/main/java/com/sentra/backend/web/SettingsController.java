package com.sentra.backend.web;

import com.sentra.backend.billing.UsageEnforcementService;

import com.sentra.backend.billing.entity.UsageTrackingEntity;
import com.sentra.backend.user.UserEntity;
import com.sentra.backend.user.UserRepository;
import com.sentra.backend.web.dto.UsageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}