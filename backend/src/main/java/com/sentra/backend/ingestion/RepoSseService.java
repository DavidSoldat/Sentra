package com.sentra.backend.ingestion;


import com.sentra.backend.ingestion.dto.IngestionProgress;
import com.sentra.backend.repo.RepoStatus;
import com.sentra.backend.web.dto.RepoResponse;
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
public class RepoSseService {

    private static final long EMITTER_TIMEOUT_MS = 5 * 60 * 1000L; // 5 min

    private final Map<Long, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long repoId) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        emitters.computeIfAbsent(repoId, id -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(repoId, emitter));
        emitter.onTimeout(() -> removeEmitter(repoId, emitter));
        emitter.onError(e -> removeEmitter(repoId, emitter));

        return emitter;
    }

    public void publish(Long repoId, RepoResponse payload) {
        List<SseEmitter> subscribers = emitters.get(repoId);
        if (subscribers == null || subscribers.isEmpty()) return;

        boolean terminal = payload.status() != null
                && (payload.status().equals(RepoStatus.READY.name())
                || payload.status().equals(RepoStatus.FAILED.name()));

        for (SseEmitter emitter : subscribers) {
            try {
                emitter.send(SseEmitter.event().name("status").data(payload));
                if (terminal) emitter.complete();
            } catch (IOException | IllegalStateException e) {
                log.debug("Dropping dead SSE emitter for repo {}", repoId);
                try {
                    emitter.completeWithError(e);
                } catch (Exception ignored) {

                }
            }
        }

        if (terminal) emitters.remove(repoId);
    }

    public void publishProgress(Long repoId, IngestionProgress progress) {
        List<SseEmitter> subscribers = emitters.get(repoId);
        if (subscribers == null || subscribers.isEmpty()) return;

        for (SseEmitter emitter : subscribers) {
            try {
                emitter.send(SseEmitter.event().name("progress").data(progress));
            } catch (IOException | IllegalStateException e) {
                log.debug("Dropping dead SSE emitter for repo {}", repoId);
                try {
                    emitter.completeWithError(e);
                } catch (Exception ignored) {
                }
            }
        }
    }

    private void removeEmitter(Long repoId, SseEmitter emitter) {
        List<SseEmitter> subscribers = emitters.get(repoId);
        if (subscribers == null) return;
        subscribers.remove(emitter);
        if (subscribers.isEmpty()) emitters.remove(repoId);
    }
}