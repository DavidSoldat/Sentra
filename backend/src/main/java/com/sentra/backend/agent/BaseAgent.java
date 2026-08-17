package com.sentra.backend.agent;

import com.sentra.backend.review.enums.AgentType;

import com.sentra.backend.review.enums.SeverityStatus;
import dev.langchain4j.model.anthropic.AnthropicChatModel;
import dev.langchain4j.model.chat.ChatModel;
import lombok.extern.slf4j.Slf4j;


import java.util.regex.Matcher;
import java.util.regex.Pattern;


@Slf4j
public abstract class BaseAgent {

    private static final Pattern SEVERITY_PATTERN =
            Pattern.compile("SEVERITY:\\s*(HIGH|MEDIUM|LOW|NONE)", Pattern.CASE_INSENSITIVE);

    public abstract AgentType getType();
    protected abstract String getSystemPrompt();


    public AgentResult review(String diff, String codebaseContext, ChatModel model) {
        String prompt = buildPrompt(diff, codebaseContext);

        log.debug("{} agent reviewing diff ({} chars)", getType(), diff.length());

        String response = model.chat(prompt);

        SeverityStatus severity = extractSeverity(response);
        String findings = stripSeverityLine(response);

        log.debug("{} agent finished: severity={}", getType(), severity);

        return new AgentResult(getType(), findings, severity);
    }

    private String buildPrompt(String diff, String codebaseContext) {
        StringBuilder sb = new StringBuilder();
        sb.append(getSystemPrompt()).append("\n\n");

        if (codebaseContext != null && !codebaseContext.isBlank()) {
            sb.append("--- RELEVANT EXISTING CODE (for context) ---\n");
            sb.append(codebaseContext).append("\n");
            sb.append("--- END EXISTING CODE ---\n\n");
        }

        sb.append("--- PULL REQUEST DIFF ---\n");
        sb.append(diff).append("\n");
        sb.append("--- END DIFF ---\n\n");

        sb.append("""
                Review the diff above. Write your findings in clear markdown.
                Be specific — reference exact file names and line context from the diff.
                If you find nothing notable in your area of expertise, say so briefly.
                
                Focus on the 3-4 most important findings only, ordered by severity —
                do not attempt to be exhaustive. Keep each finding to 2-4 sentences;
                skip exploit payload examples unless the vulnerability is non-obvious.
                
                End your response with exactly one line in this format:
                SEVERITY: HIGH | MEDIUM | LOW | NONE
                
                Use HIGH only for issues that should block merging.
                Use NONE only if you found nothing worth flagging.
                """);

        return sb.toString();
    }


    private SeverityStatus extractSeverity(String response) {
        Matcher matcher = SEVERITY_PATTERN.matcher(response);
        if (matcher.find()) {
            return SeverityStatus.valueOf(matcher.group(1).toUpperCase());
        }
        log.warn("{} agent response did not contain a SEVERITY line, defaulting to MEDIUM", getType());
        return SeverityStatus.MEDIUM;
    }

    private String stripSeverityLine(String response) {
        return SEVERITY_PATTERN.matcher(response).replaceAll("").stripTrailing();
    }
}
