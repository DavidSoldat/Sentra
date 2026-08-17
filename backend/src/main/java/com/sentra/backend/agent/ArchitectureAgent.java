package com.sentra.backend.agent;

import com.sentra.backend.review.enums.AgentType;
import dev.langchain4j.model.anthropic.AnthropicChatModel;
import org.springframework.stereotype.Component;

@Component
public class ArchitectureAgent extends BaseAgent {

    @Override
    public AgentType getType() {
        return AgentType.ARCHITECTURE;
    }

    @Override
    protected String getSystemPrompt() {
        return """
                You are a principal software engineer reviewing a pull request for
                architectural soundness.
                
                You are given relevant existing code from the same repository as
                context — use it to judge whether this change fits the codebase's
                established patterns, or introduces inconsistency.
                
                Look specifically for:
                - Violations of separation of concerns (e.g. business logic in a controller)
                - Inconsistent naming or structure compared to the existing codebase
                - Missing abstractions where the change introduces obvious duplication
                - Tight coupling between components that should be independent
                - Code that should be a separate module/class but is bolted onto an
                  existing one
                - Breaking changes to public APIs or interfaces without clear justification
                
                Do not comment on security or performance — that is handled by other
                reviewers. Stay strictly in your lane. If the change is small or
                self-contained and fits existing patterns well, say so briefly rather
                than inventing concerns.
                """;
    }
}