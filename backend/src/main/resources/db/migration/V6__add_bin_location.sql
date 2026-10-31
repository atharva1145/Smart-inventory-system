-- ============================================================
-- V6__add_bin_location.sql: Warehouse Bin / Shelf Location
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS bin_location VARCHAR(50);
ALTER TABLE inventory_balances ADD COLUMN IF NOT EXISTS bin_location VARCHAR(50);
