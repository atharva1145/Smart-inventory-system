package com.smartinventory.order;

import com.smartinventory.common.response.ApiResponse;
import com.smartinventory.common.response.PageResponse;
import com.smartinventory.order.dto.*;
import com.smartinventory.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Orders", description = "Order processing, status lifecycle, and concurrency-safe reservation")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    @Operation(summary = "Search and filter orders")
    public ResponseEntity<ApiResponse<PageResponse<OrderDTO>>> searchOrders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) Long customerId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                PageResponse.of(orderService.searchOrders(search, status, customerId, pageable))
        ));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order by ID")
    public ResponseEntity<ApiResponse<OrderDTO>> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrderById(id)));
    }

    @GetMapping("/number/{orderNumber}")
    @Operation(summary = "Get order by order number")
    public ResponseEntity<ApiResponse<OrderDTO>> getOrderByNumber(@PathVariable String orderNumber) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrderByNumber(orderNumber)));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get status change timeline for order")
    public ResponseEntity<ApiResponse<List<OrderStatusHistoryDTO>>> getOrderHistory(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrderStatusHistory(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'INVENTORY_MANAGER')")
    @Operation(summary = "Create an order", description = "Atomically locks inventory balances, validates stock, reserves quantities, and calculates verified totals")
    public ResponseEntity<ApiResponse<OrderDTO>> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        String actor = SecurityUtils.getCurrentUsername();
        OrderDTO created = orderService.createOrder(request, actor);
        return new ResponseEntity<>(ApiResponse.success("Order created successfully", created), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'INVENTORY_MANAGER')")
    @Operation(summary = "Transition order status", description = "Transitions status adhering to business rules: on CANCELLED releases stock; on DELIVERED fulfills stock")
    public ResponseEntity<ApiResponse<OrderDTO>> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        String actor = SecurityUtils.getCurrentUsername();
        OrderDTO updated = orderService.updateOrderStatus(id, request, actor);
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully", updated));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'INVENTORY_MANAGER')")
    @Operation(summary = "Cancel an order", description = "Releases reserved stock back to available inventory")
    public ResponseEntity<ApiResponse<OrderDTO>> cancelOrder(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = (body != null && body.containsKey("reason")) ? body.get("reason") : "Order cancelled by user";
        String actor = SecurityUtils.getCurrentUsername();
        OrderDTO updated = orderService.cancelOrder(id, reason, actor);
        return ResponseEntity.ok(ApiResponse.success("Order cancelled successfully", updated));
    }
}
