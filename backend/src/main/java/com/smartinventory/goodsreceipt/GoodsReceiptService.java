package com.smartinventory.goodsreceipt;

import com.smartinventory.common.exception.BadRequestException;
import com.smartinventory.common.exception.ResourceNotFoundException;
import com.smartinventory.goodsreceipt.dto.*;
import com.smartinventory.inventory.InventoryService;
import com.smartinventory.product.Product;
import com.smartinventory.product.ProductRepository;
import com.smartinventory.purchaseorder.*;
import com.smartinventory.warehouse.Warehouse;
import com.smartinventory.warehouse.WarehouseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
public class GoodsReceiptService {

    private static final AtomicLong REC_SEQ = new AtomicLong(System.currentTimeMillis() % 100000);

    private final GoodsReceiptRepository goodsReceiptRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;

    public GoodsReceiptService(GoodsReceiptRepository goodsReceiptRepository,
                               PurchaseOrderRepository purchaseOrderRepository,
                               WarehouseRepository warehouseRepository,
                               ProductRepository productRepository,
                               InventoryService inventoryService) {
        this.goodsReceiptRepository = goodsReceiptRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.warehouseRepository = warehouseRepository;
        this.productRepository = productRepository;
        this.inventoryService = inventoryService;
    }

    @Transactional(readOnly = true)
    public Page<GoodsReceiptDTO> searchGoodsReceipts(String search, Long poId, Pageable pageable) {
        return goodsReceiptRepository.searchGoodsReceipts(search, poId, pageable).map(GoodsReceiptDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<GoodsReceiptDTO> getReceiptsByPurchaseOrder(Long purchaseOrderId) {
        return goodsReceiptRepository.findByPurchaseOrderId(purchaseOrderId).stream()
                .map(GoodsReceiptDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public GoodsReceiptDTO recordGoodsReceipt(CreateGoodsReceiptRequest request, String actorUsername) {
        PurchaseOrder po = purchaseOrderRepository.findById(request.getPurchaseOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", "id", request.getPurchaseOrderId()));

        if (po.getStatus() != PurchaseOrderStatus.APPROVED && po.getStatus() != PurchaseOrderStatus.PARTIALLY_RECEIVED) {
            throw new BadRequestException("Goods receipt can only be recorded for APPROVED or PARTIALLY_RECEIVED purchase orders. Current status: " + po.getStatus());
        }

        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", request.getWarehouseId()));

        String receiptNumber = generateReceiptNumber();
        GoodsReceipt receipt = new GoodsReceipt(receiptNumber, po, warehouse, actorUsername, request.getNotes());

        for (CreateGoodsReceiptItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemReq.getProductId()));

            PurchaseOrderItem poItem = po.getItems().stream()
                    .filter(i -> i.getProduct().getId().equals(product.getId()))
                    .findFirst()
                    .orElseThrow(() -> new BadRequestException("Product " + product.getSku() + " does not belong to Purchase Order " + po.getPoNumber()));

            int outstanding = poItem.getOutstandingQuantity();
            if (itemReq.getQuantityReceived() > outstanding) {
                throw new BadRequestException(String.format(
                        "Received quantity (%d) exceeds outstanding quantity (%d) for product '%s'",
                        itemReq.getQuantityReceived(), outstanding, product.getSku()
                ));
            }

            // Update PO line received quantity
            poItem.setReceivedQuantity(poItem.getReceivedQuantity() + itemReq.getQuantityReceived());

            // Atomically increase on-hand inventory balance and log movement
            inventoryService.receiveStock(product.getId(), warehouse.getId(), itemReq.getQuantityReceived(), po.getPoNumber(), actorUsername);

            GoodsReceiptItem grItem = new GoodsReceiptItem(product, itemReq.getQuantityReceived());
            receipt.addItem(grItem);
        }

        // Update PO status based on whether all line items are fulfilled
        boolean allFullyReceived = po.getItems().stream().allMatch(i -> i.getReceivedQuantity().equals(i.getOrderedQuantity()));
        if (allFullyReceived) {
            po.setStatus(PurchaseOrderStatus.RECEIVED);
        } else {
            po.setStatus(PurchaseOrderStatus.PARTIALLY_RECEIVED);
        }
        purchaseOrderRepository.save(po);

        return GoodsReceiptDTO.fromEntity(goodsReceiptRepository.save(receipt));
    }

    private synchronized String generateReceiptNumber() {
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        long seq = REC_SEQ.incrementAndGet();
        return String.format("REC-%s-%04d", datePart, seq % 10000);
    }
}
