package com.smartinventory.purchaseorder.dto;

import com.smartinventory.purchaseorder.PurchaseOrder;
import com.smartinventory.purchaseorder.PurchaseOrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

public class PurchaseOrderDTO {

    private Long id;
    private String poNumber;
    private Long supplierId;
    private String supplierName;
    private PurchaseOrderStatus status;
    private LocalDate expectedDeliveryDate;
    private BigDecimal totalCost;
    private String notes;
    private String createdBy;
    private List<PurchaseOrderItemDTO> items;
    private Instant createdAt;
    private Instant updatedAt;

    public PurchaseOrderDTO() {
    }

    public static PurchaseOrderDTO fromEntity(PurchaseOrder po) {
        PurchaseOrderDTO dto = new PurchaseOrderDTO();
        dto.setId(po.getId());
        dto.setPoNumber(po.getPoNumber());
        if (po.getSupplier() != null) {
            dto.setSupplierId(po.getSupplier().getId());
            dto.setSupplierName(po.getSupplier().getName());
        }
        dto.setStatus(po.getStatus());
        dto.setExpectedDeliveryDate(po.getExpectedDeliveryDate());
        dto.setTotalCost(po.getTotalCost());
        dto.setNotes(po.getNotes());
        dto.setCreatedBy(po.getCreatedBy());
        if (po.getItems() != null) {
            dto.setItems(po.getItems().stream().map(PurchaseOrderItemDTO::fromEntity).collect(Collectors.toList()));
        }
        dto.setCreatedAt(po.getCreatedAt());
        dto.setUpdatedAt(po.getUpdatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPoNumber() {
        return poNumber;
    }

    public void setPoNumber(String poNumber) {
        this.poNumber = poNumber;
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public PurchaseOrderStatus getStatus() {
        return status;
    }

    public void setStatus(PurchaseOrderStatus status) {
        this.status = status;
    }

    public LocalDate getExpectedDeliveryDate() {
        return expectedDeliveryDate;
    }

    public void setExpectedDeliveryDate(LocalDate expectedDeliveryDate) {
        this.expectedDeliveryDate = expectedDeliveryDate;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public List<PurchaseOrderItemDTO> getItems() {
        return items;
    }

    public void setItems(List<PurchaseOrderItemDTO> items) {
        this.items = items;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
