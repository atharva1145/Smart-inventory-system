package com.smartinventory.order;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items WHERE o.orderNumber = :orderNumber")
    Optional<Order> findByOrderNumberWithItems(@Param("orderNumber") String orderNumber);

    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    boolean existsByOrderNumber(String orderNumber);

    @Query("SELECT o FROM Order o " +
           "JOIN FETCH o.customer c " +
           "WHERE (:status IS NULL OR o.status = :status) " +
           "AND (:customerId IS NULL OR c.id = :customerId) " +
           "AND (:search IS NULL OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Order> searchOrders(
            @Param("search") String search,
            @Param("status") OrderStatus status,
            @Param("customerId") Long customerId,
            Pageable pageable
    );

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :since")
    long countOrdersCreatedSince(@Param("since") Instant since);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status IN :statuses")
    long countByStatusIn(@Param("statuses") List<OrderStatus> statuses);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = :status")
    long countByStatus(@Param("status") OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0.0) FROM Order o WHERE o.status = :status")
    Double sumTotalAmountByStatus(@Param("status") OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0.0) FROM Order o WHERE o.status <> 'CANCELLED'")
    Double sumTotalOrderValue();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.customer.id = :customerId AND o.status <> 'CANCELLED'")
    long countOrdersByCustomerId(@Param("customerId") Long customerId);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0.0) FROM Order o WHERE o.customer.id = :customerId AND o.status <> 'CANCELLED'")
    Double sumSpendByCustomerId(@Param("customerId") Long customerId);

    @Query("SELECT o FROM Order o JOIN FETCH o.customer ORDER BY o.createdAt DESC")
    List<Order> findRecentOrders(Pageable pageable);
}
