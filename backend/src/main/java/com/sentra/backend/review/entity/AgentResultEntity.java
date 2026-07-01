package com.sentra.backend.review.entity;

import com.sentra.backend.review.enums.AgentResultStatus;
import com.sentra.backend.review.enums.AgentType;
import com.sentra.backend.review.enums.SeverityStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "agent_results")
@Getter
@Setter
@NoArgsConstructor
public class AgentResultEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private ReviewEntity review;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AgentType agent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AgentResultStatus status = AgentResultStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String findings;

    @Enumerated(EnumType.STRING)
    private SeverityStatus severity;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant completedAt;

    public AgentResultEntity(ReviewEntity review, AgentType agent) {
        this.review = review;
        this.agent = agent;
    }
}


