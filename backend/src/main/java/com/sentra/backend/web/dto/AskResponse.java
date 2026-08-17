package com.sentra.backend.web.dto;

import java.util.List;

public record AskResponse(String answer, List<String> sources, String modelUsed) {}