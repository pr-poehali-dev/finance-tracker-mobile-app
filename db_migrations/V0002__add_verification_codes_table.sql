-- Таблица для хранения кодов верификации
CREATE TABLE IF NOT EXISTS verification_codes (
    email VARCHAR(255) PRIMARY KEY,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для автоматической очистки истекших кодов
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at);

-- Добавляем уникальность email в users (если ещё нет)
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);