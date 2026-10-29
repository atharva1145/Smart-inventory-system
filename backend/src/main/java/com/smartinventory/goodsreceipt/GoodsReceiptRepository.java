package com.smartinventory.goodsreceipt;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoodsReceiptRepository extends JpaRepository<GoodsReceipt, Long> {

    @Query("SELECT gr FROM GoodsReceipt gr " +
           "JOIN FETCH gr.purchaseOrder po " +
           "JOIN FETCH gr.warehouse w " +
           "WHERE (:purchaseOrderId IS NULL OR po.id = :purchaseOrderId) " +
           "AND (:search IS NULL OR LOWER(gr.receiptNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(po.poNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<GoodsReceipt> searchGoodsReceipts(
            @Param("search") String search,
            @Param("purchaseOrderId") Long purchaseOrderId,
            Pageable pageable
    );

    List<GoodsReceipt> findByPurchaseOrderId(Long purchaseOrderId);
}
