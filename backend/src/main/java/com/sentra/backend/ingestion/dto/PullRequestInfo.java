package com.sentra.backend.ingestion.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PullRequestInfo(Integer number, String title, String state) {}