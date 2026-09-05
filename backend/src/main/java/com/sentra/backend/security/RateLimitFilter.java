package com.sentra.backend.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final List<String> EXPENSIVE_POST_PREFIXES = List.of(
            "/api/repos",
            "/api/reviews"
    );

    private final ConcurrentMap<String, Bucket> generalBuckets = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, Bucket> strictBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String clientIp = request.getRemoteAddr();

        Bucket general = generalBuckets.computeIfAbsent(
                clientIp, ip -> newBucket(120, Duration.ofMinutes(1)));
        if (!general.tryConsume(1)) {
            respondTooManyRequests(response);
            return;
        }

        if (isExpensiveEndpoint(request)) {
            Bucket strict = strictBuckets.computeIfAbsent(
                    clientIp, ip -> newBucket(10, Duration.ofMinutes(1)));
            if (!strict.tryConsume(1)) {
                respondTooManyRequests(response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isExpensiveEndpoint(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) return false;
        String uri = request.getRequestURI();
        return EXPENSIVE_POST_PREFIXES.stream().anyMatch(uri::startsWith);
    }

    private Bucket newBucket(int capacity, Duration period) {
        Bandwidth limit = Bandwidth.classic(capacity, Refill.greedy(capacity, period));
        return Bucket.builder().addLimit(limit).build();
    }

    private void respondTooManyRequests(HttpServletResponse response) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"Too many requests. Please slow down.\"}");
    }
}