package com.sentra.backend.agent;

import com.sentra.backend.review.enums.AgentType;
import com.sentra.backend.review.enums.SeverityStatus;


public record AgentResult(
        AgentType agentType,
        String findings,
        SeverityStatus severity
) {}