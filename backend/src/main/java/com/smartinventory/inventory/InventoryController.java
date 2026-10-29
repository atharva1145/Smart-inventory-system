package com.smartinventory.inventory;

import com.smartinventory.common.response.ApiResponse;
import com.smartinventory.common.response.PageResponse;
import com.smartinventory.inventory.dto.*;
import com.smartinventory.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
@Tag(name = "Inventory Management", description = "Stock balances, movements, manual adjustments, and low-stock alerts")
@SecurityRequirement(name = "bearerAuth")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/overview")
    @Operation(summary = "Get inventory overview", description = "Lists stock levels (on-hand, reserved, available) with search and filters")
    public ResponseEntity<ApiResponse<PageResponse<InventoryOverviewDTO>>> getInventoryOverview(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(defaultValue = "false") boolean lowStockOnly,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                PageResponse.of(inventoryService.getInventoryOverview(search, warehouseId, lowStockOnly, pageable))
        ));
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get stock levels for a product across warehouses")
    public ResponseEntity<ApiResponse<List<InventoryOverviewDTO>>> getInventoryByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getInventoryByProduct(productId)));
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @Operation(summary = "Perform manual stock adjustment", description = "Records a manual adjustment with mandatory reason and updates on-hand stock")
    public ResponseEntity<ApiResponse<InventoryOverviewDTO>> adjustStock(@Valid @RequestBody AdjustStockRequest request) {
        String actor = SecurityUtils.getCurrentUsername();
        InventoryOverviewDTO updated = inventoryService.adjustStock(request, actor);
        return ResponseEntity.ok(ApiResponse.success("Stock adjusted successfully", updated));
    }

    @GetMapping("/movements")
    @Operation(summary = "Get stock movement history", description = "Immutable audit log of all stock movements with filtering")
    public ResponseEntity<ApiResponse<PageResponse<MovementDTO>>> getMovements(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) MovementType movementType,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                PageResponse.of(inventoryService.getMovements(productId, movementType, pageable))
        ));
    }

    @GetMapping("/alerts/low-stock")
    @Operation(summary = "Get low stock and out of stock items")
    public ResponseEntity<ApiResponse<List<InventoryOverviewDTO>>> getLowStockAlerts() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getLowStockAlerts()));
    }

    @GetMapping("/restock-suggestions")
    @Operation(summary = "Get smart restock suggestions for low-stock items")
    public ResponseEntity<ApiResponse<List<RestockSuggestionDTO>>> getRestockSuggestions() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getRestockSuggestions()));
    }

    @GetMapping("/valuation")
    @Operation(summary = "Get inventory valuation report at cost")
    public ResponseEntity<ApiResponse<ValuationReportDTO>> getValuationReport() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getValuationReport()));
    }

    @GetMapping(value = "/export/csv", produces = "text/csv")
    @Operation(summary = "Export current inventory balances to CSV")
    public ResponseEntity<String> exportInventoryCsv() {
        String csv = inventoryService.exportInventoryCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"inventory_" + LocalDate.now() + ".csv\"")
                .body(csv);
    }

    @GetMapping(value = "/movements/export/csv", produces = "text/csv")
    @Operation(summary = "Export inventory movement ledger to CSV")
    public ResponseEntity<String> exportMovementsCsv() {
        String csv = inventoryService.exportMovementsCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"inventory_movements_" + LocalDate.now() + ".csv\"")
                .body(csv);
    }
}
