package com.sentra.backend.ingestion.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TreeItem(String path, String type, Long size, String sha) {}