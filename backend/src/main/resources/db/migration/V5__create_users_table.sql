CREATE TABLE users (
                       id BIGSERIAL PRIMARY KEY,
                       github_id BIGINT NOT NULL UNIQUE,
                       username VARCHAR(255) NOT NULL,
                       avatar_url VARCHAR(512),
                       github_access_token VARCHAR(512) NOT NULL,
                       created_at TIMESTAMP NOT NULL DEFAULT now(),
                       updated_at TIMESTAMP NOT NULL DEFAULT now()
);