package com.smartinventory.warehouse;

import com.smartinventory.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/warehouses")
@Tag(name = "Warehouses", description = "Endpoints for managing warehouses")
@SecurityRequirement(name = "bearerAuth")
public class WarehouseController {

    private final WarehouseService warehouseService;

    public WarehouseController(WarehouseService warehouseService) {
        this.warehouseService = warehouseService;
    }

    @GetMapping
    @Operation(summary = "List all warehouses")
    public ResponseEntity<ApiResponse<List<WarehouseDTO>>> getAllWarehouses() {
        return ResponseEntity.ok(ApiResponse.success(warehouseService.getAllWarehouses()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get warehouse by ID")
    public ResponseEntity<ApiResponse<WarehouseDTO>> getWarehouseById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(warehouseService.getWarehouseById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @Operation(summary = "Create warehouse")
    public ResponseEntity<ApiResponse<WarehouseDTO>> createWarehouse(@Valid @RequestBody WarehouseDTO dto) {
        WarehouseDTO created = warehouseService.createWarehouse(dto);
        return new ResponseEntity<>(ApiResponse.success("Warehouse created successfully", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @Operation(summary = "Update warehouse")
    public ResponseEntity<ApiResponse<WarehouseDTO>> updateWarehouse(@PathVariable Long id, @Valid @RequestBody WarehouseDTO dto) {
        WarehouseDTO updated = warehouseService.updateWarehouse(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Warehouse updated successfully", updated));
    }
}
