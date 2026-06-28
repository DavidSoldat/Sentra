package com.sentra.backend.rag;

import com.sentra.backend.repo.RepoEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "questions")
@Getter @Setter @NoArgsConstructor
public class QuestionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repo_id", nullable = false)
    private RepoEntity repo;

    @Column(nullable = false)
    private String question;

    @Column(columnDefinition = "TEXT")
    private String answer;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public QuestionEntity(RepoEntity repo, String question, String answer) {
        this.repo = repo;
        this.question = question;
        this.answer = answer;
    }
}