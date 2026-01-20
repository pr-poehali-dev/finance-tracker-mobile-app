-- Устанавливаем значение по умолчанию для google_id
ALTER TABLE users ALTER COLUMN google_id SET DEFAULT '';

-- Обновляем существующие NULL значения
UPDATE users SET google_id = '' WHERE google_id IS NULL;