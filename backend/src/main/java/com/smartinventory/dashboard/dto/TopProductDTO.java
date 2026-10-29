package com.smartinventory.dashboard.dto;

import java.math.BigDecimal;

public class TopProductDTO {

    private Long productId;
    private String sku;
    private String name;
    private long unitsSold;
    private BigDecimal revenue;

    public TopProductDTO() {
    }

    public TopProductDTO(Long productId, String sku, String name, long unitsSold, BigDecimal revenue) {
        this.productId = productId;
        this.sku = sku;
        this.name = name;
        this.unitsSold = unitsSold;
        this.revenue = revenue;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public long getUnitsSold() {
        return unitsSold;
    }

    public void setUnitsSold(long unitsSold) {
        this.unitsSold = unitsSold;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public void setRevenue(BigDecimal revenue) {
        this.revenue = revenue;
    }
}
