CREATE TABLE agent_follow_up_messages (
                                          id BIGSERIAL PRIMARY KEY,
                                          agent_result_id BIGINT NOT NULL REFERENCES agent_results(id) ON DELETE CASCADE,
                                          role TEXT NOT NULL,
                                          content TEXT NOT NULL,
                                          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_follow_up_messages_agent_result_id
    ON agent_follow_up_messages(agent_result_id);