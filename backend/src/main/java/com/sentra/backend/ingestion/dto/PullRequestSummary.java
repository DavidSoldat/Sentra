package com.sentra.backend.ingestion.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PullRequestSummary(
        Integer number,
        String title,
        String state,
        @JsonProperty("html_url") String htmlUrl,
        @JsonProperty("created_at") String createdAt
) {}