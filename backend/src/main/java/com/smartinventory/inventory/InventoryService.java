package com.smartinventory.inventory;

import com.smartinventory.common.exception.BadRequestException;
import com.smartinventory.common.exception.InsufficientStockException;
import com.smartinventory.common.exception.ResourceNotFoundException;
import com.smartinventory.inventory.dto.*;
import com.smartinventory.notification.NotificationService;
import com.smartinventory.notification.NotificationType;
import com.smartinventory.product.Product;
import com.smartinventory.product.ProductRepository;
import com.smartinventory.supplier.Supplier;
import com.smartinventory.supplier.SupplierRepository;
import com.smartinventory.warehouse.Warehouse;
import com.smartinventory.warehouse.WarehouseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryService.class);

    private final InventoryBalanceRepository balanceRepository;
    private final InventoryMovementRepository movementRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final NotificationService notificationService;
    private final SupplierRepository supplierRepository;

    public InventoryService(InventoryBalanceRepository balanceRepository,
                            InventoryMovementRepository movementRepository,
                            ProductRepository productRepository,
                            WarehouseRepository warehouseRepository,
                            NotificationService notificationService,
                            SupplierRepository supplierRepository) {
        this.balanceRepository = balanceRepository;
        this.movementRepository = movementRepository;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
        this.notificationService = notificationService;
        this.supplierRepository = supplierRepository;
    }

    @Transactional(readOnly = true)
    public Page<InventoryOverviewDTO> getInventoryOverview(String search, Long warehouseId, boolean lowStockOnly, Pageable pageable) {
        return balanceRepository.findInventoryOverview(search, warehouseId, lowStockOnly, pageable)
                .map(InventoryOverviewDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<InventoryOverviewDTO> getInventoryByProduct(Long productId) {
        return balanceRepository.findByProductId(productId).stream()
                .map(InventoryOverviewDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public InventoryBalance initializeStock(Product product, Warehouse warehouse, int initialStock, String actorUsername) {
        InventoryBalance balance = balanceRepository.findByProductIdAndWarehouseId(product.getId(), warehouse.getId())
                .orElse(new InventoryBalance(product, warehouse, 0, 0));

        if (initialStock > 0) {
            balance.setOnHandQuantity(balance.getOnHandQuantity() + initialStock);
            balance = balanceRepository.save(balance);

            InventoryMovement movement = new InventoryMovement(
                    product,
                    warehouse,
                    MovementType.INITIAL_STOCK,
                    initialStock,
                    "INITIAL_STOCK",
                    "INIT-" + product.getSku(),
                    actorUsername,
                    "Initial stock entry on product creation"
            );
            movementRepository.save(movement);
        } else {
            balance = balanceRepository.save(balance);
        }

        return balance;
    }

    @Transactional
    public InventoryOverviewDTO adjustStock(AdjustStockRequest request, String actorUsername) {
        if (request.getQuantityChange() == 0) {
            throw new BadRequestException("Quantity change cannot be zero");
        }

        InventoryBalance balance = balanceRepository.findByProductIdAndWarehouseIdForUpdate(
                request.getProductId(), request.getWarehouseId()
        ).orElseThrow(() -> new ResourceNotFoundException("InventoryBalance not found for product ID "
                + request.getProductId() + " and warehouse ID " + request.getWarehouseId()));

        int currentOnHand = balance.getOnHandQuantity();
        int newOnHand = currentOnHand + request.getQuantityChange();

        if (newOnHand < 0) {
            throw new BadRequestException("On-hand quantity cannot become negative. Current: " + currentOnHand
                    + ", attempted change: " + request.getQuantityChange());
        }

        if (newOnHand < balance.getReservedQuantity()) {
            throw new BadRequestException("On-hand quantity (" + newOnHand + ") cannot be less than reserved quantity ("
                    + balance.getReservedQuantity() + ")");
        }

        balance.setOnHandQuantity(newOnHand);
        balanceRepository.save(balance);

        MovementType movementType = request.getQuantityChange() > 0
                ? MovementType.MANUAL_ADJUSTMENT_ADD
                : MovementType.MANUAL_ADJUSTMENT_DEDUCT;

        InventoryMovement movement = new InventoryMovement(
                balance.getProduct(),
                balance.getWarehouse(),
                movementType,
                request.getQuantityChange(),
                "MANUAL_ADJUSTMENT",
                "ADJ-" + System.currentTimeMillis(),
                actorUsername,
                request.getReason()
        );
        movementRepository.save(movement);

        checkLowStockAlert(balance);

        return InventoryOverviewDTO.fromEntity(balance);
    }

    /**
     * Concurrency-safe stock reservation using Pessimistic Write Lock.
     * Throws InsufficientStockException if requested stock exceeds available stock.
     */
    @Transactional
    public InventoryBalance reserveStock(Long productId, Long warehouseId, int quantity, String orderNumber, String actorUsername) {
        if (quantity <= 0) {
            throw new BadRequestException("Reservation quantity must be strictly greater than zero");
        }

        InventoryBalance balance = balanceRepository.findByProductIdAndWarehouseIdForUpdate(productId, warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryBalance not found for product ID: " + productId));

        int available = balance.getAvailableQuantity();
        if (available < quantity) {
            log.warn("Oversell prevented for SKU '{}'. Requested: {}, Available: {}",
                    balance.getProduct().getSku(), quantity, available);
            throw new InsufficientStockException(balance.getProduct().getSku(), quantity, available);
        }

        balance.setReservedQuantity(balance.getReservedQuantity() + quantity);
        balanceRepository.save(balance);

        InventoryMovement movement = new InventoryMovement(
                balance.getProduct(),
                balance.getWarehouse(),
                MovementType.ORDER_RESERVED,
                quantity,
                "ORDER",
                orderNumber,
                actorUsername,
                "Stock reserved for Order " + orderNumber
        );
        movementRepository.save(movement);

        checkLowStockAlert(balance);

        return balance;
    }

    /**
     * Concurrency-safe stock release when an eligible order is cancelled.
     */
    @Transactional
    public InventoryBalance releaseStock(Long productId, Long warehouseId, int quantity, String orderNumber, String actorUsername) {
        if (quantity <= 0) {
            return null;
        }

        InventoryBalance balance = balanceRepository.findByProductIdAndWarehouseIdForUpdate(productId, warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryBalance not found for product ID: " + productId));

        int newReserved = Math.max(0, balance.getReservedQuantity() - quantity);
        balance.setReservedQuantity(newReserved);
        balanceRepository.save(balance);

        InventoryMovement movement = new InventoryMovement(
                balance.getProduct(),
                balance.getWarehouse(),
                MovementType.ORDER_RELEASED,
                -quantity,
                "ORDER",
                orderNumber,
                actorUsername,
                "Stock reservation released due to cancellation of Order " + orderNumber
        );
        movementRepository.save(movement);

        return balance;
    }

    /**
     * Concurrency-safe stock fulfillment when order moves to fulfilled/delivered.
     */
    @Transactional
    public InventoryBalance fulfillStock(Long productId, Long warehouseId, int quantity, String orderNumber, String actorUsername) {
        if (quantity <= 0) {
            return null;
        }

        InventoryBalance balance = balanceRepository.findByProductIdAndWarehouseIdForUpdate(productId, warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryBalance not found for product ID: " + productId));

        int newOnHand = Math.max(0, balance.getOnHandQuantity() - quantity);
        int newReserved = Math.max(0, balance.getReservedQuantity() - quantity);

        balance.setOnHandQuantity(newOnHand);
        balance.setReservedQuantity(newReserved);
        balanceRepository.save(balance);

        InventoryMovement movement = new InventoryMovement(
                balance.getProduct(),
                balance.getWarehouse(),
                MovementType.ORDER_FULFILLED,
                -quantity,
                "ORDER",
                orderNumber,
                actorUsername,
                "Stock fulfilled for Order " + orderNumber
        );
        movementRepository.save(movement);

        checkLowStockAlert(balance);

        return balance;
    }

    /**
     * Concurrency-safe stock receipt from supplier delivery.
     */
    @Transactional
    public InventoryBalance receiveStock(Long productId, Long warehouseId, int quantity, String poNumber, String actorUsername) {
        if (quantity <= 0) {
            throw new BadRequestException("Received quantity must be strictly greater than zero");
        }

        InventoryBalance balance = balanceRepository.findByProductIdAndWarehouseIdForUpdate(productId, warehouseId)
                .orElseGet(() -> {
                    Product product = productRepository.findById(productId)
                            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
                    Warehouse warehouse = warehouseRepository.findById(warehouseId)
                            .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", warehouseId));
                    return new InventoryBalance(product, warehouse, 0, 0);
                });

        balance.setOnHandQuantity(balance.getOnHandQuantity() + quantity);
        balanceRepository.save(balance);

        InventoryMovement movement = new InventoryMovement(
                balance.getProduct(),
                balance.getWarehouse(),
                MovementType.PURCHASE_RECEIPT,
                quantity,
                "PURCHASE_ORDER",
                poNumber,
                actorUsername,
                "Goods received for Purchase Order " + poNumber
        );
        movementRepository.save(movement);

        return balance;
    }

    @Transactional(readOnly = true)
    public Page<MovementDTO> getMovements(Long productId, MovementType movementType, Pageable pageable) {
        return movementRepository.searchMovements(productId, movementType, pageable)
                .map(MovementDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<MovementDTO> getRecentMovements(Pageable pageable) {
        return movementRepository.findRecentMovements(pageable).stream()
                .map(MovementDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InventoryOverviewDTO> getLowStockAlerts() {
        return balanceRepository.findLowStockBalances().stream()
                .map(InventoryOverviewDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RestockSuggestionDTO> getRestockSuggestions() {
        List<InventoryBalance> lowStockBalances = balanceRepository.findLowStockBalances();
        List<Supplier> activeSuppliers = supplierRepository.findByActiveTrue();
        Supplier defaultSupplier = activeSuppliers.isEmpty() ? null : activeSuppliers.get(0);

        List<RestockSuggestionDTO> suggestions = new java.util.ArrayList<>();
        for (InventoryBalance b : lowStockBalances) {
            Product p = b.getProduct();
            int available = b.getAvailableQuantity();
            int reorder = p.getReorderLevel();
            int deficit = Math.max(0, reorder - available);
            int suggestedQty = Math.max(10, (reorder * 2) - available);
            BigDecimal unitCost = p.getCostPrice();
            BigDecimal estimatedCost = unitCost.multiply(BigDecimal.valueOf(suggestedQty));

            double burnRate = Math.max(0.5, Math.round(((double) Math.max(5, reorder) / 10.0) * 10.0) / 10.0);
            int daysUntilStockout = available <= 0 ? 0 : Math.max(1, (int) Math.round(available / burnRate));
            String risk = available <= 0 ? "OUT_OF_STOCK" : (daysUntilStockout <= 5 ? "CRITICAL" : "WARNING");

            suggestions.add(new RestockSuggestionDTO(
                    p.getId(),
                    p.getSku(),
                    p.getName(),
                    p.getCategory() != null ? p.getCategory().getName() : "General",
                    available,
                    reorder,
                    deficit,
                    suggestedQty,
                    unitCost,
                    estimatedCost,
                    defaultSupplier != null ? defaultSupplier.getId() : null,
                    defaultSupplier != null ? defaultSupplier.getName() : "Standard Supplier",
                    burnRate,
                    daysUntilStockout,
                    risk
            ));
        }
        return suggestions;
    }

    @Transactional(readOnly = true)
    public ValuationReportDTO getValuationReport() {
        List<InventoryBalance> allBalances = balanceRepository.findAll();
        long totalProducts = allBalances.stream().map(b -> b.getProduct().getId()).distinct().count();
        long totalOnHandUnits = allBalances.stream().mapToLong(InventoryBalance::getOnHandQuantity).sum();

        BigDecimal totalValuation = BigDecimal.ZERO;
        BigDecimal totalRetailValue = BigDecimal.ZERO;

        List<ValuationReportDTO.ValuationItemDTO> items = new java.util.ArrayList<>();
        for (InventoryBalance b : allBalances) {
            Product p = b.getProduct();
            int qty = b.getOnHandQuantity();
            BigDecimal cost = p.getCostPrice();
            BigDecimal sell = p.getSellingPrice();
            BigDecimal itemTotalCost = cost.multiply(BigDecimal.valueOf(qty));
            BigDecimal itemRetailValue = sell.multiply(BigDecimal.valueOf(qty));
            BigDecimal itemProfit = itemRetailValue.subtract(itemTotalCost);
            BigDecimal margin = sell.compareTo(BigDecimal.ZERO) > 0
                    ? sell.subtract(cost).divide(sell, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;

            totalValuation = totalValuation.add(itemTotalCost);
            totalRetailValue = totalRetailValue.add(itemRetailValue);

            items.add(new ValuationReportDTO.ValuationItemDTO(
                    p.getId(),
                    p.getSku(),
                    p.getName(),
                    p.getCategory() != null ? p.getCategory().getName() : "Uncategorized",
                    qty,
                    cost,
                    itemTotalCost,
                    sell,
                    itemRetailValue,
                    itemProfit,
                    margin
            ));
        }

        BigDecimal totalProfit = totalRetailValue.subtract(totalValuation);
        BigDecimal avgMargin = totalRetailValue.compareTo(BigDecimal.ZERO) > 0
                ? totalProfit.divide(totalRetailValue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        return new ValuationReportDTO(totalProducts, totalOnHandUnits, totalValuation, totalRetailValue, totalProfit, avgMargin, items);
    }

    @Transactional(readOnly = true)
    public String exportInventoryCsv() {
        List<InventoryBalance> balances = balanceRepository.findAll();
        StringBuilder sb = new StringBuilder();
        sb.append("Product ID,SKU,Product Name,Category,Warehouse,On Hand,Reserved,Available,Reorder Level,Cost Price,Selling Price\n");
        for (InventoryBalance b : balances) {
            Product p = b.getProduct();
            Warehouse w = b.getWarehouse();
            sb.append(p.getId()).append(",");
            sb.append('"').append(p.getSku()).append("\",");
            sb.append('"').append(p.getName().replace("\"", "\"\"")).append("\",");
            sb.append('"').append(p.getCategory() != null ? p.getCategory().getName().replace("\"", "\"\"") : "Uncategorized").append("\",");
            sb.append('"').append(w.getName().replace("\"", "\"\"")).append("\",");
            sb.append(b.getOnHandQuantity()).append(",");
            sb.append(b.getReservedQuantity()).append(",");
            sb.append(b.getAvailableQuantity()).append(",");
            sb.append(p.getReorderLevel()).append(",");
            sb.append(p.getCostPrice()).append(",");
            sb.append(p.getSellingPrice()).append("\n");
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public String exportMovementsCsv() {
        List<InventoryMovement> movements = movementRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        StringBuilder sb = new StringBuilder();
        sb.append("Movement ID,Date,Product SKU,Product Name,Warehouse,Type,Quantity Change,Reference ID,Actor,Reason\n");
        for (InventoryMovement m : movements) {
            sb.append(m.getId()).append(",");
            sb.append('"').append(m.getCreatedAt()).append("\",");
            sb.append('"').append(m.getProduct().getSku()).append("\",");
            sb.append('"').append(m.getProduct().getName().replace("\"", "\"\"")).append("\",");
            sb.append('"').append(m.getWarehouse().getName().replace("\"", "\"\"")).append("\",");
            sb.append(m.getMovementType()).append(",");
            sb.append(m.getQuantityChange()).append(",");
            sb.append('"').append(m.getReferenceId() != null ? m.getReferenceId() : "").append("\",");
            sb.append('"').append(m.getActorUsername()).append("\",");
            sb.append('"').append(m.getReason() != null ? m.getReason().replace("\"", "\"\"") : "").append("\"\n");
        }
        return sb.toString();
    }

    private void checkLowStockAlert(InventoryBalance balance) {
        int available = balance.getAvailableQuantity();
        int reorderLevel = balance.getProduct().getReorderLevel();
        if (available <= 0) {
            notificationService.createNotificationIfNotExists(
                    NotificationType.OUT_OF_STOCK,
                    "Out of Stock: " + balance.getProduct().getName(),
                    "Product " + balance.getProduct().getSku() + " is completely out of stock in " + balance.getWarehouse().getName(),
                    balance.getProduct().getSku()
            );
        } else if (available <= reorderLevel) {
            notificationService.createNotificationIfNotExists(
                    NotificationType.LOW_STOCK,
                    "Low Stock Alert: " + balance.getProduct().getName(),
                    "Product " + balance.getProduct().getSku() + " has " + available + " available units (reorder level is " + reorderLevel + ")",
                    balance.getProduct().getSku()
            );
        }
    }
}
