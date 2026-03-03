CREATE TABLE t_p6400114_finance_tracker_mobi.credits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p6400114_finance_tracker_mobi.users(id),
  title VARCHAR(255) NOT NULL,
  total_debt NUMERIC(12,2) NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL,
  monthly_payment NUMERIC(12,2) NOT NULL,
  payment_day INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);