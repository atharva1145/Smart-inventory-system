package com.smartinventory.purchaseorder.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public class CreatePurchaseOrderRequest {

    @NotNull(message = "Supplier ID is required")
    private Long supplierId;

    private LocalDate expectedDeliveryDate;

    @NotEmpty(message = "Purchase order must contain at least one item")
    @Valid
    private List<CreatePurchaseOrderItemRequest> items;

    private String notes;

    public CreatePurchaseOrderRequest() {
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public LocalDate getExpectedDeliveryDate() {
        return expectedDeliveryDate;
    }

    public void setExpectedDeliveryDate(LocalDate expectedDeliveryDate) {
        this.expectedDeliveryDate = expectedDeliveryDate;
    }

    public List<CreatePurchaseOrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<CreatePurchaseOrderItemRequest> items) {
        this.items = items;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
