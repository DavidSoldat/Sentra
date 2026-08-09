package com.sentra.backend.billing.entity;

import com.sentra.backend.user.UserEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "subscriptions")
@Getter
@Setter
@NoArgsConstructor
public class SubscriptionEntity {

    @Id
    private Long userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private UserEntity user;

    private String paddleSubscriptionId;
    private String paddleCustomerId;
    private String status;
    private String priceId;
    private String productId;
    private Instant updatedAt;
    private Instant cancelAt;

    public SubscriptionEntity(UserEntity user) {
        this.user = user;
    }
}