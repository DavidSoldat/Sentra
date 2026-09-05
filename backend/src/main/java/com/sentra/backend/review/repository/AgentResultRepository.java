package com.sentra.backend.review.repository;

import com.sentra.backend.review.entity.AgentResultEntity;
import com.sentra.backend.review.enums.AgentType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AgentResultRepository extends JpaRepository<AgentResultEntity, Long> {

    List<AgentResultEntity> findByReviewId(Long reviewId);
    Optional<AgentResultEntity> findByReviewIdAndAgent(Long reviewId, AgentType agent);
    List<AgentResultEntity> findByReviewIdIn(List<Long> reviewIds);
}