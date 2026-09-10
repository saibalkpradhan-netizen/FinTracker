-- =========================================================
-- FinTrack PostgreSQL Schema
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------
-- USERS
-- ---------------------------------------------------------
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(120) NOT NULL,
    email           VARCHAR(180) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    currency        VARCHAR(10) NOT NULL DEFAULT 'INR',
    monthly_savings_target NUMERIC(14,2) DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- CATEGORIES  (default + user-created custom categories)
-- ---------------------------------------------------------
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = system default category
    name        VARCHAR(80) NOT NULL,
    type        VARCHAR(10) NOT NULL CHECK (type IN ('income','expense')),
    is_default  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, name, type)
);
CREATE INDEX idx_categories_user_id ON categories(user_id);

-- ---------------------------------------------------------
-- TRANSACTIONS (income + expense records)
-- ---------------------------------------------------------
CREATE TABLE transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    type            VARCHAR(10) NOT NULL CHECK (type IN ('income','expense')),
    amount          NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    date            DATE NOT NULL,
    description     VARCHAR(255),
    payment_method  VARCHAR(50),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_user_type_date ON transactions(user_id, type, date);

-- ---------------------------------------------------------
-- BUDGETS (monthly, category-wise)
-- ---------------------------------------------------------
CREATE TABLE budgets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month           SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year            SMALLINT NOT NULL,
    amount          NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    alert_threshold_pct SMALLINT NOT NULL DEFAULT 80 CHECK (alert_threshold_pct BETWEEN 1 AND 100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, category_id, month, year)
);
CREATE INDEX idx_budgets_user_month_year ON budgets(user_id, month, year);

-- ---------------------------------------------------------
-- SAVINGS (monthly rollups; also derivable from transactions,
-- stored for fast reporting + custom monthly targets)
-- ---------------------------------------------------------
CREATE TABLE savings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month           SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year            SMALLINT NOT NULL,
    total_income    NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_expenses  NUMERIC(14,2) NOT NULL DEFAULT 0,
    savings_amount  NUMERIC(14,2) GENERATED ALWAYS AS (total_income - total_expenses) STORED,
    target_amount   NUMERIC(14,2) DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, month, year)
);

-- ---------------------------------------------------------
-- FINANCIAL GOALS
-- ---------------------------------------------------------
CREATE TABLE financial_goals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(120) NOT NULL,
    goal_type       VARCHAR(30) NOT NULL DEFAULT 'other'
                    CHECK (goal_type IN ('emergency_fund','car','home','education','vacation','retirement','other')),
    target_amount   NUMERIC(14,2) NOT NULL CHECK (target_amount > 0),
    current_amount  NUMERIC(14,2) NOT NULL DEFAULT 0,
    target_date     DATE,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_goals_user_id ON financial_goals(user_id);

-- ---------------------------------------------------------
-- ALERTS
-- ---------------------------------------------------------
CREATE TABLE alerts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(40) NOT NULL CHECK (type IN
                ('budget_warning','budget_exceeded','low_savings','goal_deadline','unusual_spending','monthly_report')),
    title       VARCHAR(150) NOT NULL,
    message     TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT false,
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_user_unread ON alerts(user_id, is_read);

-- ---------------------------------------------------------
-- updated_at auto-touch trigger
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_savings_updated_at BEFORE UPDATE ON savings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_goals_updated_at BEFORE UPDATE ON financial_goals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
