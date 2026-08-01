CREATE TABLE subscriptions (
                               user_id                 BIGINT PRIMARY KEY REFERENCES users(id),
                               paddle_subscription_id  TEXT,
                               paddle_customer_id      TEXT,
                               status                  TEXT,
                               price_id                TEXT,
                               product_id              TEXT,
                               updated_at              TIMESTAMPTZ
);