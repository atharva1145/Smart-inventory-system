package com.smartinventory.goodsreceipt;

import com.smartinventory.common.response.ApiResponse;
import com.smartinventory.common.response.PageResponse;
import com.smartinventory.goodsreceipt.dto.CreateGoodsReceiptRequest;
import com.smartinventory.goodsreceipt.dto.GoodsReceiptDTO;
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

@RestController
@RequestMapping("/api/v1/goods-receipts")
@Tag(name = "Goods Receipts", description = "Receiving shipments against approved purchase orders and updating inventory balances")
@SecurityRequirement(name = "bearerAuth")
public class GoodsReceiptController {

    private final GoodsReceiptService goodsReceiptService;

    public GoodsReceiptController(GoodsReceiptService goodsReceiptService) {
        this.goodsReceiptService = goodsReceiptService;
    }

    @GetMapping
    @Operation(summary = "Search goods receipts")
    public ResponseEntity<ApiResponse<PageResponse<GoodsReceiptDTO>>> searchGoodsReceipts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long purchaseOrderId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                PageResponse.of(goodsReceiptService.searchGoodsReceipts(search, purchaseOrderId, pageable))
        ));
    }

    @GetMapping("/by-po/{purchaseOrderId}")
    @Operation(summary = "Get goods receipts by purchase order ID")
    public ResponseEntity<ApiResponse<List<GoodsReceiptDTO>>> getReceiptsByPurchaseOrder(@PathVariable Long purchaseOrderId) {
        return ResponseEntity.ok(ApiResponse.success(goodsReceiptService.getReceiptsByPurchaseOrder(purchaseOrderId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @Operation(summary = "Record goods receipt", description = "Validates quantities against PO outstanding balance, updates on-hand stock and PO progress atomically")
    public ResponseEntity<ApiResponse<GoodsReceiptDTO>> recordGoodsReceipt(@Valid @RequestBody CreateGoodsReceiptRequest request) {
        String actor = SecurityUtils.getCurrentUsername();
        GoodsReceiptDTO created = goodsReceiptService.recordGoodsReceipt(request, actor);
        return new ResponseEntity<>(ApiResponse.success("Goods receipt recorded successfully and stock updated", created), HttpStatus.CREATED);
    }
}
