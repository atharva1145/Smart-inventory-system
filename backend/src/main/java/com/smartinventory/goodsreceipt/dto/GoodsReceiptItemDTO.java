package com.smartinventory.goodsreceipt.dto;

import com.smartinventory.goodsreceipt.GoodsReceiptItem;

public class GoodsReceiptItemDTO {

    private Long id;
    private Long productId;
    private String productSku;
    private String productName;
    private Integer quantityReceived;

    public GoodsReceiptItemDTO() {
    }

    public static GoodsReceiptItemDTO fromEntity(GoodsReceiptItem item) {
        GoodsReceiptItemDTO dto = new GoodsReceiptItemDTO();
        dto.setId(item.getId());
        dto.setProductId(item.getProduct().getId());
        dto.setProductSku(item.getProduct().getSku());
        dto.setProductName(item.getProduct().getName());
        dto.setQuantityReceived(item.getQuantityReceived());
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

    public Integer getQuantityReceived() {
        return quantityReceived;
    }

    public void setQuantityReceived(Integer quantityReceived) {
        this.quantityReceived = quantityReceived;
    }
}
