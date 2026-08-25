package com.sentra.backend.review.entity;

import com.sentra.backend.repo.RepoEntity;
import com.sentra.backend.review.enums.ReviewStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "reviews")
@Getter
@Setter
@NoArgsConstructor
public class ReviewEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repo_id", nullable = false)
    private RepoEntity repo;

    @Column(name = "pr_url", nullable = false)
    private String prUrl;

    @Column(name = "pr_number")
    private Integer prNumber;

    @Column(name = "pr_title")
    private String prTitle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReviewStatus status = ReviewStatus.PENDING;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant completedAt;

    @Column(name = "github_comment_url")
    private String githubCommentUrl;

    private Instant postedToGithubAt;

    public ReviewEntity(RepoEntity repo, String prUrl, Integer prNumber, String prTitle) {
        this.repo = repo;
        this.prUrl = prUrl;
        this.prNumber = prNumber;
        this.prTitle = prTitle;
    }
}