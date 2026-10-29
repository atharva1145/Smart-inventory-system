package com.smartinventory.integration;

import com.smartinventory.common.exception.InsufficientStockException;
import com.smartinventory.customer.Customer;
import com.smartinventory.customer.CustomerRepository;
import com.smartinventory.inventory.InventoryBalance;
import com.smartinventory.inventory.InventoryBalanceRepository;
import com.smartinventory.inventory.InventoryMovement;
import com.smartinventory.inventory.InventoryMovementRepository;
import com.smartinventory.order.Order;
import com.smartinventory.order.OrderRepository;
import com.smartinventory.order.OrderService;
import com.smartinventory.order.OrderStatus;
import com.smartinventory.order.dto.CreateOrderItemRequest;
import com.smartinventory.order.dto.CreateOrderRequest;
import com.smartinventory.order.dto.OrderDTO;
import com.smartinventory.product.Product;
import com.smartinventory.product.ProductRepository;
import com.smartinventory.warehouse.Warehouse;
import com.smartinventory.warehouse.WarehouseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("CRITICAL REQUIREMENT: Concurrency-Safe Stock Reservation & Deadlock Prevention")
class InventoryConcurrencyIntegrationTest {

    private static final Logger log = LoggerFactory.getLogger(InventoryConcurrencyIntegrationTest.class);

    @Autowired
    private OrderService orderService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private InventoryBalanceRepository balanceRepository;

    @Autowired
    private InventoryMovementRepository movementRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private OrderRepository orderRepository;

    private Warehouse warehouse;
    private Customer customerA;
    private Customer customerB;

    @BeforeEach
    void setUp() {
        warehouse = warehouseRepository.findByCode("WH-MAIN")
                .orElseGet(() -> warehouseRepository.save(new Warehouse("WH-MAIN", "Central Depot", "100 Industrial Pkwy")));

        customerA = customerRepository.save(new Customer("Customer Alpha", "alpha@test.local", "+1-555-1001", "100 Alpha St"));
        customerB = customerRepository.save(new Customer("Customer Beta", "beta@test.local", "+1-555-1002", "200 Beta St"));
    }

    /**
     * CRITICAL TEST SCENARIO:
     * 1. Product has EXACTLY 1 unit available.
     * 2. Customer A and Customer B submit orders concurrently for that 1 unit.
     * 3. Synchronized via CountDownLatch to strike database simultaneously.
     * 4. Exactly one order must succeed.
     * 5. The other order must fail with InsufficientStockException.
     * 6. Final available stock must be 0 and NEVER negative.
     * 7. The failed transaction rolls back completely without leaving partial records.
     */
    @Test
    @DisplayName("Two concurrent order requests for the last 1 stock unit: exactly 1 wins, 1 fails gracefully, stock never negative")
    void testConcurrentOrdersForLastStockUnit() throws Exception {
        String sku = "SKU-RACE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Product product = productRepository.save(new Product(
                sku, "Limited Edition Barcode Scanner", "Rare unit",
                null, new BigDecimal("50.00"), new BigDecimal("99.00"), 5, "UNIT"
        ));

        // Exactly 1 unit in stock
        balanceRepository.save(new InventoryBalance(product, warehouse, 1, 0));

        int numberOfThreads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch readyLatch = new CountDownLatch(numberOfThreads);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger insufficientStockCount = new AtomicInteger(0);
        List<OrderDTO> createdOrders = Collections.synchronizedList(new ArrayList<>());
        List<Throwable> exceptions = Collections.synchronizedList(new ArrayList<>());

        // Thread 1: Customer A ordering 1 unit
        executor.submit(() -> {
            readyLatch.countDown();
            try {
                startGate.await(); // Synchronize strike time
                CreateOrderRequest req = new CreateOrderRequest();
                req.setCustomerId(customerA.getId());
                req.setWarehouseId(warehouse.getId());
                req.setItems(List.of(new CreateOrderItemRequest(product.getId(), 1)));

                OrderDTO order = orderService.createOrder(req, "customer_a");
                createdOrders.add(order);
                successCount.incrementAndGet();
            } catch (InsufficientStockException e) {
                insufficientStockCount.incrementAndGet();
            } catch (Throwable t) {
                exceptions.add(t);
            } finally {
                doneLatch.countDown();
            }
        });

        // Thread 2: Customer B ordering 1 unit
        executor.submit(() -> {
            readyLatch.countDown();
            try {
                startGate.await(); // Synchronize strike time
                CreateOrderRequest req = new CreateOrderRequest();
                req.setCustomerId(customerB.getId());
                req.setWarehouseId(warehouse.getId());
                req.setItems(List.of(new CreateOrderItemRequest(product.getId(), 1)));

                OrderDTO order = orderService.createOrder(req, "customer_b");
                createdOrders.add(order);
                successCount.incrementAndGet();
            } catch (InsufficientStockException e) {
                insufficientStockCount.incrementAndGet();
            } catch (Throwable t) {
                exceptions.add(t);
            } finally {
                doneLatch.countDown();
            }
        });

        // Wait for both threads to be ready, then unleash simultaneously
        readyLatch.await(5, TimeUnit.SECONDS);
        startGate.countDown();

        // Wait for both transactions to finish
        assertTrue(doneLatch.await(10, TimeUnit.SECONDS), "Both order transactions must complete within 10 seconds");
        executor.shutdown();

        log.info("Concurrent test results: successCount={}, insufficientStockCount={}, exceptions={}",
                successCount.get(), insufficientStockCount.get(), exceptions.size());

        // Assertions
        assertEquals(1, successCount.get(), "Exactly one order must succeed");
        assertEquals(1, insufficientStockCount.get(), "Exactly one order must fail with InsufficientStockException");
        assertTrue(exceptions.isEmpty(), "No unexpected internal errors should occur: " + exceptions);

        // Verify Database Invariants
        InventoryBalance finalBalance = balanceRepository.findByProductIdAndWarehouseId(product.getId(), warehouse.getId()).orElseThrow();
        assertEquals(1, finalBalance.getOnHandQuantity(), "Physical on-hand remains 1");
        assertEquals(1, finalBalance.getReservedQuantity(), "Reserved quantity must be exactly 1");
        assertEquals(0, finalBalance.getAvailableQuantity(), "Available quantity must be 0");
        assertTrue(finalBalance.getAvailableQuantity() >= 0, "Available quantity must NEVER become negative!");

        // Verify Order Records
        assertEquals(1, createdOrders.size());
        Order successfulOrder = orderRepository.findByOrderNumberWithItems(createdOrders.get(0).getOrderNumber()).orElseThrow();
        assertEquals(OrderStatus.PENDING, successfulOrder.getStatus());
        assertEquals(1, successfulOrder.getItems().size());
        assertEquals(1, successfulOrder.getItems().get(0).getQuantity());

        // Verify Inventory Movements: Exactly one ORDER_RESERVED movement was committed
        List<InventoryMovement> movements = movementRepository.searchMovements(product.getId(), null, org.springframework.data.domain.Pageable.unpaged()).getContent();
        long reservationMovements = movements.stream().filter(m -> m.getMovementType().name().equals("ORDER_RESERVED")).count();
        assertEquals(1, reservationMovements, "Exactly one ORDER_RESERVED movement must be persisted");
    }

    /**
     * MULTI-PRODUCT DEADLOCK AVOIDANCE TEST:
     * Order 1 requests [Product A, Product B]
     * Order 2 requests [Product B, Product A]
     * Because OrderService sorts products by productId ascending before locking,
     * both threads lock in deterministic order (A then B), eliminating deadlocks.
     */
    @Test
    @DisplayName("Deterministic product sorting prevents deadlocks across overlapping concurrent multi-item orders")
    void testDeadlockFreeMultiProductConcurrency() throws Exception {
        Product prodA = productRepository.save(new Product(
                "SKU-A-" + UUID.randomUUID().toString().substring(0, 6), "Item A", "A", null,
                new BigDecimal("10.00"), new BigDecimal("20.00"), 5, "UNIT"
        ));
        Product prodB = productRepository.save(new Product(
                "SKU-B-" + UUID.randomUUID().toString().substring(0, 6), "Item B", "B", null,
                new BigDecimal("10.00"), new BigDecimal("20.00"), 5, "UNIT"
        ));

        balanceRepository.save(new InventoryBalance(prodA, warehouse, 10, 0));
        balanceRepository.save(new InventoryBalance(prodB, warehouse, 10, 0));

        int threadCount = 4;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);
        AtomicInteger completedCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            final boolean reverseOrder = (i % 2 == 1);
            executor.submit(() -> {
                try {
                    startGate.await();
                    CreateOrderRequest req = new CreateOrderRequest();
                    req.setCustomerId(customerA.getId());
                    req.setWarehouseId(warehouse.getId());

                    if (reverseOrder) {
                        // Submit B then A
                        req.setItems(List.of(
                                new CreateOrderItemRequest(prodB.getId(), 1),
                                new CreateOrderItemRequest(prodA.getId(), 1)
                        ));
                    } else {
                        // Submit A then B
                        req.setItems(List.of(
                                new CreateOrderItemRequest(prodA.getId(), 1),
                                new CreateOrderItemRequest(prodB.getId(), 1)
                        ));
                    }

                    orderService.createOrder(req, "tester");
                    completedCount.incrementAndGet();
                } catch (Exception e) {
                    log.error("Error in multi-product order: ", e);
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startGate.countDown();
        assertTrue(doneLatch.await(15, TimeUnit.SECONDS), "All 4 multi-item orders must finish without database deadlock");
        executor.shutdown();

        assertEquals(4, completedCount.get(), "All 4 orders completed without deadlock");

        InventoryBalance balanceA = balanceRepository.findByProductIdAndWarehouseId(prodA.getId(), warehouse.getId()).orElseThrow();
        InventoryBalance balanceB = balanceRepository.findByProductIdAndWarehouseId(prodB.getId(), warehouse.getId()).orElseThrow();

        assertEquals(4, balanceA.getReservedQuantity());
        assertEquals(6, balanceA.getAvailableQuantity());
        assertEquals(4, balanceB.getReservedQuantity());
        assertEquals(6, balanceB.getAvailableQuantity());
    }

    /**
     * REPEATED CANCELLATION SAFETY TEST:
     * Cancelling an already cancelled order must not release stock twice!
     */
    @Test
    @DisplayName("Repeated order cancellation prevents double stock release")
    void testRepeatedCancellationProtection() {
        Product prod = productRepository.save(new Product(
                "SKU-REP-" + UUID.randomUUID().toString().substring(0, 6), "Repeated Cancel Item", "Item", null,
                new BigDecimal("10.00"), new BigDecimal("20.00"), 5, "UNIT"
        ));
        balanceRepository.save(new InventoryBalance(prod, warehouse, 10, 0));

        // Create order for 3 units
        CreateOrderRequest req = new CreateOrderRequest();
        req.setCustomerId(customerA.getId());
        req.setWarehouseId(warehouse.getId());
        req.setItems(List.of(new CreateOrderItemRequest(prod.getId(), 3)));

        OrderDTO order = orderService.createOrder(req, "tester");

        InventoryBalance balanceAfterOrder = balanceRepository.findByProductIdAndWarehouseId(prod.getId(), warehouse.getId()).orElseThrow();
        assertEquals(3, balanceAfterOrder.getReservedQuantity());
        assertEquals(7, balanceAfterOrder.getAvailableQuantity());

        // 1st Cancellation: releases stock
        orderService.cancelOrder(order.getId(), "First cancel", "admin");
        InventoryBalance balanceAfterCancel1 = balanceRepository.findByProductIdAndWarehouseId(prod.getId(), warehouse.getId()).orElseThrow();
        assertEquals(0, balanceAfterCancel1.getReservedQuantity());
        assertEquals(10, balanceAfterCancel1.getAvailableQuantity());

        // 2nd Cancellation: already CANCELLED -> returns idempotent without double release
        orderService.cancelOrder(order.getId(), "Second cancel attempt", "admin");
        InventoryBalance balanceAfterCancel2 = balanceRepository.findByProductIdAndWarehouseId(prod.getId(), warehouse.getId()).orElseThrow();
        assertEquals(0, balanceAfterCancel2.getReservedQuantity());
        assertEquals(10, balanceAfterCancel2.getAvailableQuantity(), "Stock is NOT released twice!");
    }
}
