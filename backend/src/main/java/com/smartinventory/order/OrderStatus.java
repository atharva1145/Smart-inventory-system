package com.smartinventory.order;

public enum OrderStatus {
    DRAFT,
    PENDING,
    CONFIRMED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    CANCELLED;

    public boolean canTransitionTo(OrderStatus target) {
        if (this == target) {
            return false;
        }
        return switch (this) {
            case DRAFT -> target == PENDING || target == CANCELLED;
            case PENDING -> target == CONFIRMED || target == CANCELLED;
            case CONFIRMED -> target == PROCESSING || target == CANCELLED;
            case PROCESSING -> target == SHIPPED || target == CANCELLED;
            case SHIPPED -> target == DELIVERED;
            case DELIVERED, CANCELLED -> false;
        };
    }

    public boolean isCancellable() {
        return this == DRAFT || this == PENDING || this == CONFIRMED || this == PROCESSING;
    }
}
