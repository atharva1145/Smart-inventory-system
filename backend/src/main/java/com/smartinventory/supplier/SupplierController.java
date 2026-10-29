package com.smartinventory.supplier;

import com.smartinventory.common.response.ApiResponse;
import com.smartinventory.common.response.PageResponse;
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

@RestController
@RequestMapping("/api/v1/suppliers")
@Tag(name = "Suppliers", description = "Supplier directory and contact information")
@SecurityRequirement(name = "bearerAuth")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    @Operation(summary = "Search suppliers")
    public ResponseEntity<ApiResponse<PageResponse<SupplierDTO>>> searchSuppliers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                PageResponse.of(supplierService.searchSuppliers(search, active, pageable))
        ));
    }

    @GetMapping("/active")
    @Operation(summary = "Get list of all active suppliers")
    public ResponseEntity<ApiResponse<List<SupplierDTO>>> getActiveSuppliers() {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getAllActiveSuppliers()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get supplier by ID")
    public ResponseEntity<ApiResponse<SupplierDTO>> getSupplierById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getSupplierById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @Operation(summary = "Create supplier")
    public ResponseEntity<ApiResponse<SupplierDTO>> createSupplier(@Valid @RequestBody SupplierDTO dto) {
        SupplierDTO created = supplierService.createSupplier(dto);
        return new ResponseEntity<>(ApiResponse.success("Supplier created successfully", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @Operation(summary = "Update supplier")
    public ResponseEntity<ApiResponse<SupplierDTO>> updateSupplier(@PathVariable Long id, @Valid @RequestBody SupplierDTO dto) {
        SupplierDTO updated = supplierService.updateSupplier(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Supplier updated successfully", updated));
    }
}
