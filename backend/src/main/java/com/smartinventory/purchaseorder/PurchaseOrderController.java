package com.smartinventory.purchaseorder;

import com.smartinventory.common.response.ApiResponse;
import com.smartinventory.common.response.PageResponse;
import com.smartinventory.purchaseorder.dto.CreatePurchaseOrderRequest;
import com.smartinventory.purchaseorder.dto.PurchaseOrderDTO;
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

@RestController
@RequestMapping("/api/v1/purchase-orders")
@Tag(name = "Purchase Orders", description = "Purchase order lifecycle: DRAFT -> APPROVED -> PARTIALLY_RECEIVED -> RECEIVED")
@SecurityRequirement(name = "bearerAuth")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    @GetMapping
    @Operation(summary = "Search purchase orders")
    public ResponseEntity<ApiResponse<PageResponse<PurchaseOrderDTO>>> searchPurchaseOrders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PurchaseOrderStatus status,
            @RequestParam(required = false) Long supplierId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                PageResponse.of(purchaseOrderService.searchPurchaseOrders(search, status, supplierId, pageable))
        ));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get purchase order by ID")
    public ResponseEntity<ApiResponse<PurchaseOrderDTO>> getPurchaseOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(purchaseOrderService.getPurchaseOrderById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @Operation(summary = "Create purchase order (DRAFT)")
    public ResponseEntity<ApiResponse<PurchaseOrderDTO>> createPurchaseOrder(@Valid @RequestBody CreatePurchaseOrderRequest request) {
        String actor = SecurityUtils.getCurrentUsername();
        PurchaseOrderDTO created = purchaseOrderService.createPurchaseOrder(request, actor);
        return new ResponseEntity<>(ApiResponse.success("Purchase order created successfully", created), HttpStatus.CREATED);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @Operation(summary = "Approve purchase order", description = "Moves PO from DRAFT to APPROVED so goods receipts can be recorded")
    public ResponseEntity<ApiResponse<PurchaseOrderDTO>> approvePurchaseOrder(@PathVariable Long id) {
        PurchaseOrderDTO approved = purchaseOrderService.approvePurchaseOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Purchase order approved successfully", approved));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @Operation(summary = "Cancel purchase order")
    public ResponseEntity<ApiResponse<PurchaseOrderDTO>> cancelPurchaseOrder(@PathVariable Long id) {
        PurchaseOrderDTO cancelled = purchaseOrderService.cancelPurchaseOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Purchase order cancelled successfully", cancelled));
    }
}
