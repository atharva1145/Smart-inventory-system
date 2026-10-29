package com.smartinventory.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {

    @Query("SELECT m FROM InventoryMovement m " +
           "JOIN FETCH m.product p " +
           "JOIN FETCH m.warehouse w " +
           "WHERE (:productId IS NULL OR p.id = :productId) " +
           "AND (:movementType IS NULL OR m.movementType = :movementType) " +
           "ORDER BY m.createdAt DESC")
    Page<InventoryMovement> searchMovements(
            @Param("productId") Long productId,
            @Param("movementType") MovementType movementType,
            Pageable pageable
    );

    @Query("SELECT m FROM InventoryMovement m " +
           "JOIN FETCH m.product p " +
           "JOIN FETCH m.warehouse w " +
           "ORDER BY m.createdAt DESC")
    List<InventoryMovement> findRecentMovements(Pageable pageable);
}
