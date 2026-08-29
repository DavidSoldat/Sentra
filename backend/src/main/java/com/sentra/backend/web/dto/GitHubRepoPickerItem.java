package com.sentra.backend.web.dto;

public record GitHubRepoPickerItem(
        String fullName,
        String htmlUrl,
        boolean isPrivate,
        String description,
        boolean alreadyAdded
) {}