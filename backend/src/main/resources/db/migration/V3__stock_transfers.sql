-- ============================================================
-- V3__stock_transfers.sql: Inter-Warehouse Stock Transfers
-- Cross-compatible standard ANSI SQL (PostgreSQL & H2)
-- ============================================================

-- Secondary Warehouse for Transfers
INSERT INTO warehouses (code, name, address, is_active, created_at, updated_at)
SELECT 'WH-WEST', 'West Coast Fulfillment Center', '750 Pacific Logistics Blvd, Dock 12', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'WH-WEST');

-- Stock Transfers Table
CREATE TABLE IF NOT EXISTS stock_transfers (
    id BIGSERIAL PRIMARY KEY,
    transfer_number VARCHAR(50) NOT NULL UNIQUE,
    source_warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),
    destination_warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),
    status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED',
    notes TEXT,
    created_by VARCHAR(50) NOT NULL,
    dispatched_by VARCHAR(50),
    received_by VARCHAR(50),
    dispatched_at TIMESTAMP,
    received_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON stock_transfers(status);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_source ON stock_transfers(source_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_dest ON stock_transfers(destination_warehouse_id);

-- Stock Transfer Items Table
CREATE TABLE IF NOT EXISTS stock_transfer_items (
    id BIGSERIAL PRIMARY KEY,
    stock_transfer_id BIGINT NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity INT NOT NULL CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_transfer_items_transfer ON stock_transfer_items(stock_transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_items_product ON stock_transfer_items(product_id);
