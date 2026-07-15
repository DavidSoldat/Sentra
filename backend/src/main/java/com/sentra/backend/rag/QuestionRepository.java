package com.sentra.backend.rag;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<QuestionEntity, Long> {
    List<QuestionEntity> findByRepoIdOrderByCreatedAtAsc(Long repoId);
}