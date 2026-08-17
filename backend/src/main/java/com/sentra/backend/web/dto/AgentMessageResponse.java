package com.sentra.backend.web.dto;

import java.time.Instant;

public record AgentMessageResponse(Long id, String role, String content, Instant createdAt) {}