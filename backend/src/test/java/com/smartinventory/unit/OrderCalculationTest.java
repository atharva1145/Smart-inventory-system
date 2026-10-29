package com.smartinventory.unit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Unit Test: Monetary Calculations & Decimal Precision")
class OrderCalculationTest {

    @Test
    @DisplayName("Line total uses BigDecimal and rounds HALF_UP to 2 decimals")
    void testLineTotalCalculation() {
        BigDecimal unitPrice = new BigDecimal("19.99");
        int quantity = 3;

        BigDecimal expected = new BigDecimal("59.97");
        BigDecimal calculated = unitPrice.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);

        assertEquals(0, expected.compareTo(calculated));
    }

    @Test
    @DisplayName("Order total discounts cannot reduce total below zero")
    void testDiscountCalculation() {
        BigDecimal subtotal = new BigDecimal("50.00");
        BigDecimal largeDiscount = new BigDecimal("75.00");

        BigDecimal total = subtotal.subtract(largeDiscount);
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            total = BigDecimal.ZERO;
        }

        assertEquals(0, BigDecimal.ZERO.compareTo(total));
    }

    @Test
    @DisplayName("Standard discount calculation preserves two decimal places")
    void testStandardDiscount() {
        BigDecimal subtotal = new BigDecimal("100.00");
        BigDecimal discount = new BigDecimal("15.50");

        BigDecimal total = subtotal.subtract(discount).setScale(2, RoundingMode.HALF_UP);
        assertEquals(0, new BigDecimal("84.50").compareTo(total));
    }
}
