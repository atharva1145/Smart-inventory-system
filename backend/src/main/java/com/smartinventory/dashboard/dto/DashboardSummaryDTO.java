package com.smartinventory.dashboard.dto;

import com.smartinventory.inventory.dto.MovementDTO;
import com.smartinventory.order.dto.OrderDTO;

import java.math.BigDecimal;
import java.util.List;

public class DashboardSummaryDTO {

    private long totalActiveProducts;
    private long totalInventoryUnits;
    private BigDecimal inventoryValuationAtCost;
    private long lowStockCount;
    private long outOfStockCount;
    private long ordersToday;
    private long pendingOrders;
    private long completedOrders;
    private BigDecimal totalRevenue;
    private BigDecimal totalOrderValue;

    private List<TopProductDTO> topSellingProducts;
    private List<SalesTrendDTO> salesTrend;
    private List<OrderDTO> recentOrders;
    private List<MovementDTO> recentMovements;

    public DashboardSummaryDTO() {
    }

    public long getTotalActiveProducts() {
        return totalActiveProducts;
    }

    public void setTotalActiveProducts(long totalActiveProducts) {
        this.totalActiveProducts = totalActiveProducts;
    }

    public long getTotalInventoryUnits() {
        return totalInventoryUnits;
    }

    public void setTotalInventoryUnits(long totalInventoryUnits) {
        this.totalInventoryUnits = totalInventoryUnits;
    }

    public BigDecimal getInventoryValuationAtCost() {
        return inventoryValuationAtCost;
    }

    public void setInventoryValuationAtCost(BigDecimal inventoryValuationAtCost) {
        this.inventoryValuationAtCost = inventoryValuationAtCost;
    }

    public long getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(long lowStockCount) {
        this.lowStockCount = lowStockCount;
    }

    public long getOutOfStockCount() {
        return outOfStockCount;
    }

    public void setOutOfStockCount(long outOfStockCount) {
        this.outOfStockCount = outOfStockCount;
    }

    public long getOrdersToday() {
        return ordersToday;
    }

    public void setOrdersToday(long ordersToday) {
        this.ordersToday = ordersToday;
    }

    public long getPendingOrders() {
        return pendingOrders;
    }

    public void setPendingOrders(long pendingOrders) {
        this.pendingOrders = pendingOrders;
    }

    public long getCompletedOrders() {
        return completedOrders;
    }

    public void setCompletedOrders(long completedOrders) {
        this.completedOrders = completedOrders;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public BigDecimal getTotalOrderValue() {
        return totalOrderValue;
    }

    public void setTotalOrderValue(BigDecimal totalOrderValue) {
        this.totalOrderValue = totalOrderValue;
    }

    public List<TopProductDTO> getTopSellingProducts() {
        return topSellingProducts;
    }

    public void setTopSellingProducts(List<TopProductDTO> topSellingProducts) {
        this.topSellingProducts = topSellingProducts;
    }

    public List<SalesTrendDTO> getSalesTrend() {
        return salesTrend;
    }

    public void setSalesTrend(List<SalesTrendDTO> salesTrend) {
        this.salesTrend = salesTrend;
    }

    public List<OrderDTO> getRecentOrders() {
        return recentOrders;
    }

    public void setRecentOrders(List<OrderDTO> recentOrders) {
        this.recentOrders = recentOrders;
    }

    public List<MovementDTO> getRecentMovements() {
        return recentMovements;
    }

    public void setRecentMovements(List<MovementDTO> recentMovements) {
        this.recentMovements = recentMovements;
    }
}
