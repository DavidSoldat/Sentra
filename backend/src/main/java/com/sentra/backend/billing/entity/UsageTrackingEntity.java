package com.sentra.backend.billing.entity;

import com.sentra.backend.user.UserEntity;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDate;

@Entity
@Table(name = "usage_tracking")
@Getter
public class UsageTrackingEntity {

    @Id
    private Long userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private UserEntity user;

    private LocalDate periodStart;
    private int questionsUsed;
    private int reviewsUsed;

    protected UsageTrackingEntity() {}

    public void incrementQuestions() { this.questionsUsed++; }
    public void incrementReviews() { this.reviewsUsed++; }

    public void resetForNewPeriod(LocalDate newPeriodStart) {
        this.periodStart = newPeriodStart;
        this.questionsUsed = 0;
        this.reviewsUsed = 0;
    }

    public UsageTrackingEntity(UserEntity user) {
        this.user = user;
        this.periodStart = LocalDate.now().withDayOfMonth(1);
        this.questionsUsed = 0;
        this.reviewsUsed = 0;
    }
}