package com.sentra.backend.security;

import com.sentra.backend.user.UserEntity;
import com.sentra.backend.user.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    @Value("${FRONTEND_REDIRECT_URL}")
    private static String FRONTEND_REDIRECT_URL;
    private static final String COOKIE_NAME = "sentra_session";
    private static final Duration COOKIE_MAX_AGE = Duration.ofDays(7);

    private final OAuth2AuthorizedClientService authorizedClientService;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = oauthToken.getPrincipal();

        OAuth2AuthorizedClient authorizedclient = authorizedClientService.loadAuthorizedClient(oauthToken.getAuthorizedClientRegistrationId(), oAuth2User.getName());
        String accessToken = authorizedclient.getAccessToken().getTokenValue();

        Long githubId = ((Number) oAuth2User.getAttributes().get("id")).longValue();
        String username = (String) oAuth2User.getAttributes().get("login");
        String avatarUrl = (String) oAuth2User.getAttributes().get("avatar_url");

        UserEntity user = userRepository.findByGithubId(githubId).orElseGet(() -> new UserEntity(githubId, username, avatarUrl, accessToken));
        user.setUsername(username);
        user.setAvatarUrl(avatarUrl);
        user.setGithubAccessToken(accessToken);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        String jwt = jwtService.issueToken(user.getId(), user.getUsername());

        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, jwt)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(COOKIE_MAX_AGE)
                .sameSite("None")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        response.sendRedirect(FRONTEND_REDIRECT_URL);

        log.info("User {} (githubId={}) logged in successfully", user.getUsername(), githubId);

    }
}
