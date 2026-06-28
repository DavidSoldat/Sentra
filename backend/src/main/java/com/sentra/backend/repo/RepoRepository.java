package com.sentra.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RepoRepository extends JpaRepository<RepoEntity, Long> {
    Optional<RepoEntity> findByUrl(String url);
}