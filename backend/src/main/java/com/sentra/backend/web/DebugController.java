package com.sentra.backend.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
public class DebugController {
    @GetMapping("/api/whoami")
    public Object whoami(Principal principal) {
        return principal == null ? "no principal" : principal.getName();
    }
}