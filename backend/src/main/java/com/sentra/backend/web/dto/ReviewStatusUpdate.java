package com.sentra.backend.web.dto;

import java.time.Instant;

public record ReviewStatusUpdate(String status, Instant completedAt) {}