package com.smartinventory.purchaseorder.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class CreatePurchaseOrderItemRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Ordered quantity is required")
    @Min(value = 1, message = "Ordered quantity must be at least 1")
    private Integer orderedQuantity;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal unitCost; // If null, uses product.costPrice

    public CreatePurchaseOrderItemRequest() {
    }

    public CreatePurchaseOrderItemRequest(Long productId, Integer orderedQuantity, BigDecimal unitCost) {
        this.productId = productId;
        this.orderedQuantity = orderedQuantity;
        this.unitCost = unitCost;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Integer getOrderedQuantity() {
        return orderedQuantity;
    }

    public void setOrderedQuantity(Integer orderedQuantity) {
        this.orderedQuantity = orderedQuantity;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(BigDecimal unitCost) {
        this.unitCost = unitCost;
    }
}
