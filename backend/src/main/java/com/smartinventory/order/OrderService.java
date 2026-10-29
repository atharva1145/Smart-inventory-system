package com.smartinventory.order;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartinventory.common.exception.BadRequestException;
import com.smartinventory.common.exception.InvalidStateTransitionException;
import com.smartinventory.common.exception.ResourceNotFoundException;
import com.smartinventory.customer.Customer;
import com.smartinventory.customer.CustomerRepository;
import com.smartinventory.inventory.InventoryService;
import com.smartinventory.notification.NotificationService;
import com.smartinventory.notification.NotificationType;
import com.smartinventory.order.dto.*;
import com.smartinventory.product.Product;
import com.smartinventory.product.ProductRepository;
import com.smartinventory.warehouse.Warehouse;
import com.smartinventory.warehouse.WarehouseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);
    private static final AtomicLong ORDER_SEQ = new AtomicLong(System.currentTimeMillis() % 100000);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final IdempotencyRecordRepository idempotencyRecordRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryService inventoryService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        OrderStatusHistoryRepository statusHistoryRepository,
                        IdempotencyRecordRepository idempotencyRecordRepository,
                        CustomerRepository customerRepository,
                        ProductRepository productRepository,
                        WarehouseRepository warehouseRepository,
                        InventoryService inventoryService,
                        NotificationService notificationService,
                        ObjectMapper objectMapper) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.idempotencyRecordRepository = idempotencyRecordRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
        this.inventoryService = inventoryService;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public Page<OrderDTO> searchOrders(String search, OrderStatus status, Long customerId, Pageable pageable) {
        return orderRepository.searchOrders(search, status, customerId, pageable).map(OrderDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public OrderDTO getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        return OrderDTO.fromEntity(order);
    }

    @Transactional(readOnly = true)
    public OrderDTO getOrderByNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderNumber", orderNumber));
        return OrderDTO.fromEntity(order);
    }

    @Transactional(readOnly = true)
    public List<OrderStatusHistoryDTO> getOrderStatusHistory(Long orderId) {
        return statusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(orderId).stream()
                .map(OrderStatusHistoryDTO::fromEntity)
                .toList();
    }

    /**
     * Creates an order with deterministic dead-lock-free pessimistic locking
     * on inventory balances. Guarantees overselling prevention and idempotency.
     */
    @Transactional
    public OrderDTO createOrder(CreateOrderRequest request, String actorUsername) {
        // 1. Idempotency Check
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            Optional<IdempotencyRecord> existing = idempotencyRecordRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) {
                try {
                    log.info("Idempotent request detected for key: {}", request.getIdempotencyKey());
                    return objectMapper.readValue(existing.get().getResponseBody(), OrderDTO.class);
                } catch (JsonProcessingException e) {
                    log.error("Failed to parse cached idempotent response", e);
                }
            }
        }

        // 2. Validate Customer
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));

        // 3. Resolve Warehouse
        Warehouse warehouse;
        if (request.getWarehouseId() != null) {
            warehouse = warehouseRepository.findById(request.getWarehouseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", request.getWarehouseId()));
        } else {
            warehouse = warehouseRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new BadRequestException("No warehouse found to fulfill order"));
        }

        // 4. Deterministic sorting by Product ID to prevent Deadlocks across concurrent orders
        List<CreateOrderItemRequest> sortedItems = new ArrayList<>(request.getItems());
        sortedItems.sort(Comparator.comparing(CreateOrderItemRequest::getProductId));

        String orderNumber = generateOrderNumber();

        // 5. Concurrency-Safe Stock Reservation (Row-Level Locking)
        // If any item fails available stock check, InsufficientStockException is thrown and the whole transaction rolls back!
        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CreateOrderItemRequest itemReq : sortedItems) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemReq.getProductId()));

            if (!product.isActive()) {
                throw new BadRequestException("Product '" + product.getName() + "' (SKU: " + product.getSku() + ") is inactive");
            }

            // Reserve stock using pessimistic lock
            inventoryService.reserveStock(product.getId(), warehouse.getId(), itemReq.getQuantity(), orderNumber, actorUsername);

            BigDecimal unitPrice = product.getSellingPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(lineTotal);

            OrderItem orderItem = new OrderItem(product, itemReq.getQuantity(), unitPrice, lineTotal);
            orderItems.add(orderItem);
        }

        BigDecimal discount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal total = subtotal.subtract(discount);
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            total = BigDecimal.ZERO;
        }

        // 6. Build and Persist Order
        Order order = new Order(
                orderNumber,
                customer,
                OrderStatus.PENDING,
                subtotal,
                discount,
                total,
                request.getIdempotencyKey(),
                request.getNotes(),
                actorUsername
        );

        for (OrderItem item : orderItems) {
            order.addItem(item);
        }

        OrderStatusHistory history = new OrderStatusHistory(
                order,
                null,
                OrderStatus.PENDING,
                actorUsername,
                "Order created and stock reserved"
        );
        order.addStatusHistory(history);

        Order savedOrder = orderRepository.save(order);
        OrderDTO responseDTO = OrderDTO.fromEntity(savedOrder);

        // 7. Store Idempotency Record if key was provided
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            try {
                String responseJson = objectMapper.writeValueAsString(responseDTO);
                IdempotencyRecord record = new IdempotencyRecord(
                        request.getIdempotencyKey(),
                        String.valueOf(request.hashCode()),
                        201,
                        responseJson
                );
                idempotencyRecordRepository.save(record);
            } catch (JsonProcessingException e) {
                log.error("Failed to serialize idempotency response", e);
            }
        }

        // 8. Create In-App Notification
        notificationService.createNotificationIfNotExists(
                NotificationType.ORDER_CREATED,
                "New Order: " + orderNumber,
                "Order " + orderNumber + " created for " + customer.getName() + " with total $" + total,
                orderNumber
        );

        return responseDTO;
    }

    /**
     * Handles order state transitions safely.
     * On CANCELLED: releases reserved stock back to available stock.
     * On DELIVERED: fulfills reserved stock (decrements physical on-hand and reserved).
     */
    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, UpdateOrderStatusRequest request, String actorUsername) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        OrderStatus currentStatus = order.getStatus();
        OrderStatus targetStatus = request.getNewStatus();

        if (currentStatus == targetStatus) {
            return OrderDTO.fromEntity(order);
        }

        if (!currentStatus.canTransitionTo(targetStatus)) {
            throw new InvalidStateTransitionException("Order " + order.getOrderNumber(), currentStatus.name(), targetStatus.name());
        }

        Long warehouseId = warehouseRepository.findAll().stream().findFirst()
                .map(Warehouse::getId)
                .orElse(1L);

        // State action triggers:
        if (targetStatus == OrderStatus.CANCELLED) {
            // Safe Stock Release
            for (OrderItem item : order.getItems()) {
                inventoryService.releaseStock(
                        item.getProduct().getId(),
                        warehouseId,
                        item.getQuantity(),
                        order.getOrderNumber(),
                        actorUsername
                );
            }
        } else if (targetStatus == OrderStatus.DELIVERED) {
            // Stock Fulfillment: removes from physical on-hand and cleans up reserved
            for (OrderItem item : order.getItems()) {
                inventoryService.fulfillStock(
                        item.getProduct().getId(),
                        warehouseId,
                        item.getQuantity(),
                        order.getOrderNumber(),
                        actorUsername
                );
            }
            order.setPaymentStatus(PaymentStatus.PAID);
        }

        order.setStatus(targetStatus);
        OrderStatusHistory history = new OrderStatusHistory(
                order,
                currentStatus,
                targetStatus,
                actorUsername,
                request.getComment() != null ? request.getComment() : "Status updated to " + targetStatus
        );
        order.addStatusHistory(history);

        Order saved = orderRepository.save(order);
        return OrderDTO.fromEntity(saved);
    }

    @Transactional
    public OrderDTO cancelOrder(Long orderId, String reason, String actorUsername) {
        return updateOrderStatus(orderId, new UpdateOrderStatusRequest(OrderStatus.CANCELLED, reason), actorUsername);
    }

    @Transactional(readOnly = true)
    public String exportOrdersCsv() {
        List<Order> orders = orderRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        StringBuilder sb = new StringBuilder();
        sb.append("Order Number,Date,Customer,Status,Payment Status,Items Count,Subtotal,Discount,Total Amount\n");
        for (Order o : orders) {
            sb.append('"').append(o.getOrderNumber()).append("\",");
            sb.append('"').append(o.getCreatedAt()).append("\",");
            sb.append('"').append(o.getCustomer() != null ? o.getCustomer().getName().replace("\"", "\"\"") : "").append("\",");
            sb.append(o.getStatus()).append(",");
            sb.append(o.getPaymentStatus()).append(",");
            sb.append(o.getItems() != null ? o.getItems().size() : 0).append(",");
            sb.append(o.getSubtotal()).append(",");
            sb.append(o.getDiscountAmount()).append(",");
            sb.append(o.getTotalAmount()).append("\n");
        }
        return sb.toString();
    }

    private synchronized String generateOrderNumber() {
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        long seq = ORDER_SEQ.incrementAndGet();
        return String.format("ORD-%s-%04d", datePart, seq % 10000);
    }
}
