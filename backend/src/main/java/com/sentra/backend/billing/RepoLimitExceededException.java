package com.sentra.backend.billing;

import lombok.Getter;

@Getter
public class RepoLimitExceededException extends RuntimeException {
    private final int limit;

    public RepoLimitExceededException(int limit) {
        super("Repo limit exceeded: " + limit);
        this.limit = limit;
    }
}