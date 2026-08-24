package com.sentra.backend.web;

import com.sentra.backend.agent.AgentFollowUpMessageEntity;
import com.sentra.backend.agent.AgentFollowUpService;
import com.sentra.backend.review.enums.AgentType;
import com.sentra.backend.web.dto.AgentMessageResponse;
import com.sentra.backend.web.dto.AskFollowUpRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/reviews/{reviewId}/agents/{agentType}/messages")
@RequiredArgsConstructor
public class AgentChatController {

    private final AgentFollowUpService agentFollowUpService;

    @GetMapping
    public ResponseEntity<List<AgentMessageResponse>> getMessages(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long reviewId,
            @PathVariable AgentType agentType) {

        return ResponseEntity.ok(toResponse(
                agentFollowUpService.getHistory(reviewId, agentType, userId)));
    }

    @PostMapping
    public ResponseEntity<List<AgentMessageResponse>> postMessage(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long reviewId,
            @PathVariable AgentType agentType,
            @Valid @RequestBody AskFollowUpRequest request) {

        return ResponseEntity.ok(toResponse(
                agentFollowUpService.askFollowUp(reviewId, agentType, userId, request.question())));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamMessage(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long reviewId,
            @PathVariable AgentType agentType,
            @RequestParam String question) {

        SseEmitter emitter = new SseEmitter(60_000L);
        agentFollowUpService.streamFollowUp(reviewId, agentType, userId, question, emitter);
        return emitter;
    }

    private List<AgentMessageResponse> toResponse(List<AgentFollowUpMessageEntity> messages) {
        return messages.stream()
                .map(m -> new AgentMessageResponse(m.getId(), m.getRole().name(), m.getContent(), m.getCreatedAt()))
                .toList();
    }
}