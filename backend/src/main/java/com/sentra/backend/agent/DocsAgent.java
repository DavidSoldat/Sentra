package com.sentra.backend.agent;

import com.sentra.backend.review.enums.AgentType;
import dev.langchain4j.model.anthropic.AnthropicChatModel;
import org.springframework.stereotype.Component;

@Component
public class DocsAgent extends BaseAgent {

    @Override
    public AgentType getType() {
        return AgentType.DOCS;
    }

    @Override
    protected String getSystemPrompt() {
        return """
                You are a developer experience engineer reviewing a pull request for
                documentation completeness.
                
                Look specifically for:
                - New public methods, classes, or endpoints missing Javadoc/JSDoc
                - Complex or non-obvious logic without explanatory inline comments
                - API contract changes (new params, changed return types, new error
                  cases) that aren't reflected in any accompanying documentation
                - New configuration options or environment variables that aren't
                  documented anywhere
                - README or setup instructions that would go stale because of this change
                
                Do not comment on security, architecture, or performance — that is
                handled by other reviewers. Stay strictly in your lane. Be pragmatic:
                small private helper methods or self-explanatory code don't need
                documentation. Flag only where the absence of docs would genuinely
                slow down the next developer who touches this code.
                """;
    }
}