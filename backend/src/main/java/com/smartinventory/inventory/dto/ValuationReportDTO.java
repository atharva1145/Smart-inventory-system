package com.smartinventory.inventory.dto;

import java.math.BigDecimal;
import java.util.List;

public class ValuationReportDTO {

    private long totalProducts;
    private long totalOnHandUnits;
    private BigDecimal totalValuationAtCost;
    private BigDecimal totalRetailValue;
    private BigDecimal totalPotentialGrossProfit;
    private BigDecimal averageGrossMarginPercent;
    private List<ValuationItemDTO> items;

    public ValuationReportDTO() {
    }

    public ValuationReportDTO(long totalProducts, long totalOnHandUnits, BigDecimal totalValuationAtCost, List<ValuationItemDTO> items) {
        this(totalProducts, totalOnHandUnits, totalValuationAtCost, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, items);
    }

    public ValuationReportDTO(long totalProducts, long totalOnHandUnits, BigDecimal totalValuationAtCost,
                              BigDecimal totalRetailValue, BigDecimal totalPotentialGrossProfit,
                              BigDecimal averageGrossMarginPercent, List<ValuationItemDTO> items) {
        this.totalProducts = totalProducts;
        this.totalOnHandUnits = totalOnHandUnits;
        this.totalValuationAtCost = totalValuationAtCost;
        this.totalRetailValue = totalRetailValue;
        this.totalPotentialGrossProfit = totalPotentialGrossProfit;
        this.averageGrossMarginPercent = averageGrossMarginPercent;
        this.items = items;
    }

    public long getTotalProducts() {
        return totalProducts;
    }

    public void setTotalProducts(long totalProducts) {
        this.totalProducts = totalProducts;
    }

    public long getTotalOnHandUnits() {
        return totalOnHandUnits;
    }

    public void setTotalOnHandUnits(long totalOnHandUnits) {
        this.totalOnHandUnits = totalOnHandUnits;
    }

    public BigDecimal getTotalValuationAtCost() {
        return totalValuationAtCost;
    }

    public void setTotalValuationAtCost(BigDecimal totalValuationAtCost) {
        this.totalValuationAtCost = totalValuationAtCost;
    }

    public BigDecimal getTotalRetailValue() {
        return totalRetailValue;
    }

    public void setTotalRetailValue(BigDecimal totalRetailValue) {
        this.totalRetailValue = totalRetailValue;
    }

    public BigDecimal getTotalPotentialGrossProfit() {
        return totalPotentialGrossProfit;
    }

    public void setTotalPotentialGrossProfit(BigDecimal totalPotentialGrossProfit) {
        this.totalPotentialGrossProfit = totalPotentialGrossProfit;
    }

    public BigDecimal getAverageGrossMarginPercent() {
        return averageGrossMarginPercent;
    }

    public void setAverageGrossMarginPercent(BigDecimal averageGrossMarginPercent) {
        this.averageGrossMarginPercent = averageGrossMarginPercent;
    }

    public List<ValuationItemDTO> getItems() {
        return items;
    }

    public void setItems(List<ValuationItemDTO> items) {
        this.items = items;
    }

    public static class ValuationItemDTO {
        private Long productId;
        private String sku;
        private String productName;
        private String categoryName;
        private int onHand;
        private BigDecimal unitCost;
        private BigDecimal totalCost;
        private BigDecimal sellingPrice;
        private BigDecimal totalRetailValue;
        private BigDecimal potentialGrossProfit;
        private BigDecimal grossMarginPercent;

        public ValuationItemDTO() {
        }

        public ValuationItemDTO(Long productId, String sku, String productName, String categoryName, int onHand, BigDecimal unitCost, BigDecimal totalCost) {
            this(productId, sku, productName, categoryName, onHand, unitCost, totalCost, unitCost, totalCost, BigDecimal.ZERO, BigDecimal.ZERO);
        }

        public ValuationItemDTO(Long productId, String sku, String productName, String categoryName, int onHand,
                                BigDecimal unitCost, BigDecimal totalCost, BigDecimal sellingPrice,
                                BigDecimal totalRetailValue, BigDecimal potentialGrossProfit, BigDecimal grossMarginPercent) {
            this.productId = productId;
            this.sku = sku;
            this.productName = productName;
            this.categoryName = categoryName;
            this.onHand = onHand;
            this.unitCost = unitCost;
            this.totalCost = totalCost;
            this.sellingPrice = sellingPrice;
            this.totalRetailValue = totalRetailValue;
            this.potentialGrossProfit = potentialGrossProfit;
            this.grossMarginPercent = grossMarginPercent;
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

        public int getOnHand() {
            return onHand;
        }

        public void setOnHand(int onHand) {
            this.onHand = onHand;
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

        public BigDecimal getSellingPrice() { return sellingPrice; }
        public void setSellingPrice(BigDecimal sellingPrice) { this.sellingPrice = sellingPrice; }

        public BigDecimal getTotalRetailValue() { return totalRetailValue; }
        public void setTotalRetailValue(BigDecimal totalRetailValue) { this.totalRetailValue = totalRetailValue; }

        public BigDecimal getPotentialGrossProfit() { return potentialGrossProfit; }
        public void setPotentialGrossProfit(BigDecimal potentialGrossProfit) { this.potentialGrossProfit = potentialGrossProfit; }

        public BigDecimal getGrossMarginPercent() { return grossMarginPercent; }
        public void setGrossMarginPercent(BigDecimal grossMarginPercent) { this.grossMarginPercent = grossMarginPercent; }
    }
}
