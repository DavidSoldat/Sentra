package com.sentra.backend.review.repository;

import com.sentra.backend.review.entity.ReviewEntity;
import org.apache.tomcat.util.http.fileupload.util.LimitedInputStream;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {
    boolean existsByIdAndRepoUserId(Long id, Long userId);

    @Query("select r.repo.user.id from ReviewEntity r where r.id = :reviewId")
    Long findOwnerIdByReviewId(@Param("reviewId") Long reviewId);
    List<ReviewEntity> findByRepoIdOrderByCreatedAtDesc(Long repoId);
    Optional<ReviewEntity> findFirstByRepoIdAndPrNumberOrderByCreatedAtDesc(Long repoId, Integer prNumber);
}