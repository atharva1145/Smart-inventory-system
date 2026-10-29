package com.smartinventory.purchaseorder.dto;

import com.smartinventory.purchaseorder.PurchaseOrderItem;

import java.math.BigDecimal;

public class PurchaseOrderItemDTO {

    private Long id;
    private Long productId;
    private String productSku;
    private String productName;
    private Integer orderedQuantity;
    private Integer receivedQuantity;
    private Integer outstandingQuantity;
    private BigDecimal unitCost;
    private BigDecimal totalCost;

    public PurchaseOrderItemDTO() {
    }

    public static PurchaseOrderItemDTO fromEntity(PurchaseOrderItem item) {
        PurchaseOrderItemDTO dto = new PurchaseOrderItemDTO();
        dto.setId(item.getId());
        dto.setProductId(item.getProduct().getId());
        dto.setProductSku(item.getProduct().getSku());
        dto.setProductName(item.getProduct().getName());
        dto.setOrderedQuantity(item.getOrderedQuantity());
        dto.setReceivedQuantity(item.getReceivedQuantity());
        dto.setOutstandingQuantity(item.getOutstandingQuantity());
        dto.setUnitCost(item.getUnitCost());
        dto.setTotalCost(item.getTotalCost());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductSku() {
        return productSku;
    }

    public void setProductSku(String productSku) {
        this.productSku = productSku;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public Integer getOrderedQuantity() {
        return orderedQuantity;
    }

    public void setOrderedQuantity(Integer orderedQuantity) {
        this.orderedQuantity = orderedQuantity;
    }

    public Integer getReceivedQuantity() {
        return receivedQuantity;
    }

    public void setReceivedQuantity(Integer receivedQuantity) {
        this.receivedQuantity = receivedQuantity;
    }

    public Integer getOutstandingQuantity() {
        return outstandingQuantity;
    }

    public void setOutstandingQuantity(Integer outstandingQuantity) {
        this.outstandingQuantity = outstandingQuantity;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(BigDecimal unitCost) {
        this.unitCost = unitCost;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
    }
}
