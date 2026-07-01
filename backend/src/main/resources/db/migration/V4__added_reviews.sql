CREATE TABLE reviews (
                         id          BIGSERIAL PRIMARY KEY,
                         repo_id     BIGINT NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
                         pr_url      TEXT NOT NULL,
                         pr_number   INT,
                         pr_title    TEXT,
                         status      TEXT NOT NULL DEFAULT 'PENDING',
                         created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                         completed_at TIMESTAMPTZ
);

CREATE INDEX idx_reviews_repo_id ON reviews(repo_id);

CREATE TABLE agent_results (
                               id           BIGSERIAL PRIMARY KEY,
                               review_id    BIGINT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
                               agent        TEXT NOT NULL,
                               status       TEXT NOT NULL DEFAULT 'PENDING',
                               findings     TEXT,
                               severity     TEXT,
                               created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                               completed_at TIMESTAMPTZ
);

CREATE INDEX idx_agent_results_review_id ON agent_results(review_id);