-- ============================================================
-- V5__product_images_and_bulk.sql
-- Add product visual image URL
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
