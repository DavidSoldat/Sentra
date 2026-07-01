package com.sentra.backend.review.repository;

import com.sentra.backend.review.entity.AgentResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AgentResultRepository extends JpaRepository<AgentResultEntity, Long> {

    List<AgentResultEntity> findByReviewId(Long reviewId);
}