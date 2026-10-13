CREATE TABLE fill_ups (
    id BIGSERIAL PRIMARY KEY,
    filled_at DATE NOT NULL,
    station_name VARCHAR(120) NOT NULL,
    fuel_type VARCHAR(32) NOT NULL,
    price_per_liter NUMERIC(8, 3) NOT NULL CHECK (price_per_liter > 0),
    liters NUMERIC(8, 3) NOT NULL CHECK (liters > 0),
    total_paid NUMERIC(10, 2) NOT NULL CHECK (total_paid > 0),
    odometer_km INTEGER NOT NULL CHECK (odometer_km > 0),
    full_tank BOOLEAN NOT NULL
);

CREATE INDEX idx_fill_ups_odometer ON fill_ups (odometer_km);
CREATE INDEX idx_fill_ups_filled_at ON fill_ups (filled_at DESC);

CREATE TABLE ledger_entries (
    id BIGSERIAL PRIMARY KEY,
    entry_date DATE NOT NULL,
    description VARCHAR(160) NOT NULL,
    category VARCHAR(60) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    kind VARCHAR(16) NOT NULL CHECK (kind IN ('REVENUE', 'EXPENSE'))
);

CREATE INDEX idx_ledger_entries_date ON ledger_entries (entry_date DESC);
