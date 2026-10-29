# Testing Strategy & Concurrency Verification

## 1. Testing Philosophy

The test suite is structured into two complementary tiers:
1. **Unit Tests (`com.smartinventory.unit.*`)**: Fast, isolated, deterministic validation of domain mathematical calculations, status state machine rules, and edge condition handling.
2. **Integration Tests (`com.smartinventory.integration.*`)**: Full-context Spring Boot tests running against an active relational schema (Flyway migrated), exercising the end-to-end security pipeline, JPA repositories, transactional boundaries, and multi-threaded race conditions.

---

## 2. Test Suites Summary

| Test Class | Focus | Test Count | Status |
|---|---|---|---|
| `OrderStatusTransitionTest` | Order lifecycle state machine valid/invalid transitions | 7 | PASS |
| `OrderCalculationTest` | Line item arithmetic, discounts, monetary precision | 3 | PASS |
| `GoodsReceiptCalculationTest` | PO outstanding quantities, partial receipt bounds | 2 | PASS |
| `AuthIntegrationTest` | JWT login, role enforcement, unauthorized rejections | 5 | PASS |
| `ProductAndInventoryIntegrationTest` | Catalog CRUD, non-negative inventory check, stock adjustments | 3 | PASS |
| `OrderLifecycleIntegrationTest` | Order submission, stock reservation, cancellation, idempotency | 3 | PASS |
| `GoodsReceiptIntegrationTest` | Receiving shipments, atomic on-hand increments, over-receipt rejection | 2 | PASS |
| **`InventoryConcurrencyIntegrationTest`** | **Multi-threaded oversell race conditions, deadlock elimination, double cancellation** | **3** | **PASS** |
| **Total** | | **28** | **100% PASS** |

---

## 3. Deep Dive: Concurrency & Oversell Verification

The most critical test in the application is `InventoryConcurrencyIntegrationTest.testConcurrentOrdersForLastStockUnit`.

### The Race Condition Setup
```java
// Product has physical on_hand = 1, reserved = 0, available = 1
InventoryBalance balance = new InventoryBalance(product, warehouse, 1, 0);
balanceRepository.save(balance);

int threadCount = 2;
ExecutorService executor = Executors.newFixedThreadPool(threadCount);
CountDownLatch startGate = new CountDownLatch(1);
CountDownLatch doneLatch = new CountDownLatch(threadCount);

AtomicInteger successCount = new AtomicInteger(0);
AtomicInteger insufficientStockCount = new AtomicInteger(0);
```

### Concurrent Execution
Two independent worker threads construct order requests for 1 unit each.
Both threads wait on `startGate.await()`.
When `startGate.countDown()` fires, both threads simultaneously invoke `orderService.createOrder(...)`.

### Expected & Verified Invariants
1. **Exactly One Winner**: `assertEquals(1, successCount.get())`.
2. **Graceful Rejection**: The second thread throws `InsufficientStockException` rather than an unhandled 500 database lock exception: `assertEquals(1, insufficientStockCount.get())`.
3. **Database Invariants Preserved**:
   - `finalBalance.getOnHandQuantity() == 1`
   - `finalBalance.getReservedQuantity() == 1`
   - `finalBalance.getAvailableQuantity() == 0`
   - `finalBalance.getAvailableQuantity() >= 0` (Zero negative stock under any load).
4. **Audit Consistency**: Exactly 1 `ORDER_RESERVED` movement record is persisted.

---

## 4. Multi-Product Deadlock Avoidance Test

`testDeadlockFreeMultiProductConcurrency`:
- Thread 1 & 3 submit orders requesting: `[Product A, Product B]`
- Thread 2 & 4 submit orders requesting: `[Product B, Product A]`
- **Without lock sorting**: A cyclic dependency (`Thread 1 holds A, waits for B; Thread 2 holds B, waits for A`) causes a PostgreSQL/H2 deadlock exception (`DeadlockLoserDataAccessException`).
- **With deterministic sort**: Both threads sort requested product IDs in ascending numerical order (`A` then `B`) prior to acquiring pessimistic row locks.
- **Result**: All 4 orders complete concurrently in under 1 second with 0 deadlocks.

---

## 5. Running the Tests

### Execute All Tests
```bash
cd backend
./mvnw clean test
# On Windows:
# mvnw.cmd clean test
```

### Run Concurrency Suite Only
```bash
cd backend
./mvnw test -Dtest=InventoryConcurrencyIntegrationTest
```

### Run Unit Tests Only
```bash
cd backend
./mvnw test -Dtest=*CalculationTest,*TransitionTest
```
