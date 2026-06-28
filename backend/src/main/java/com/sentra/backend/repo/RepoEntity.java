package com.sentra.backend.repo;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "repos")
@Getter
@Setter
@NoArgsConstructor
public class RepoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String url;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RepoStatus status = RepoStatus.PENDING;

    private Instant indexedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public RepoEntity(String url, String name) {
        this.url = url;
        this.name = name;
    }
}