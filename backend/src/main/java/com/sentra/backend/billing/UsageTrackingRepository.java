package com.sentra.backend.billing;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UsageTrackingRepository extends JpaRepository<UsageTrackingEntity, Long> {
}