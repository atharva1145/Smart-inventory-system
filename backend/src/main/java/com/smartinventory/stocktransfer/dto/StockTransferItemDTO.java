package com.smartinventory.stocktransfer.dto;

public class StockTransferItemDTO {
    private Long id;
    private Long productId;
    private String productSku;
    private String productName;
    private Integer quantity;

    public StockTransferItemDTO() {}

    public StockTransferItemDTO(Long id, Long productId, String productSku, String productName, Integer quantity) {
        this.id = id;
        this.productId = productId;
        this.productSku = productSku;
        this.productName = productName;
        this.quantity = quantity;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductSku() { return productSku; }
    public void setProductSku(String productSku) { this.productSku = productSku; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
