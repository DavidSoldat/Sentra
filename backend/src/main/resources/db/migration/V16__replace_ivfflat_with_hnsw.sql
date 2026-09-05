DROP INDEX IF EXISTS idx_code_chunks_embedding;
CREATE INDEX idx_code_chunks_embedding
    ON code_chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_questions_repo_id ON questions(repo_id);