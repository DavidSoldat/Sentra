package com.sentra.backend.agent;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AgentFollowUpMessageRepository extends JpaRepository<AgentFollowUpMessageEntity, Long> {
    List<AgentFollowUpMessageEntity> findByAgentResultIdOrderByCreatedAtAsc(Long agentResultId);
}