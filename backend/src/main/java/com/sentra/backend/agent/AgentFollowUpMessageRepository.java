package com.sentra.backend.agent;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AgentFollowUpMessageRepository extends JpaRepository<AgentFollowUpMessageEntity, Long> {
    List<AgentFollowUpMessageEntity> findByAgentResultIdOrderByCreatedAtAsc(Long agentResultId);

    List<AgentFollowUpMessageEntity> findByAgentResultIdOrderByCreatedAtDesc(
            Long agentResultId, Pageable pageable);
}