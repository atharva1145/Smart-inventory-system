package com.smartinventory.goodsreceipt.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class CreateGoodsReceiptItemRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Quantity received is required")
    @Min(value = 1, message = "Quantity received must be at least 1")
    private Integer quantityReceived;

    public CreateGoodsReceiptItemRequest() {
    }

    public CreateGoodsReceiptItemRequest(Long productId, Integer quantityReceived) {
        this.productId = productId;
        this.quantityReceived = quantityReceived;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Integer getQuantityReceived() {
        return quantityReceived;
    }

    public void setQuantityReceived(Integer quantityReceived) {
        this.quantityReceived = quantityReceived;
    }
}
