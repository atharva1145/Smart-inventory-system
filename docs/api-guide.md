# REST API Guide & Specification

All API endpoints follow RESTful conventions, return JSON, and are mounted beneath the base path:
`http://localhost:8080/api/v1`

Interactive OpenAPI / Swagger UI documentation is available at:
`http://localhost:8080/swagger-ui.html`

Raw OpenAPI JSON specification:
`http://localhost:8080/v3/api-docs`

---

## 1. Response Envelope Format

### Successful Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8,
    "first": true,
    "last": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Insufficient stock for SKU 'LAPTOP-PRO-15'. Requested: 2, Available: 1",
  "data": null,
  "timestamp": "2026-10-29T10:15:30Z"
}
```

---

## 2. Authentication & Authorization

All endpoints (except `/auth/login`, Swagger, Actuator) require a valid JWT token in the `Authorization` header:
`Authorization: Bearer <jwt-token>`

### Endpoints
- `POST /api/v1/auth/login`
  - Body: `{"username": "admin", "password": "Password@123"}`
  - Response: `{ "token": "...", "type": "Bearer", "username": "admin", "role": "ADMIN", "fullName": "System Administrator" }`
- `GET /api/v1/auth/me`
  - Returns the authenticated user's profile and active role permissions.

---

## 3. Product & Inventory Endpoints

### Products
- `GET /api/v1/products` — Paginated list with `search`, `categoryId`, `isActive`, `lowStockOnly` query parameters.
- `GET /api/v1/products/{id}` — Retrieve detailed product attributes.
- `POST /api/v1/products` — *(ADMIN, INVENTORY_MANAGER)* Create new product. Validates unique SKU and non-negative pricing.
- `PUT /api/v1/products/{id}` — *(ADMIN, INVENTORY_MANAGER)* Update product information.
- `DELETE /api/v1/products/{id}` — Deactivates product (soft delete) to preserve historical data integrity.

### Inventory & Stock Adjustments
- `GET /api/v1/inventory/balances` — View on-hand, reserved, and available stock across products and warehouses.
- `POST /api/v1/inventory/adjustments` — *(ADMIN, INVENTORY_MANAGER)* Record physical stock count adjustments.
  - Body:
    ```json
    {
      "productId": 1,
      "warehouseId": 1,
      "quantityChange": 5,
      "reason": "Cycle count adjustment after annual physical audit"
    }
    ```
- `GET /api/v1/inventory/movements` — Immutable audit log of all historical inventory movements with actor and reference ID.
- `GET /api/v1/inventory/low-stock` — Products where `onHandQuantity <= reorderLevel`.

---

## 4. Order Management Endpoints

- `POST /api/v1/orders` — *(SALES_STAFF, ADMIN)* Create and submit customer order with concurrency-safe stock reservation.
  - Header (Optional): `X-Idempotency-Key: <unique-uuid>`
  - Body:
    ```json
    {
      "customerId": 1,
      "warehouseId": 1,
      "discountAmount": 10.00,
      "idempotencyKey": "IDEMP-94a821bb",
      "items": [
        { "productId": 1, "quantity": 2 },
        { "productId": 2, "quantity": 1 }
      ],
      "notes": "Deliver to shipping dock 3"
    }
    ```
- `GET /api/v1/orders` — List orders with filters (`search`, `status`, `customerId`, pagination).
- `GET /api/v1/orders/{id}` — Retrieve order line items, pricing snapshots, and status transition history.
- `PATCH /api/v1/orders/{id}/status` — Advance status according to the business state machine:
  - Allowed: `PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`.
  - Body: `{"status": "CONFIRMED", "comment": "Payment verified via invoice #INV-4921"}`
- `POST /api/v1/orders/{id}/cancel` — Cancel eligible order (`PENDING`, `CONFIRMED`, `PROCESSING`) and automatically release reserved stock.

---

## 5. Purchase Orders & Goods Receipts

- `GET /api/v1/purchase-orders` — List supplier purchase orders.
- `POST /api/v1/purchase-orders` — *(INVENTORY_MANAGER, ADMIN)* Issue PO to supplier.
- `PATCH /api/v1/purchase-orders/{id}/approve` — Approve PO for supplier fulfillment.
- `POST /api/v1/goods-receipts` — *(INVENTORY_MANAGER, ADMIN)* Receive physical shipment from supplier.
  - Body:
    ```json
    {
      "purchaseOrderId": 1,
      "warehouseId": 1,
      "items": [
        { "productId": 1, "quantityReceived": 25 }
      ],
      "notes": "Delivered via freight carrier tracking #1Z9999"
    }
    ```
  - **Invariant**: Atomically increments `onHandQuantity`, records `PURCHASE_RECEIPT` movement, and advances PO to `PARTIALLY_RECEIVED` or `RECEIVED`. Rejects over-deliveries with HTTP 400.

---

## 6. Dashboard & Reporting

- `GET /api/v1/dashboard/summary` — High-level SMB metrics (Total Inventory Value, Low Stock Count, Active Orders, Revenue).
- `GET /api/v1/dashboard/sales-trend?days=30` — Daily order sales trend aggregation.
- `GET /api/v1/dashboard/top-selling?limit=5` — Top performing products by units sold.
- `GET /api/v1/dashboard/valuation` — Detailed inventory valuation by cost price and potential sales value.
