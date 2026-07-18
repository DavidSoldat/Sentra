package com.sentra.backend.billing;

import lombok.Getter;

@Getter
public enum Tier {
    FREE(1, 40, 3),
    PRO(10, 1000, 50);

    private final int maxRepos;
    private final int maxQuestionsPerMonth;
    private final int maxReviewsPerMonth;

    Tier(int maxRepos, int maxQuestionsPerMonth, int maxReviewsPerMonth) {
        this.maxRepos = maxRepos;
        this.maxQuestionsPerMonth = maxQuestionsPerMonth;
        this.maxReviewsPerMonth = maxReviewsPerMonth;
    }
}