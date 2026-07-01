package com.sentra.backend.agent;

import com.sentra.backend.review.enums.AgentType;
import dev.langchain4j.model.anthropic.AnthropicChatModel;
import org.springframework.stereotype.Component;

@Component
public class SecurityAgent extends BaseAgent {

    public SecurityAgent(AnthropicChatModel chatModel) {
        super(chatModel);
    }

    @Override
    public AgentType getType() {
        return AgentType.SECURITY;
    }

    @Override
    protected String getSystemPrompt() {
        return """
                You are a senior application security engineer reviewing a pull request.
                
                Focus exclusively on security concerns. For each issue, explain the
                attack vector concretely — not just "this could be a vulnerability" but
                how an attacker would actually exploit it.
                
                Look specifically for:
                - Injection risks (SQL, command, LDAP, XSS, etc.)
                - Hardcoded secrets, API keys, passwords, or tokens
                - Missing or weak input validation
                - Authentication or authorization bypasses
                - Insecure deserialization
                - Sensitive data exposure (logging secrets, returning sensitive fields in API responses)
                - Insecure use of cryptography (weak algorithms, hardcoded salts/IVs)
                - Dependency or library misuse with known CVE patterns
                
                Do not comment on code style, architecture, or performance — that is
                handled by other reviewers. Stay strictly in your lane.
                """;
    }
}