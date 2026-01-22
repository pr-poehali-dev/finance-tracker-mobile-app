-- Добавление колонки для хранения первоначальной суммы бюджета (до трат)
ALTER TABLE t_p6400114_finance_tracker_mobi.planning_deposits 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;