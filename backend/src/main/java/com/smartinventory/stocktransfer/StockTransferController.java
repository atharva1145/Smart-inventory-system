package com.smartinventory.stocktransfer;

import com.smartinventory.common.response.ApiResponse;
import com.smartinventory.common.response.PageResponse;
import com.smartinventory.stocktransfer.dto.CreateStockTransferRequest;
import com.smartinventory.stocktransfer.dto.StockTransferDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/stock-transfers")
@Tag(name = "Stock Transfers", description = "Inter-warehouse stock transfer management")
public class StockTransferController {

    private final StockTransferService stockTransferService;

    public StockTransferController(StockTransferService stockTransferService) {
        this.stockTransferService = stockTransferService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('INVENTORY_MANAGER')")
    @Operation(summary = "Create inter-warehouse stock transfer request")
    public ResponseEntity<ApiResponse<StockTransferDTO>> createTransfer(
            @Valid @RequestBody CreateStockTransferRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        StockTransferDTO transfer = stockTransferService.createTransfer(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Stock transfer requested successfully", transfer));
    }

    @GetMapping
    @Operation(summary = "List stock transfers with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<StockTransferDTO>>> getTransfers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) StockTransferStatus status,
            @RequestParam(required = false) Long warehouseId,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(stockTransferService.getTransfers(search, status, warehouseId, pageable))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get stock transfer by ID")
    public ResponseEntity<ApiResponse<StockTransferDTO>> getTransferById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(stockTransferService.getTransferById(id)));
    }

    @PostMapping("/{id}/dispatch")
    @PreAuthorize("hasRole('ADMIN') or hasRole('INVENTORY_MANAGER')")
    @Operation(summary = "Dispatch stock transfer (deducts stock from source warehouse)")
    public ResponseEntity<ApiResponse<StockTransferDTO>> dispatchTransfer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        StockTransferDTO transfer = stockTransferService.dispatchTransfer(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Stock transfer dispatched", transfer));
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasRole('ADMIN') or hasRole('INVENTORY_MANAGER')")
    @Operation(summary = "Receive stock transfer (adds stock to destination warehouse)")
    public ResponseEntity<ApiResponse<StockTransferDTO>> receiveTransfer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        StockTransferDTO transfer = stockTransferService.receiveTransfer(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Stock transfer received and completed", transfer));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN') or hasRole('INVENTORY_MANAGER')")
    @Operation(summary = "Cancel stock transfer (releases reserved stock at source)")
    public ResponseEntity<ApiResponse<StockTransferDTO>> cancelTransfer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        StockTransferDTO transfer = stockTransferService.cancelTransfer(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Stock transfer cancelled", transfer));
    }
}
