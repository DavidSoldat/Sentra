DROP INDEX IF EXISTS idx_code_chunks_embedding;
CREATE INDEX idx_code_chunks_embedding
    ON code_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 1);