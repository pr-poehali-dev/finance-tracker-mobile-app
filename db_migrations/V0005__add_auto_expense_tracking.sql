-- Таблица для отслеживания автоматически созданных расходов из фиксированных платежей
CREATE TABLE auto_created_expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    fixed_expense_id INTEGER NOT NULL REFERENCES fixed_expenses(id),
    expense_id INTEGER NOT NULL REFERENCES expenses(id),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fixed_expense_id, year, month)
);

CREATE INDEX idx_auto_created_expenses_user_id ON auto_created_expenses(user_id);
CREATE INDEX idx_auto_created_expenses_year_month ON auto_created_expenses(year, month);