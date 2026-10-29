package com.smartinventory.purchaseorder;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    Optional<PurchaseOrder> findByPoNumber(String poNumber);

    @Query("SELECT po FROM PurchaseOrder po LEFT JOIN FETCH po.items WHERE po.id = :id")
    Optional<PurchaseOrder> findByIdWithItems(@Param("id") Long id);

    boolean existsByPoNumber(String poNumber);

    @Query("SELECT po FROM PurchaseOrder po " +
           "JOIN FETCH po.supplier s " +
           "WHERE (:status IS NULL OR po.status = :status) " +
           "AND (:supplierId IS NULL OR s.id = :supplierId) " +
           "AND (:search IS NULL OR LOWER(po.poNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<PurchaseOrder> searchPurchaseOrders(
            @Param("search") String search,
            @Param("status") PurchaseOrderStatus status,
            @Param("supplierId") Long supplierId,
            Pageable pageable
    );

    long countByStatus(PurchaseOrderStatus status);
}
