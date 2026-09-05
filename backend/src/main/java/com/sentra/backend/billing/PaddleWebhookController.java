package com.sentra.backend.billing;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/webhooks")
public class PaddleWebhookController {

    private final PaddleWebhookVerifier verifier;
    private final PaddleWebhookService webhookService;

    public PaddleWebhookController(PaddleWebhookVerifier verifier, PaddleWebhookService webhookService) {
        this.verifier = verifier;
        this.webhookService = webhookService;
    }

    @PostMapping("/paddle")
    public ResponseEntity<Void> handlePaddleWebhook(
            @RequestHeader("Paddle-Signature") String signature,
            @RequestBody String rawBody) {

        if (!verifier.isValid(signature, rawBody)) {
            log.warn("Rejected Paddle webhook: invalid signature");
            return ResponseEntity.status(401).build();
        }

        log.debug("Verified Paddle webhook received: {}", rawBody);
        webhookService.process(rawBody);
        return ResponseEntity.ok().build();
    }
}