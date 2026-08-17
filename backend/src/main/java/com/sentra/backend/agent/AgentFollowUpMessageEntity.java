package com.sentra.backend.agent;

import com.sentra.backend.review.entity.AgentResultEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "agent_follow_up_messages")
@Getter
@NoArgsConstructor
public class AgentFollowUpMessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_result_id", nullable = false)
    private AgentResultEntity agentResult;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageRole role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public AgentFollowUpMessageEntity(AgentResultEntity agentResult, MessageRole role, String content) {
        this.agentResult = agentResult;
        this.role = role;
        this.content = content;
        this.createdAt = Instant.now();
    }
}