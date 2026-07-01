package com.sentra.backend.ingestion;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GitHubUrlParserTest {

    @Test
    void parsesValidPrUrl() {
        var parsed = GitHubUrlParser.parsePrUrl(
                "https://github.com/spring-projects/spring-petclinic/pull/700");

        assertThat(parsed.owner()).isEqualTo("spring-projects");
        assertThat(parsed.repoName()).isEqualTo("spring-petclinic");
        assertThat(parsed.prNumber()).isEqualTo(700);
    }

    @Test
    void rejectsInvalidUrl() {
        org.junit.jupiter.api.Assertions.assertThrows(
                IllegalArgumentException.class,
                () -> GitHubUrlParser.parsePrUrl("https://github.com/owner/repo"));
    }
}