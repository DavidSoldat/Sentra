CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE repos (
                       id          BIGSERIAL PRIMARY KEY,
                       url         TEXT NOT NULL UNIQUE,
                       name        TEXT NOT NULL,
                       status      TEXT NOT NULL DEFAULT 'PENDING',
                       indexed_at  TIMESTAMPTZ,
                       created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE code_chunks (
                             id          BIGSERIAL PRIMARY KEY,
                             repo_id     BIGINT NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
                             file_path   TEXT NOT NULL,
                             content     TEXT NOT NULL,
                             embedding   vector(384),
                             start_line  INT,
                             end_line    INT,
                             created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_code_chunks_embedding
    ON code_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX idx_code_chunks_repo_id ON code_chunks(repo_id);

CREATE TABLE questions (
                           id          BIGSERIAL PRIMARY KEY,
                           repo_id     BIGINT NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
                           question    TEXT NOT NULL,
                           answer      TEXT,
                           created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);