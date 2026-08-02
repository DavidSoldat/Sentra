package com.sentra.backend.web;

import com.sentra.backend.billing.SubscriptionEntity;
import com.sentra.backend.billing.SubscriptionRepository;
import com.sentra.backend.billing.Tier;
import com.sentra.backend.user.UserEntity;
import com.sentra.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String COOKIE_NAME = "sentra_session";

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;

    public record MeResponse(Long id, String username, String avatarUrl, Tier tier, Instant cancelAt) {}

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(@AuthenticationPrincipal Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + userId));

        Instant cancelAt = subscriptionRepository.findById(userId)
                .map(SubscriptionEntity::getCancelAt)
                .orElse(null);

        return ResponseEntity.ok(new MeResponse(user.getId(), user.getUsername(), user.getAvatarUrl(), user.getTier(), cancelAt));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        ResponseCookie expired = ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(Duration.ZERO)
                .sameSite("None")
                .build();

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, expired.toString())
                .build();
    }
}