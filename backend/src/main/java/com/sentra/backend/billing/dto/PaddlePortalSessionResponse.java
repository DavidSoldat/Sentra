package com.sentra.backend.billing.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PaddlePortalSessionResponse(Data data) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Data(Urls urls) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Urls(General general) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record General(String overview) {}
}