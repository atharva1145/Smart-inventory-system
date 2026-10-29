package com.smartinventory.dashboard;

import com.smartinventory.dashboard.dto.*;
import com.smartinventory.inventory.InventoryBalanceRepository;
import com.smartinventory.inventory.InventoryMovement;
import com.smartinventory.inventory.InventoryMovementRepository;
import com.smartinventory.inventory.dto.MovementDTO;
import com.smartinventory.order.*;
import com.smartinventory.order.dto.OrderDTO;
import com.smartinventory.product.ProductRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final ProductRepository productRepository;
    private final InventoryBalanceRepository balanceRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final InventoryMovementRepository movementRepository;

    public DashboardService(ProductRepository productRepository,
                            InventoryBalanceRepository balanceRepository,
                            OrderRepository orderRepository,
                            OrderItemRepository orderItemRepository,
                            InventoryMovementRepository movementRepository) {
        this.productRepository = productRepository;
        this.balanceRepository = balanceRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.movementRepository = movementRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryDTO getDashboardSummary() {
        DashboardSummaryDTO summary = new DashboardSummaryDTO();

        // 1. Core Inventory Metrics
        long activeProducts = productRepository.countByActiveTrue();
        long totalUnits = balanceRepository.sumTotalOnHandUnits();
        Double valuationCost = balanceRepository.sumInventoryValuationAtCost();
        long lowStock = balanceRepository.countLowStockItems();
        long outOfStock = balanceRepository.countOutOfStockItems();

        summary.setTotalActiveProducts(activeProducts);
        summary.setTotalInventoryUnits(totalUnits);
        summary.setInventoryValuationAtCost(BigDecimal.valueOf(valuationCost != null ? valuationCost : 0.0).setScale(2, RoundingMode.HALF_UP));
        summary.setLowStockCount(lowStock);
        summary.setOutOfStockCount(outOfStock);

        // 2. Order Metrics
        Instant startOfDay = LocalDate.now().atStartOfDay(ZoneOffset.UTC).toInstant();
        long ordersToday = orderRepository.countOrdersCreatedSince(startOfDay);
        long pendingOrders = orderRepository.countByStatusIn(List.of(OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING));
        long completedOrders = orderRepository.countByStatus(OrderStatus.DELIVERED);

        Double deliveredRevenue = orderRepository.sumTotalAmountByStatus(OrderStatus.DELIVERED);
        Double totalOrderValue = orderRepository.sumTotalOrderValue();

        summary.setOrdersToday(ordersToday);
        summary.setPendingOrders(pendingOrders);
        summary.setCompletedOrders(completedOrders);
        summary.setTotalRevenue(BigDecimal.valueOf(deliveredRevenue != null ? deliveredRevenue : 0.0).setScale(2, RoundingMode.HALF_UP));
        summary.setTotalOrderValue(BigDecimal.valueOf(totalOrderValue != null ? totalOrderValue : 0.0).setScale(2, RoundingMode.HALF_UP));

        // 3. Top-selling products
        List<Object[]> topProductRows = orderItemRepository.findTopSellingProducts(PageRequest.of(0, 5));
        List<TopProductDTO> topProducts = new ArrayList<>();
        for (Object[] row : topProductRows) {
            Long pId = ((Number) row[0]).longValue();
            String sku = (String) row[1];
            String name = (String) row[2];
            long qty = ((Number) row[3]).longValue();
            BigDecimal rev = row[4] instanceof BigDecimal b ? b : BigDecimal.valueOf(((Number) row[4]).doubleValue());
            topProducts.add(new TopProductDTO(pId, sku, name, qty, rev.setScale(2, RoundingMode.HALF_UP)));
        }
        summary.setTopSellingProducts(topProducts);

        // 4. Recent Activity
        List<Order> recentOrders = orderRepository.findRecentOrders(PageRequest.of(0, 5));
        summary.setRecentOrders(recentOrders.stream().map(OrderDTO::fromEntity).collect(Collectors.toList()));

        List<InventoryMovement> recentMovements = movementRepository.findRecentMovements(PageRequest.of(0, 5));
        summary.setRecentMovements(recentMovements.stream().map(MovementDTO::fromEntity).collect(Collectors.toList()));

        // 5. Sales trend for past 7 days
        List<SalesTrendDTO> trend = new ArrayList<>();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDate today = LocalDate.now();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            Instant dayStart = day.atStartOfDay(ZoneOffset.UTC).toInstant();
            Instant dayEnd = day.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

            long count = orderRepository.findAll().stream()
                    .filter(o -> !o.getCreatedAt().isBefore(dayStart) && o.getCreatedAt().isBefore(dayEnd))
                    .count();

            BigDecimal sum = orderRepository.findAll().stream()
                    .filter(o -> !o.getCreatedAt().isBefore(dayStart) && o.getCreatedAt().isBefore(dayEnd))
                    .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                    .map(Order::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            trend.add(new SalesTrendDTO(day.format(dtf), count, sum.setScale(2, RoundingMode.HALF_UP)));
        }
        summary.setSalesTrend(trend);

        return summary;
    }
}
