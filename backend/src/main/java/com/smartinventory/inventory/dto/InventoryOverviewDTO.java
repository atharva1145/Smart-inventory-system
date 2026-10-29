package com.smartinventory.inventory.dto;

import com.smartinventory.inventory.InventoryBalance;

import java.math.BigDecimal;

public class InventoryOverviewDTO {

    private Long id;
    private Long productId;
    private String productSku;
    private String productName;
    private String categoryName;
    private Long warehouseId;
    private String warehouseName;
    private String warehouseCode;
    private Integer onHandQuantity;
    private Integer reservedQuantity;
    private Integer availableQuantity;
    private Integer reorderLevel;
    private BigDecimal costPrice;
    private BigDecimal sellingPrice;
    private BigDecimal totalValueAtCost;
    private boolean lowStock;
    private boolean outOfStock;

    public InventoryOverviewDTO() {
    }

    public static InventoryOverviewDTO fromEntity(InventoryBalance balance) {
        InventoryOverviewDTO dto = new InventoryOverviewDTO();
        dto.setId(balance.getId());
        dto.setProductId(balance.getProduct().getId());
        dto.setProductSku(balance.getProduct().getSku());
        dto.setProductName(balance.getProduct().getName());
        if (balance.getProduct().getCategory() != null) {
            dto.setCategoryName(balance.getProduct().getCategory().getName());
        }
        dto.setWarehouseId(balance.getWarehouse().getId());
        dto.setWarehouseName(balance.getWarehouse().getName());
        dto.setWarehouseCode(balance.getWarehouse().getCode());
        dto.setOnHandQuantity(balance.getOnHandQuantity());
        dto.setReservedQuantity(balance.getReservedQuantity());
        int avail = balance.getAvailableQuantity();
        dto.setAvailableQuantity(avail);
        dto.setReorderLevel(balance.getProduct().getReorderLevel());
        dto.setCostPrice(balance.getProduct().getCostPrice());
        dto.setSellingPrice(balance.getProduct().getSellingPrice());

        BigDecimal totalCost = balance.getProduct().getCostPrice()
                .multiply(BigDecimal.valueOf(balance.getOnHandQuantity()));
        dto.setTotalValueAtCost(totalCost);

        dto.setLowStock(avail <= balance.getProduct().getReorderLevel());
        dto.setOutOfStock(avail <= 0);

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

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
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

    public String getWarehouseCode() {
        return warehouseCode;
    }

    public void setWarehouseCode(String warehouseCode) {
        this.warehouseCode = warehouseCode;
    }

    public Integer getOnHandQuantity() {
        return onHandQuantity;
    }

    public void setOnHandQuantity(Integer onHandQuantity) {
        this.onHandQuantity = onHandQuantity;
    }

    public Integer getReservedQuantity() {
        return reservedQuantity;
    }

    public void setReservedQuantity(Integer reservedQuantity) {
        this.reservedQuantity = reservedQuantity;
    }

    public Integer getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(Integer availableQuantity) {
        this.availableQuantity = availableQuantity;
    }

    public Integer getReorderLevel() {
        return reorderLevel;
    }

    public void setReorderLevel(Integer reorderLevel) {
        this.reorderLevel = reorderLevel;
    }

    public BigDecimal getCostPrice() {
        return costPrice;
    }

    public void setCostPrice(BigDecimal costPrice) {
        this.costPrice = costPrice;
    }

    public BigDecimal getSellingPrice() {
        return sellingPrice;
    }

    public void setSellingPrice(BigDecimal sellingPrice) {
        this.sellingPrice = sellingPrice;
    }

    public BigDecimal getTotalValueAtCost() {
        return totalValueAtCost;
    }

    public void setTotalValueAtCost(BigDecimal totalValueAtCost) {
        this.totalValueAtCost = totalValueAtCost;
    }

    public boolean isLowStock() {
        return lowStock;
    }

    public void setLowStock(boolean lowStock) {
        this.lowStock = lowStock;
    }

    public boolean isOutOfStock() {
        return outOfStock;
    }

    public void setOutOfStock(boolean outOfStock) {
        this.outOfStock = outOfStock;
    }
}
