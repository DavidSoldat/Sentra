package com.sentra.backend.billing;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Slf4j
@Component
public class PaddleWebhookVerifier {

    private final String secret;

    public PaddleWebhookVerifier(@Value("${paddle.webhook-secret}") String secret) {
        this.secret = secret;
    }

    public boolean isValid(String paddleSignatureHeader, String rawBody) {
        if (paddleSignatureHeader == null || rawBody == null) return false;

        String ts = null;
        String h1 = null;
        for (String part : paddleSignatureHeader.split(";")) {
            String[] kv = part.split("=", 2);
            if (kv.length != 2) continue;
            if ("ts".equals(kv[0])) ts = kv[1];
            if ("h1".equals(kv[0])) h1 = kv[1];
        }

        if (ts == null || h1 == null) {
            log.warn("Malformed Paddle-Signature header: {}", paddleSignatureHeader);
            return false;
        }

        String signedPayload = ts + ":" + rawBody;
        String computed = hmacSha256Hex(signedPayload, secret);

        return MessageDigest.isEqual(
                computed.getBytes(StandardCharsets.UTF_8),
                h1.getBytes(StandardCharsets.UTF_8)
        );
    }

    private String hmacSha256Hex(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to compute HMAC", e);
        }
    }
}