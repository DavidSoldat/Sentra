package com.sentra.backend.web.dto;

import java.time.Instant;

public record QuestionResponse(Long id, String question, String answer, Instant createdAt) {}