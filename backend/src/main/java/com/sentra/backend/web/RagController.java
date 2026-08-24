package com.sentra.backend.web;

import com.sentra.backend.rag.RagService;
import com.sentra.backend.web.dto.AskRequest;
import com.sentra.backend.web.dto.AskResponse;
import com.sentra.backend.web.dto.QuestionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;


@RestController
@RequestMapping("/api/repos")
@RequiredArgsConstructor
public class RagController {

    private final RagService ragService;

    @PostMapping("/{id}/ask")
    public ResponseEntity<AskResponse> ask(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody AskRequest request) {

        AskResponse serviceResponse = ragService.ask(id, userId, request.question());

        return ResponseEntity.ok(new AskResponse(
                serviceResponse.answer(),
                serviceResponse.sources(),
                serviceResponse.modelUsed()));
    }

    @GetMapping(value = "/{id}/ask-stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter askStream(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId,
            @RequestParam String question) {

        SseEmitter emitter = new SseEmitter(60_000L);
        ragService.streamAnswer(id, userId, question, emitter);
        return emitter;
    }

    @GetMapping("/{id}/questions")
    public ResponseEntity<List<QuestionResponse>> getQuestions(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {

        List<QuestionResponse> response = ragService.getHistory(id, userId).stream()
                .map(h -> new QuestionResponse(h.id(), h.question(), h.answer(), h.createdAt()))
                .toList();

        return ResponseEntity.ok(response);
    }
}