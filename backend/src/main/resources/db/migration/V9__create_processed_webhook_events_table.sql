CREATE TABLE processed_webhook_events (
                                          event_id      TEXT PRIMARY KEY,
                                          processed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);