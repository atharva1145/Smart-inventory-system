package com.smartinventory.stocktransfer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StockTransferRepository extends JpaRepository<StockTransfer, Long> {

    Optional<StockTransfer> findByTransferNumber(String transferNumber);

    @Query("SELECT st FROM StockTransfer st " +
           "LEFT JOIN FETCH st.items " +
           "WHERE st.id = :id")
    Optional<StockTransfer> findByIdWithItems(@Param("id") Long id);

    @Query("SELECT st FROM StockTransfer st " +
           "JOIN FETCH st.sourceWarehouse sw " +
           "JOIN FETCH st.destinationWarehouse dw " +
           "WHERE (:status IS NULL OR st.status = :status) " +
           "AND (:warehouseId IS NULL OR sw.id = :warehouseId OR dw.id = :warehouseId) " +
           "AND (:search IS NULL OR LOWER(st.transferNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<StockTransfer> searchTransfers(
            @Param("search") String search,
            @Param("status") StockTransferStatus status,
            @Param("warehouseId") Long warehouseId,
            Pageable pageable
    );
}
