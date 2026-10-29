package com.smartinventory.dashboard.dto;

import java.math.BigDecimal;

public class SalesTrendDTO {

    private String date;
    private long orderCount;
    private BigDecimal amount;

    public SalesTrendDTO() {
    }

    public SalesTrendDTO(String date, long orderCount, BigDecimal amount) {
        this.date = date;
        this.orderCount = orderCount;
        this.amount = amount;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public long getOrderCount() {
        return orderCount;
    }

    public void setOrderCount(long orderCount) {
        this.orderCount = orderCount;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
