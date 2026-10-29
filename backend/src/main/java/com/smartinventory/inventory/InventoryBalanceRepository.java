package com.smartinventory.inventory;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryBalanceRepository extends JpaRepository<InventoryBalance, Long> {

    Optional<InventoryBalance> findByProductIdAndWarehouseId(Long productId, Long warehouseId);

    List<InventoryBalance> findByProductId(Long productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM InventoryBalance b WHERE b.product.id = :productId AND b.warehouse.id = :warehouseId")
    Optional<InventoryBalance> findByProductIdAndWarehouseIdForUpdate(
            @Param("productId") Long productId,
            @Param("warehouseId") Long warehouseId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM InventoryBalance b WHERE b.product.id IN :productIds ORDER BY b.product.id ASC")
    List<InventoryBalance> findAllByProductIdsForUpdate(@Param("productIds") List<Long> productIds);

    @Query("SELECT b FROM InventoryBalance b " +
           "JOIN FETCH b.product p " +
           "JOIN FETCH b.warehouse w " +
           "WHERE (:warehouseId IS NULL OR w.id = :warehouseId) " +
           "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:lowStockOnly = false OR (b.onHandQuantity - b.reservedQuantity) <= p.reorderLevel)")
    Page<InventoryBalance> findInventoryOverview(
            @Param("search") String search,
            @Param("warehouseId") Long warehouseId,
            @Param("lowStockOnly") boolean lowStockOnly,
            Pageable pageable
    );

    @Query("SELECT b FROM InventoryBalance b " +
           "JOIN FETCH b.product p " +
           "WHERE (b.onHandQuantity - b.reservedQuantity) <= p.reorderLevel")
    List<InventoryBalance> findLowStockBalances();

    @Query("SELECT COALESCE(SUM(b.onHandQuantity), 0) FROM InventoryBalance b")
    long sumTotalOnHandUnits();

    @Query("SELECT COALESCE(SUM(b.onHandQuantity * p.costPrice), 0.0) FROM InventoryBalance b JOIN b.product p")
    Double sumInventoryValuationAtCost();

    @Query("SELECT COUNT(b) FROM InventoryBalance b JOIN b.product p WHERE (b.onHandQuantity - b.reservedQuantity) <= p.reorderLevel")
    long countLowStockItems();

    @Query("SELECT COUNT(b) FROM InventoryBalance b WHERE (b.onHandQuantity - b.reservedQuantity) <= 0")
    long countOutOfStockItems();
}
