# Database Design & Schema Specification

## 1. Relational Database Overview

- **Engine**: PostgreSQL 16 (H2 2.2+ used in PostgreSQL compatibility mode for unit/integration tests).
- **Migration Engine**: Flyway (`db/migration/V1__init_schema.sql`, `db/migration/V2__seed_reference_data.sql`).
- **Naming Conventions**: Snake-case table and column names (`snake_case`), singular table concepts or plural table names (`products`, `orders`), explicit foreign keys (`product_id`, `warehouse_id`).

---

## 2. Table Catalog & Schema Definitions

### 2.1 Core Authentication & Access Control
- **`users`**:
  - `id` (BIGSERIAL, PK)
  - `username` (VARCHAR(50), UNIQUE, NOT NULL)
  - `email` (VARCHAR(100), UNIQUE, NOT NULL)
  - `password_hash` (VARCHAR(255), NOT NULL)
  - `full_name` (VARCHAR(100), NOT NULL)
  - `role` (VARCHAR(30), NOT NULL) — Enum: `ADMIN`, `INVENTORY_MANAGER`, `SALES_STAFF`, `VIEWER`
  - `is_active` (BOOLEAN, DEFAULT TRUE)
  - `created_at`, `updated_at` (TIMESTAMP)

### 2.2 Catalog & Locations
- **`categories`**:
  - `id` (BIGSERIAL, PK)
  - `name` (VARCHAR(100), UNIQUE, NOT NULL)
  - `description` (TEXT)
  - `created_at`, `updated_at` (TIMESTAMP)

- **`warehouses`**:
  - `id` (BIGSERIAL, PK)
  - `code` (VARCHAR(50), UNIQUE, NOT NULL) — e.g. `WH-MAIN`
  - `name` (VARCHAR(100), NOT NULL)
  - `address` (VARCHAR(255))
  - `is_active` (BOOLEAN, DEFAULT TRUE)
  - `created_at`, `updated_at` (TIMESTAMP)

- **`products`**:
  - `id` (BIGSERIAL, PK)
  - `sku` (VARCHAR(100), UNIQUE, NOT NULL) — Indexed
  - `name` (VARCHAR(150), NOT NULL)
  - `description` (TEXT)
  - `category_id` (BIGINT, FK -> `categories.id`)
  - `cost_price` (NUMERIC(12, 2), NOT NULL, CHECK >= 0)
  - `selling_price` (NUMERIC(12, 2), NOT NULL, CHECK >= 0)
  - `reorder_level` (INT, DEFAULT 10, CHECK >= 0)
  - `unit_of_measure` (VARCHAR(30), DEFAULT 'UNIT')
  - `is_active` (BOOLEAN, DEFAULT TRUE)
  - `created_at`, `updated_at` (TIMESTAMP)

### 2.3 Inventory Balances & Movement Ledger
- **`inventory_balances`**:
  - `id` (BIGSERIAL, PK)
  - `product_id` (BIGINT, FK -> `products.id`, NOT NULL)
  - `warehouse_id` (BIGINT, FK -> `warehouses.id`, NOT NULL)
  - `on_hand_quantity` (INT, NOT NULL, DEFAULT 0, CHECK >= 0)
  - `reserved_quantity` (INT, NOT NULL, DEFAULT 0, CHECK >= 0)
  - `created_at`, `updated_at` (TIMESTAMP)
  - **Constraint**: `UNIQUE(product_id, warehouse_id)`
  - **Virtual Available Stock**: Calculated dynamically as `(on_hand_quantity - reserved_quantity)`.

- **`inventory_movements` (Immutable Ledger)**:
  - `id` (BIGSERIAL, PK)
  - `product_id` (BIGINT, FK -> `products.id`, NOT NULL)
  - `warehouse_id` (BIGINT, FK -> `warehouses.id`, NOT NULL)
  - `movement_type` (VARCHAR(40), NOT NULL) — `PURCHASE_RECEIPT`, `ORDER_RESERVED`, `ORDER_FULFILLED`, `ORDER_CANCELLED`, `STOCK_ADJUSTMENT`
  - `quantity_change` (INT, NOT NULL) — Signed integer (+ for increase, - for decrease)
  - `reference_id` (VARCHAR(100)) — e.g. `ORD-20261029-001`, `PO-001`, `ADJ-102`
  - `actor_username` (VARCHAR(50), NOT NULL)
  - `reason` (VARCHAR(255))
  - `created_at` (TIMESTAMP, NOT NULL)
  - *No updates or deletes are permitted against this table.*

### 2.4 Customers & Sales Orders
- **`customers`**:
  - `id` (BIGSERIAL, PK)
  - `name` (VARCHAR(150), NOT NULL)
  - `email` (VARCHAR(100))
  - `phone` (VARCHAR(30))
  - `address` (TEXT)
  - `is_active` (BOOLEAN, DEFAULT TRUE)
  - `created_at`, `updated_at` (TIMESTAMP)

- **`orders`**:
  - `id` (BIGSERIAL, PK)
  - `order_number` (VARCHAR(50), UNIQUE, NOT NULL) — Indexed
  - `customer_id` (BIGINT, FK -> `customers.id`, NOT NULL)
  - `warehouse_id` (BIGINT, FK -> `warehouses.id`, NOT NULL)
  - `status` (VARCHAR(30), NOT NULL) — `DRAFT`, `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`
  - `subtotal` (NUMERIC(12, 2), NOT NULL)
  - `discount_amount` (NUMERIC(12, 2), DEFAULT 0.00)
  - `total_amount` (NUMERIC(12, 2), NOT NULL)
  - `idempotency_key` (VARCHAR(100), UNIQUE)
  - `notes` (TEXT)
  - `created_by` (VARCHAR(50))
  - `created_at`, `updated_at` (TIMESTAMP)

- **`order_items`**:
  - `id` (BIGSERIAL, PK)
  - `order_id` (BIGINT, FK -> `orders.id`, NOT NULL)
  - `product_id` (BIGINT, FK -> `products.id`, NOT NULL)
  - `quantity` (INT, NOT NULL, CHECK > 0)
  - `unit_price` (NUMERIC(12, 2), NOT NULL) — Preserved historical snapshot
  - `total_price` (NUMERIC(12, 2), NOT NULL)

- **`order_status_history`**:
  - `id` (BIGSERIAL, PK)
  - `order_id` (BIGINT, FK -> `orders.id`, NOT NULL)
  - `previous_status` (VARCHAR(30))
  - `new_status` (VARCHAR(30), NOT NULL)
  - `comment` (VARCHAR(255))
  - `actor_username` (VARCHAR(50), NOT NULL)
  - `created_at` (TIMESTAMP NOT NULL)

### 2.5 Suppliers, Purchase Orders & Receipts
- **`suppliers`**:
  - `id` (BIGSERIAL, PK)
  - `name` (VARCHAR(150), NOT NULL)
  - `contact_person` (VARCHAR(100))
  - `email` (VARCHAR(100))
  - `phone` (VARCHAR(30))
  - `address` (TEXT)
  - `is_active` (BOOLEAN, DEFAULT TRUE)
  - `created_at`, `updated_at` (TIMESTAMP)

- **`purchase_orders`**:
  - `id` (BIGSERIAL, PK)
  - `po_number` (VARCHAR(50), UNIQUE, NOT NULL)
  - `supplier_id` (BIGINT, FK -> `suppliers.id`, NOT NULL)
  - `status` (VARCHAR(30), NOT NULL) — `DRAFT`, `APPROVED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED`
  - `expected_delivery_date` (DATE)
  - `total_cost` (NUMERIC(12, 2), NOT NULL)
  - `notes` (TEXT)
  - `created_by` (VARCHAR(50))
  - `created_at`, `updated_at` (TIMESTAMP)

- **`purchase_order_items`**:
  - `id` (BIGSERIAL, PK)
  - `purchase_order_id` (BIGINT, FK -> `purchase_orders.id`, NOT NULL)
  - `product_id` (BIGINT, FK -> `products.id`, NOT NULL)
  - `ordered_quantity` (INT, NOT NULL, CHECK > 0)
  - `received_quantity` (INT, NOT NULL, DEFAULT 0, CHECK >= 0)
  - `unit_cost` (NUMERIC(12, 2), NOT NULL)
  - `total_cost` (NUMERIC(12, 2), NOT NULL)

- **`goods_receipts`**:
  - `id` (BIGSERIAL, PK)
  - `receipt_number` (VARCHAR(50), UNIQUE, NOT NULL)
  - `purchase_order_id` (BIGINT, FK -> `purchase_orders.id`, NOT NULL)
  - `warehouse_id` (BIGINT, FK -> `warehouses.id`, NOT NULL)
  - `received_by` (VARCHAR(50), NOT NULL)
  - `notes` (TEXT)
  - `received_at` (TIMESTAMP, NOT NULL)

- **`goods_receipt_items`**:
  - `id` (BIGSERIAL, PK)
  - `goods_receipt_id` (BIGINT, FK -> `goods_receipts.id`, NOT NULL)
  - `product_id` (BIGINT, FK -> `products.id`, NOT NULL)
  - `quantity_received` (INT, NOT NULL, CHECK > 0)

### 2.6 System Alerts & Audit
- **`notifications`**: System low-stock alerts and operational events.
- **`audit_logs`**: Security events (logins, privilege escalations, entity mutations).

---

## 3. Indexing Strategy
To guarantee fast lookups under production volume:
- `products(sku)`: Unique index for instant SKU lookups.
- `inventory_balances(product_id, warehouse_id)`: Unique compound index supporting row-level lock lookups.
- `inventory_movements(product_id, created_at)`: Compound index for chronological audit timeline rendering.
- `orders(order_number)`: Unique index.
- `orders(customer_id, status)`: B-Tree index for customer order history filters.
- `purchase_orders(po_number)`: Unique index.
