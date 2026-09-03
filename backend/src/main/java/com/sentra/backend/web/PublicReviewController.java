package com.sentra.backend.web;

import com.sentra.backend.review.entity.ReviewEntity;
import com.sentra.backend.review.repository.AgentResultRepository;
import com.sentra.backend.review.repository.ReviewRepository;
import com.sentra.backend.web.dto.AgentResultResponse;

import com.sentra.backend.web.dto.PublicReviewResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/reviews")
@RequiredArgsConstructor
public class PublicReviewController {

    private final ReviewRepository reviewRepository;
    private final AgentResultRepository agentResultRepository;

    @GetMapping("/{token}")
    public ResponseEntity<PublicReviewResponse> getSharedReview(@PathVariable String token) {
        ReviewEntity review = reviewRepository.findByShareToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Shared review not found"));

        List<AgentResultResponse> agents = agentResultRepository.findByReviewId(review.getId()).stream()
                .map(r -> new AgentResultResponse(
                        r.getAgent().name(),
                        r.getStatus().name(),
                        r.getFindings(),
                        r.getSeverity() != null ? r.getSeverity().name() : null,
                        r.getCompletedAt()))
                .toList();

        return ResponseEntity.ok(new PublicReviewResponse(
                review.getPrUrl(),
                review.getPrTitle(),
                review.getPrNumber(),
                review.getStatus().name(),
                review.getCompletedAt(),
                agents));
    }
}