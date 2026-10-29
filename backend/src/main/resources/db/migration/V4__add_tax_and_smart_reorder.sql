-- ============================================================
-- V4__add_tax_and_smart_reorder.sql: Order Tax Breakdown Support
-- Cross-compatible standard ANSI SQL (PostgreSQL & H2)
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12, 2) DEFAULT 0.00;
