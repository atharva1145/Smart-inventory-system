package com.smartinventory.goodsreceipt.dto;

import com.smartinventory.goodsreceipt.GoodsReceipt;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

public class GoodsReceiptDTO {

    private Long id;
    private String receiptNumber;
    private Long purchaseOrderId;
    private String poNumber;
    private Long warehouseId;
    private String warehouseName;
    private String receivedBy;
    private String notes;
    private List<GoodsReceiptItemDTO> items;
    private Instant createdAt;

    public GoodsReceiptDTO() {
    }

    public static GoodsReceiptDTO fromEntity(GoodsReceipt gr) {
        GoodsReceiptDTO dto = new GoodsReceiptDTO();
        dto.setId(gr.getId());
        dto.setReceiptNumber(gr.getReceiptNumber());
        if (gr.getPurchaseOrder() != null) {
            dto.setPurchaseOrderId(gr.getPurchaseOrder().getId());
            dto.setPoNumber(gr.getPurchaseOrder().getPoNumber());
        }
        if (gr.getWarehouse() != null) {
            dto.setWarehouseId(gr.getWarehouse().getId());
            dto.setWarehouseName(gr.getWarehouse().getName());
        }
        dto.setReceivedBy(gr.getReceivedBy());
        dto.setNotes(gr.getNotes());
        if (gr.getItems() != null) {
            dto.setItems(gr.getItems().stream().map(GoodsReceiptItemDTO::fromEntity).collect(Collectors.toList()));
        }
        dto.setCreatedAt(gr.getCreatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(String receiptNumber) {
        this.receiptNumber = receiptNumber;
    }

    public Long getPurchaseOrderId() {
        return purchaseOrderId;
    }

    public void setPurchaseOrderId(Long purchaseOrderId) {
        this.purchaseOrderId = purchaseOrderId;
    }

    public String getPoNumber() {
        return poNumber;
    }

    public void setPoNumber(String poNumber) {
        this.poNumber = poNumber;
    }

    public Long getWarehouseId() {
        return warehouseId;
    }

    public void setWarehouseId(Long warehouseId) {
        this.warehouseId = warehouseId;
    }

    public String getWarehouseName() {
        return warehouseName;
    }

    public void setWarehouseName(String warehouseName) {
        this.warehouseName = warehouseName;
    }

    public String getReceivedBy() {
        return receivedBy;
    }

    public void setReceivedBy(String receivedBy) {
        this.receivedBy = receivedBy;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<GoodsReceiptItemDTO> getItems() {
        return items;
    }

    public void setItems(List<GoodsReceiptItemDTO> items) {
        this.items = items;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
