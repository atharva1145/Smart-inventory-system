package com.smartinventory.common.exception;

import org.springframework.http.HttpStatus;

public class InsufficientStockException extends ApiException {
    private final String sku;
    private final int requested;
    private final int available;

    public InsufficientStockException(String sku, int requested, int available) {
        super(String.format("Insufficient stock for SKU '%s'. Requested: %d, Available: %d", sku, requested, available),
                HttpStatus.CONFLICT);
        this.sku = sku;
        this.requested = requested;
        this.available = available;
    }

    public String getSku() {
        return sku;
    }

    public int getRequested() {
        return requested;
    }

    public int getAvailable() {
        return available;
    }
}
