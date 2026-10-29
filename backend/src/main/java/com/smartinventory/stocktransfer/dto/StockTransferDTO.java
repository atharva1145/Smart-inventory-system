package com.smartinventory.stocktransfer.dto;

import com.smartinventory.stocktransfer.StockTransferStatus;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class StockTransferDTO {
    private Long id;
    private String transferNumber;
    private Long sourceWarehouseId;
    private String sourceWarehouseName;
    private String sourceWarehouseCode;
    private Long destinationWarehouseId;
    private String destinationWarehouseName;
    private String destinationWarehouseCode;
    private StockTransferStatus status;
    private String notes;
    private String createdBy;
    private String dispatchedBy;
    private String receivedBy;
    private Instant dispatchedAt;
    private Instant receivedAt;
    private Instant createdAt;
    private Instant updatedAt;
    private List<StockTransferItemDTO> items = new ArrayList<>();

    public StockTransferDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTransferNumber() { return transferNumber; }
    public void setTransferNumber(String transferNumber) { this.transferNumber = transferNumber; }

    public Long getSourceWarehouseId() { return sourceWarehouseId; }
    public void setSourceWarehouseId(Long sourceWarehouseId) { this.sourceWarehouseId = sourceWarehouseId; }

    public String getSourceWarehouseName() { return sourceWarehouseName; }
    public void setSourceWarehouseName(String sourceWarehouseName) { this.sourceWarehouseName = sourceWarehouseName; }

    public String getSourceWarehouseCode() { return sourceWarehouseCode; }
    public void setSourceWarehouseCode(String sourceWarehouseCode) { this.sourceWarehouseCode = sourceWarehouseCode; }

    public Long getDestinationWarehouseId() { return destinationWarehouseId; }
    public void setDestinationWarehouseId(Long destinationWarehouseId) { this.destinationWarehouseId = destinationWarehouseId; }

    public String getDestinationWarehouseName() { return destinationWarehouseName; }
    public void setDestinationWarehouseName(String destinationWarehouseName) { this.destinationWarehouseName = destinationWarehouseName; }

    public String getDestinationWarehouseCode() { return destinationWarehouseCode; }
    public void setDestinationWarehouseCode(String destinationWarehouseCode) { this.destinationWarehouseCode = destinationWarehouseCode; }

    public StockTransferStatus getStatus() { return status; }
    public void setStatus(StockTransferStatus status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getDispatchedBy() { return dispatchedBy; }
    public void setDispatchedBy(String dispatchedBy) { this.dispatchedBy = dispatchedBy; }

    public String getReceivedBy() { return receivedBy; }
    public void setReceivedBy(String receivedBy) { this.receivedBy = receivedBy; }

    public Instant getDispatchedAt() { return dispatchedAt; }
    public void setDispatchedAt(Instant dispatchedAt) { this.dispatchedAt = dispatchedAt; }

    public Instant getReceivedAt() { return receivedAt; }
    public void setReceivedAt(Instant receivedAt) { this.receivedAt = receivedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public List<StockTransferItemDTO> getItems() { return items; }
    public void setItems(List<StockTransferItemDTO> items) { this.items = items; }
}
