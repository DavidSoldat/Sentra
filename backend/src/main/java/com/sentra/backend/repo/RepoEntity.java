package com.sentra.backend.repo;

import com.sentra.backend.user.UserEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "repos", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "url"}))
@Getter
@Setter
@NoArgsConstructor
public class RepoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RepoStatus status = RepoStatus.PENDING;

    private Instant indexedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public RepoEntity(UserEntity user, String url, String name) {
        this.user = user;
        this.url = url;
        this.name = name;
    }
}