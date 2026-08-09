package com.sentra.backend.billing;

import com.sentra.backend.billing.entity.UsageTrackingEntity;
import com.sentra.backend.user.UserEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class UsageEnforcementService {

    private final UsageTrackingRepository usageRepo;

    public UsageEnforcementService(UsageTrackingRepository usageRepo) {
        this.usageRepo = usageRepo;
    }

    @Transactional
    public void checkAndIncrementQuestions(UserEntity user) {
        UsageTrackingEntity usage = getOrCreateCurrentPeriod(user);
        int limit = user.getTier().getMaxQuestionsPerMonth();

        if (usage.getQuestionsUsed() >= limit) {
            throw new QuotaExceededException(
                    "questions", limit, nextResetDate(usage.getPeriodStart())
            );
        }
        usage.incrementQuestions();
        usageRepo.save(usage);
    }

    @Transactional
    public void checkAndIncrementReviews(UserEntity user) {
        UsageTrackingEntity usage = getOrCreateCurrentPeriod(user);
        int limit = user.getTier().getMaxReviewsPerMonth();

        if (usage.getReviewsUsed() >= limit) {
            throw new QuotaExceededException(
                    "reviews", limit, nextResetDate(usage.getPeriodStart())
            );
        }
        usage.incrementReviews();
        usageRepo.save(usage);
    }

    @Transactional
    public UsageTrackingEntity getOrCreateCurrentPeriod(UserEntity user) {
        UsageTrackingEntity usage = usageRepo.findById(user.getId())
                .orElseGet(() -> new UsageTrackingEntity(user));

        LocalDate currentPeriod = LocalDate.now().withDayOfMonth(1);
        if (usage.getPeriodStart().isBefore(currentPeriod)) {
            usage.resetForNewPeriod(currentPeriod);
            usageRepo.save(usage);
        }
        return usage;
    }

    private LocalDate nextResetDate(LocalDate periodStart) {
        return periodStart.plusMonths(1);
    }
}