package com.smartinventory.stocktransfer;

public enum StockTransferStatus {
    REQUESTED,
    IN_TRANSIT,
    COMPLETED,
    CANCELLED;

    public boolean canTransitionTo(StockTransferStatus target) {
        return switch (this) {
            case REQUESTED -> target == IN_TRANSIT || target == CANCELLED;
            case IN_TRANSIT -> target == COMPLETED;
            case COMPLETED, CANCELLED -> false;
        };
    }
}
