-- ============================================================
-- V2__seed_reference_data.sql: Baseline Reference Data
-- Cross-compatible standard ANSI SQL (PostgreSQL & H2)
-- ============================================================

-- Default Main Warehouse
INSERT INTO warehouses (code, name, address, is_active, created_at, updated_at)
SELECT 'WH-MAIN', 'Central Distribution Center', '100 Logistics Way, Industrial Park, Suite 4', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'WH-MAIN');

-- Base Product Categories
INSERT INTO categories (name, description, created_at, updated_at)
SELECT 'Electronics', 'Electronic devices, accessories, and components', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Electronics');

INSERT INTO categories (name, description, created_at, updated_at)
SELECT 'Office Supplies', 'Paper, stationery, printers, and desktop essentials', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Office Supplies');

INSERT INTO categories (name, description, created_at, updated_at)
SELECT 'Hardware & Tools', 'Tools, fasteners, and maintenance supplies', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Hardware & Tools');

INSERT INTO categories (name, description, created_at, updated_at)
SELECT 'Packaging & Shipping', 'Boxes, tape, envelopes, and shipping materials', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Packaging & Shipping');

INSERT INTO categories (name, description, created_at, updated_at)
SELECT 'Safety Equipment', 'Personal protective equipment, first aid, and safety gear', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Safety Equipment');
