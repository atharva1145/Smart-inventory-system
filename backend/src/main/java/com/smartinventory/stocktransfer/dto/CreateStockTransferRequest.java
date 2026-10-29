package com.smartinventory.stocktransfer.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class CreateStockTransferRequest {

    @NotNull(message = "Source warehouse is required")
    private Long sourceWarehouseId;

    @NotNull(message = "Destination warehouse is required")
    private Long destinationWarehouseId;

    private String notes;

    @NotEmpty(message = "Transfer items cannot be empty")
    @Valid
    private List<CreateStockTransferItemRequest> items;

    public CreateStockTransferRequest() {}

    public Long getSourceWarehouseId() { return sourceWarehouseId; }
    public void setSourceWarehouseId(Long sourceWarehouseId) { this.sourceWarehouseId = sourceWarehouseId; }

    public Long getDestinationWarehouseId() { return destinationWarehouseId; }
    public void setDestinationWarehouseId(Long destinationWarehouseId) { this.destinationWarehouseId = destinationWarehouseId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<CreateStockTransferItemRequest> getItems() { return items; }
    public void setItems(List<CreateStockTransferItemRequest> items) { this.items = items; }
}
