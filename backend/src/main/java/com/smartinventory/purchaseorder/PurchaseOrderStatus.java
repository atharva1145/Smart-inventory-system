package com.smartinventory.purchaseorder;

public enum PurchaseOrderStatus {
    DRAFT,
    APPROVED,
    PARTIALLY_RECEIVED,
    RECEIVED,
    CANCELLED;

    public boolean canTransitionTo(PurchaseOrderStatus target) {
        if (this == target) {
            return false;
        }
        return switch (this) {
            case DRAFT -> target == APPROVED || target == CANCELLED;
            case APPROVED -> target == PARTIALLY_RECEIVED || target == RECEIVED || target == CANCELLED;
            case PARTIALLY_RECEIVED -> target == RECEIVED;
            case RECEIVED, CANCELLED -> false;
        };
    }
}
