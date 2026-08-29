package com.sentra.backend.ingestion.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GitHubRepoSummary(
        @JsonProperty("full_name") String fullName,
        @JsonProperty("html_url") String htmlUrl,
        @JsonProperty("private") boolean isPrivate,
        @JsonProperty("updated_at") String updatedAt,
        String description
) {}