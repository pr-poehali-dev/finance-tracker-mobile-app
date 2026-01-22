-- Создание таблицы для истории пополнений целей планирования
CREATE TABLE IF NOT EXISTS t_p6400114_finance_tracker_mobi.planning_deposits (
    id SERIAL PRIMARY KEY,
    planning_id INTEGER NOT NULL REFERENCES t_p6400114_finance_tracker_mobi.planning(id),
    amount NUMERIC(10, 2) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска по planning_id
CREATE INDEX IF NOT EXISTS idx_planning_deposits_planning_id ON t_p6400114_finance_tracker_mobi.planning_deposits(planning_id);