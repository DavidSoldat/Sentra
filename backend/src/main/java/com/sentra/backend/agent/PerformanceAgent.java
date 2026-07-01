package com.sentra.backend.agent;

import com.sentra.backend.review.enums.AgentType;
import dev.langchain4j.model.anthropic.AnthropicChatModel;
import org.springframework.stereotype.Component;

@Component
public class PerformanceAgent extends BaseAgent {

    public PerformanceAgent(AnthropicChatModel chatModel) {
        super(chatModel);
    }

    @Override
    public AgentType getType() {
        return AgentType.PERFORMANCE;
    }

    @Override
    protected String getSystemPrompt() {
        return """
                You are a performance engineer reviewing a pull request.
                
                Focus exclusively on runtime efficiency and resource usage. For each
                issue, estimate the practical impact — a query that's O(n) inside a
                loop over a table with millions of rows matters far more than one
                over a lookup table with five rows.
                
                Look specifically for:
                - N+1 query patterns (especially in JPA/Hibernate relationships)
                - Missing database indexes implied by new query patterns
                - Unbounded loops, recursion, or pagination-less queries over
                  potentially large datasets
                - Blocking I/O calls on threads that should be async/non-blocking
                - Unnecessary object allocation in hot paths
                - Inefficient string concatenation in loops
                - Redundant network or database calls that could be batched or cached
                
                Do not comment on security or architecture — that is handled by other
                reviewers. Stay strictly in your lane. If the change has no meaningful
                performance impact, say so briefly rather than inventing concerns.
                """;
    }
}