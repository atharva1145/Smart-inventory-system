package com.smartinventory.unit;

import com.smartinventory.order.OrderStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Unit Test: Order Status Lifecycle Transitions")
class OrderStatusTransitionTest {

    @Test
    @DisplayName("DRAFT can transition to PENDING and CANCELLED")
    void testDraftTransitions() {
        assertTrue(OrderStatus.DRAFT.canTransitionTo(OrderStatus.PENDING));
        assertTrue(OrderStatus.DRAFT.canTransitionTo(OrderStatus.CANCELLED));
        assertFalse(OrderStatus.DRAFT.canTransitionTo(OrderStatus.SHIPPED));
        assertFalse(OrderStatus.DRAFT.canTransitionTo(OrderStatus.DELIVERED));
    }

    @Test
    @DisplayName("PENDING can transition to CONFIRMED or CANCELLED")
    void testPendingTransitions() {
        assertTrue(OrderStatus.PENDING.canTransitionTo(OrderStatus.CONFIRMED));
        assertTrue(OrderStatus.PENDING.canTransitionTo(OrderStatus.CANCELLED));
        assertFalse(OrderStatus.PENDING.canTransitionTo(OrderStatus.DELIVERED));
    }

    @Test
    @DisplayName("CONFIRMED can transition to PROCESSING or CANCELLED")
    void testConfirmedTransitions() {
        assertTrue(OrderStatus.CONFIRMED.canTransitionTo(OrderStatus.PROCESSING));
        assertTrue(OrderStatus.CONFIRMED.canTransitionTo(OrderStatus.CANCELLED));
        assertFalse(OrderStatus.CONFIRMED.canTransitionTo(OrderStatus.SHIPPED));
    }

    @Test
    @DisplayName("PROCESSING can transition to SHIPPED or CANCELLED")
    void testProcessingTransitions() {
        assertTrue(OrderStatus.PROCESSING.canTransitionTo(OrderStatus.SHIPPED));
        assertTrue(OrderStatus.PROCESSING.canTransitionTo(OrderStatus.CANCELLED));
        assertFalse(OrderStatus.PROCESSING.canTransitionTo(OrderStatus.DELIVERED));
    }

    @Test
    @DisplayName("SHIPPED can only transition to DELIVERED")
    void testShippedTransitions() {
        assertTrue(OrderStatus.SHIPPED.canTransitionTo(OrderStatus.DELIVERED));
        assertFalse(OrderStatus.SHIPPED.canTransitionTo(OrderStatus.CANCELLED));
        assertFalse(OrderStatus.SHIPPED.canTransitionTo(OrderStatus.PROCESSING));
    }

    @Test
    @DisplayName("DELIVERED and CANCELLED are terminal states")
    void testTerminalStates() {
        for (OrderStatus target : OrderStatus.values()) {
            assertFalse(OrderStatus.DELIVERED.canTransitionTo(target));
            assertFalse(OrderStatus.CANCELLED.canTransitionTo(target));
        }
    }

    @Test
    @DisplayName("Cancellation eligibility rules")
    void testCancellationEligibility() {
        assertTrue(OrderStatus.DRAFT.isCancellable());
        assertTrue(OrderStatus.PENDING.isCancellable());
        assertTrue(OrderStatus.CONFIRMED.isCancellable());
        assertTrue(OrderStatus.PROCESSING.isCancellable());

        assertFalse(OrderStatus.SHIPPED.isCancellable(), "Shipped orders cannot be cancelled directly");
        assertFalse(OrderStatus.DELIVERED.isCancellable(), "Delivered orders cannot be cancelled");
        assertFalse(OrderStatus.CANCELLED.isCancellable(), "Already cancelled orders cannot be cancelled again");
    }
}
