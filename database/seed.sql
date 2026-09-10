-- =========================================================
-- FinTrack Seed Data
-- Default system categories (user_id = NULL, is_default = true)
-- Run AFTER schema.sql
-- =========================================================

INSERT INTO categories (name, type, is_default) VALUES
  ('Salary', 'income', true),
  ('Pension', 'income', true),
  ('Business', 'income', true),
  ('Interest', 'income', true),
  ('Investment', 'income', true),
  ('Rental', 'income', true),
  ('Other', 'income', true),
  ('Food', 'expense', true),
  ('Groceries', 'expense', true),
  ('Housing', 'expense', true),
  ('Transportation', 'expense', true),
  ('Utilities', 'expense', true),
  ('Healthcare', 'expense', true),
  ('Education', 'expense', true),
  ('Shopping', 'expense', true),
  ('Entertainment', 'expense', true),
  ('Travel', 'expense', true),
  ('Insurance', 'expense', true),
  ('EMI/Loans', 'expense', true),
  ('Personal', 'expense', true),
  ('Other', 'expense', true)
ON CONFLICT DO NOTHING;

-- Demo user: demo@fintrack.app / Demo@1234
-- (password_hash below corresponds to bcrypt hash of "Demo@1234")
INSERT INTO users (id, name, email, password_hash, currency)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Demo User',
  'demo@fintrack.app',
  '$2b$10$CwTycUXWue0Thq9StjUM0uJ8Rw3nfz5Q1EYQ0/f9r/Fq3kzE9v9WK',
  'INR'
) ON CONFLICT (email) DO NOTHING;
