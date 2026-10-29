package com.smartinventory.goodsreceipt.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class CreateGoodsReceiptRequest {

    @NotNull(message = "Purchase order ID is required")
    private Long purchaseOrderId;

    @NotNull(message = "Warehouse ID is required")
    private Long warehouseId;

    @NotEmpty(message = "Receipt must contain at least one item")
    @Valid
    private List<CreateGoodsReceiptItemRequest> items;

    private String notes;

    public CreateGoodsReceiptRequest() {
    }

    public Long getPurchaseOrderId() {
        return purchaseOrderId;
    }

    public void setPurchaseOrderId(Long purchaseOrderId) {
        this.purchaseOrderId = purchaseOrderId;
    }

    public Long getWarehouseId() {
        return warehouseId;
    }

    public void setWarehouseId(Long warehouseId) {
        this.warehouseId = warehouseId;
    }

    public List<CreateGoodsReceiptItemRequest> getItems() {
        return items;
    }

    public void setItems(List<CreateGoodsReceiptItemRequest> items) {
        this.items = items;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
