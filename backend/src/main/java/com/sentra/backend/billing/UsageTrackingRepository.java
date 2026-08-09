package com.sentra.backend.billing;

import com.sentra.backend.billing.entity.UsageTrackingEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsageTrackingRepository extends JpaRepository<UsageTrackingEntity, Long> {
}