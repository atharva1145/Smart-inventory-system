package com.smartinventory.unit;

import com.smartinventory.purchaseorder.PurchaseOrderItem;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Unit Test: Purchase Order & Goods Receipt Outstanding Calculations")
class GoodsReceiptCalculationTest {

    @Test
    @DisplayName("Outstanding quantity equals ordered minus received")
    void testOutstandingQuantity() {
        PurchaseOrderItem item = new PurchaseOrderItem(null, 50, new BigDecimal("10.00"), new BigDecimal("500.00"));
        assertEquals(50, item.getOutstandingQuantity());

        item.setReceivedQuantity(20);
        assertEquals(30, item.getOutstandingQuantity());

        item.setReceivedQuantity(50);
        assertEquals(0, item.getOutstandingQuantity());
    }

    @Test
    @DisplayName("Outstanding quantity is clamped to zero and never negative")
    void testOutstandingClamp() {
        PurchaseOrderItem item = new PurchaseOrderItem(null, 10, new BigDecimal("5.00"), new BigDecimal("50.00"));
        item.setReceivedQuantity(12); // abnormal scenario
        assertEquals(0, item.getOutstandingQuantity());
    }
}
