package com.sentra.backend.user;

import com.sentra.backend.billing.Tier;
import com.sentra.backend.security.EncryptedStringConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "github_id", nullable = false, unique = true)
    private Long githubId;

    @Column(nullable = false)
    private String username;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "github_access_token", nullable = false, length = 512)
    private String githubAccessToken;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Enumerated(EnumType.STRING)
    private Tier tier = Tier.FREE;

    public UserEntity(Long githubId, String username, String avatarUrl, String githubAccessToken) {
        this.githubId = githubId;
        this.username = username;
        this.avatarUrl = avatarUrl;
        this.githubAccessToken = githubAccessToken;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }
}