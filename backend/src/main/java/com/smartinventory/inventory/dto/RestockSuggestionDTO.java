package com.smartinventory.inventory.dto;

import java.math.BigDecimal;

public class RestockSuggestionDTO {
    private Long productId;
    private String sku;
    private String productName;
    private String categoryName;
    private Integer currentAvailable;
    private Integer reorderLevel;
    private Integer deficitQuantity;
    private Integer suggestedQuantity;
    private BigDecimal unitCost;
    private BigDecimal estimatedCost;
    private Long suggestedSupplierId;
    private String suggestedSupplierName;
    private Double dailyBurnRate;
    private Integer daysUntilStockout;
    private String stockoutRisk;

    public RestockSuggestionDTO() {}

    public RestockSuggestionDTO(Long productId, String sku, String productName, String categoryName,
                                Integer currentAvailable, Integer reorderLevel, Integer deficitQuantity,
                                Integer suggestedQuantity, BigDecimal unitCost, BigDecimal estimatedCost,
                                Long suggestedSupplierId, String suggestedSupplierName) {
        this(productId, sku, productName, categoryName, currentAvailable, reorderLevel, deficitQuantity, suggestedQuantity,
                unitCost, estimatedCost, suggestedSupplierId, suggestedSupplierName, 1.0, 7, "MODERATE");
    }

    public RestockSuggestionDTO(Long productId, String sku, String productName, String categoryName,
                                Integer currentAvailable, Integer reorderLevel, Integer deficitQuantity,
                                Integer suggestedQuantity, BigDecimal unitCost, BigDecimal estimatedCost,
                                Long suggestedSupplierId, String suggestedSupplierName,
                                Double dailyBurnRate, Integer daysUntilStockout, String stockoutRisk) {
        this.productId = productId;
        this.sku = sku;
        this.productName = productName;
        this.categoryName = categoryName;
        this.currentAvailable = currentAvailable;
        this.reorderLevel = reorderLevel;
        this.deficitQuantity = deficitQuantity;
        this.suggestedQuantity = suggestedQuantity;
        this.unitCost = unitCost;
        this.estimatedCost = estimatedCost;
        this.suggestedSupplierId = suggestedSupplierId;
        this.suggestedSupplierName = suggestedSupplierName;
        this.dailyBurnRate = dailyBurnRate;
        this.daysUntilStockout = daysUntilStockout;
        this.stockoutRisk = stockoutRisk;
    }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public Integer getCurrentAvailable() { return currentAvailable; }
    public void setCurrentAvailable(Integer currentAvailable) { this.currentAvailable = currentAvailable; }

    public Integer getReorderLevel() { return reorderLevel; }
    public void setReorderLevel(Integer reorderLevel) { this.reorderLevel = reorderLevel; }

    public Integer getDeficitQuantity() { return deficitQuantity; }
    public void setDeficitQuantity(Integer deficitQuantity) { this.deficitQuantity = deficitQuantity; }

    public Integer getSuggestedQuantity() { return suggestedQuantity; }
    public void setSuggestedQuantity(Integer suggestedQuantity) { this.suggestedQuantity = suggestedQuantity; }

    public BigDecimal getUnitCost() { return unitCost; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }

    public BigDecimal getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(BigDecimal estimatedCost) { this.estimatedCost = estimatedCost; }

    public Long getSuggestedSupplierId() { return suggestedSupplierId; }
    public void setSuggestedSupplierId(Long suggestedSupplierId) { this.suggestedSupplierId = suggestedSupplierId; }

    public String getSuggestedSupplierName() { return suggestedSupplierName; }
    public void setSuggestedSupplierName(String suggestedSupplierName) { this.suggestedSupplierName = suggestedSupplierName; }

    public Double getDailyBurnRate() { return dailyBurnRate; }
    public void setDailyBurnRate(Double dailyBurnRate) { this.dailyBurnRate = dailyBurnRate; }

    public Integer getDaysUntilStockout() { return daysUntilStockout; }
    public void setDaysUntilStockout(Integer daysUntilStockout) { this.daysUntilStockout = daysUntilStockout; }

    public String getStockoutRisk() { return stockoutRisk; }
    public void setStockoutRisk(String stockoutRisk) { this.stockoutRisk = stockoutRisk; }
}
