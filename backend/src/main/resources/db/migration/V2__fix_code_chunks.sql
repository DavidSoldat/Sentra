DROP TABLE IF EXISTS code_chunks;

CREATE TABLE code_chunks (
                             embedding_id UUID PRIMARY KEY,
                             embedding    vector(384),
                             text         TEXT,
                             metadata     JSONB
);

CREATE INDEX idx_code_chunks_embedding
    ON code_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX idx_code_chunks_metadata_repo_id
    ON code_chunks ((metadata->>'repo_id'));