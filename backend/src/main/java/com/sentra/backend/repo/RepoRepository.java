package com.sentra.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RepoRepository extends JpaRepository<RepoEntity, Long> {
    Optional<RepoEntity> findByUserIdAndUrl(Long userId, String url);
    List<RepoEntity> findAllByUserIdOrderByCreatedAtDesc(Long userId);
}