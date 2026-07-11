package com.sentra.backend.web;

import com.sentra.backend.rag.RagService;
import com.sentra.backend.web.dto.AskRequest;
import com.sentra.backend.web.dto.AskResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


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

        RagService.AskResponse serviceResponse = ragService.ask(id, userId, request.question());

        return ResponseEntity.ok(new AskResponse(
                serviceResponse.answer(),
                serviceResponse.sources()));
    }
}