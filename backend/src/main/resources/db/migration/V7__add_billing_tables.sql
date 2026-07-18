ALTER TABLE users ADD COLUMN tier VARCHAR(20) NOT NULL DEFAULT 'FREE';

CREATE TABLE usage_tracking (
                                user_id BIGINT PRIMARY KEY REFERENCES users(id),
                                period_start DATE NOT NULL,
                                questions_used INT NOT NULL DEFAULT 0,
                                reviews_used INT NOT NULL DEFAULT 0
);