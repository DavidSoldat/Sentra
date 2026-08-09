package com.sentra.backend.review;

import com.sentra.backend.web.dto.AgentResultResponse;
import com.sentra.backend.web.dto.ReviewStatusUpdate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
public class ReviewSseService {

    private static final long EMITTER_TIMEOUT_MS = 5 * 60 * 1000L;
    private static final List<String> TERMINAL_STATUSES = List.of("COMPLETED", "FAILED");

    private final Map<Long, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long reviewId) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        emitters.computeIfAbsent(reviewId, id -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(reviewId, emitter));
        emitter.onTimeout(() -> removeEmitter(reviewId, emitter));
        emitter.onError(e -> removeEmitter(reviewId, emitter));

        return emitter;
    }

    public void publishAgentUpdate(Long reviewId, AgentResultResponse agent) {
        broadcast(reviewId, "agent", agent, false);
    }

    public void publishReviewStatus(Long reviewId, ReviewStatusUpdate status) {
        boolean terminal = TERMINAL_STATUSES.contains(status.status());
        broadcast(reviewId, "review", status, terminal);
    }

    private void broadcast(Long reviewId, String eventName, Object payload, boolean terminal) {
        List<SseEmitter> subscribers = emitters.get(reviewId);
        if (subscribers == null || subscribers.isEmpty()) return;

        for (SseEmitter emitter : subscribers) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(payload));
                if (terminal) emitter.complete();
            } catch (IOException | IllegalStateException e) {
                log.debug("Dropping dead SSE emitter for review {}", reviewId);
                emitter.completeWithError(e);
            }
        }

        if (terminal) emitters.remove(reviewId);
    }

    private void removeEmitter(Long reviewId, SseEmitter emitter) {
        List<SseEmitter> subscribers = emitters.get(reviewId);
        if (subscribers == null) return;
        subscribers.remove(emitter);
        if (subscribers.isEmpty()) emitters.remove(reviewId);
    }
}