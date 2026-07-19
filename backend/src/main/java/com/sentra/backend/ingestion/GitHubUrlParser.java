package com.sentra.backend.ingestion;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class GitHubUrlParser {

    private static final Pattern PR_PATTERN = Pattern.compile(
            "^https://github\\.com/([\\w.-]+)/([\\w.-]+)/pull/(\\d+)/?$"
    );

    private static final Pattern REPO_PATTERN = Pattern.compile(
            "^https://github\\.com/([\\w.-]+)/([\\w.-]+?)(?:\\.git)?/?$"
    );

    private GitHubUrlParser() {}

    public static ParsedPrUrl parsePrUrl(String url) {
        Matcher matcher = PR_PATTERN.matcher(url.strip());

        if (!matcher.matches()) {
            throw new IllegalArgumentException(
                    "Not a valid GitHub PR URL (expected https://github.com/owner/repo/pull/123): " + url);
        }

        return new ParsedPrUrl(
                matcher.group(1),
                matcher.group(2),
                Integer.parseInt(matcher.group(3))
        );
    }

    public static ParsedRepoUrl parseRepoUrl(String url) {
        Matcher matcher = REPO_PATTERN.matcher(url.strip());

        if (!matcher.matches()) {
            throw new IllegalArgumentException(
                    "Not a valid GitHub repo URL (expected https://github.com/owner/repo): " + url);
        }

        return new ParsedRepoUrl(matcher.group(1), matcher.group(2));
    }

    public record ParsedPrUrl(String owner, String repoName, int prNumber) {}
    public record ParsedRepoUrl(String owner, String repoName) {}
}