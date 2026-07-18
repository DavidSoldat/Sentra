package com.sentra.backend.billing;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
public class QuotaExceededException extends RuntimeException {
    private final String resourceType;
    private final int limit;
    private final LocalDate resetsAt;

    public QuotaExceededException(String resourceType, int limit, LocalDate resetsAt) {
        super("Quota exceeded for " + resourceType);
        this.resourceType = resourceType;
        this.limit = limit;
        this.resetsAt = resetsAt;
    }
}