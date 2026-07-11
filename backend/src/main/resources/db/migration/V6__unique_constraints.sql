ALTER TABLE repos ADD COLUMN user_id BIGINT;

UPDATE repos SET user_id = 1;

ALTER TABLE repos ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE repos ADD CONSTRAINT fk_repos_user FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE repos DROP CONSTRAINT repos_url_key;
ALTER TABLE repos ADD CONSTRAINT uq_repos_user_url UNIQUE (user_id, url);