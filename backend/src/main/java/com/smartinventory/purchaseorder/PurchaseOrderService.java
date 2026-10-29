package com.smartinventory.purchaseorder;

import com.smartinventory.common.exception.BadRequestException;
import com.smartinventory.common.exception.InvalidStateTransitionException;
import com.smartinventory.common.exception.ResourceNotFoundException;
import com.smartinventory.product.Product;
import com.smartinventory.product.ProductRepository;
import com.smartinventory.purchaseorder.dto.*;
import com.smartinventory.supplier.Supplier;
import com.smartinventory.supplier.SupplierRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class PurchaseOrderService {

    private static final AtomicLong PO_SEQ = new AtomicLong(System.currentTimeMillis() % 100000);

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;

    public PurchaseOrderService(PurchaseOrderRepository purchaseOrderRepository,
                                SupplierRepository supplierRepository,
                                ProductRepository productRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.supplierRepository = supplierRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public Page<PurchaseOrderDTO> searchPurchaseOrders(String search, PurchaseOrderStatus status, Long supplierId, Pageable pageable) {
        return purchaseOrderRepository.searchPurchaseOrders(search, status, supplierId, pageable)
                .map(PurchaseOrderDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public PurchaseOrderDTO getPurchaseOrderById(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", "id", id));
        return PurchaseOrderDTO.fromEntity(po);
    }

    @Transactional
    public PurchaseOrderDTO createPurchaseOrder(CreatePurchaseOrderRequest request, String actorUsername) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", request.getSupplierId()));

        String poNumber = generatePoNumber();
        BigDecimal totalCost = BigDecimal.ZERO;

        PurchaseOrder po = new PurchaseOrder(
                poNumber,
                supplier,
                PurchaseOrderStatus.DRAFT,
                request.getExpectedDeliveryDate(),
                BigDecimal.ZERO,
                request.getNotes(),
                actorUsername
        );

        for (CreatePurchaseOrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemReq.getProductId()));

            BigDecimal unitCost = itemReq.getUnitCost() != null ? itemReq.getUnitCost() : product.getCostPrice();
            BigDecimal lineTotal = unitCost.multiply(BigDecimal.valueOf(itemReq.getOrderedQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            totalCost = totalCost.add(lineTotal);

            PurchaseOrderItem item = new PurchaseOrderItem(product, itemReq.getOrderedQuantity(), unitCost, lineTotal);
            po.addItem(item);
        }

        po.setTotalCost(totalCost);
        return PurchaseOrderDTO.fromEntity(purchaseOrderRepository.save(po));
    }

    @Transactional
    public PurchaseOrderDTO approvePurchaseOrder(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", "id", id));

        if (!po.getStatus().canTransitionTo(PurchaseOrderStatus.APPROVED)) {
            throw new InvalidStateTransitionException("PurchaseOrder " + po.getPoNumber(), po.getStatus().name(), PurchaseOrderStatus.APPROVED.name());
        }

        po.setStatus(PurchaseOrderStatus.APPROVED);
        return PurchaseOrderDTO.fromEntity(purchaseOrderRepository.save(po));
    }

    @Transactional
    public PurchaseOrderDTO cancelPurchaseOrder(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", "id", id));

        if (!po.getStatus().canTransitionTo(PurchaseOrderStatus.CANCELLED)) {
            throw new InvalidStateTransitionException("PurchaseOrder " + po.getPoNumber(), po.getStatus().name(), PurchaseOrderStatus.CANCELLED.name());
        }

        po.setStatus(PurchaseOrderStatus.CANCELLED);
        return PurchaseOrderDTO.fromEntity(purchaseOrderRepository.save(po));
    }

    private synchronized String generatePoNumber() {
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        long seq = PO_SEQ.incrementAndGet();
        return String.format("PO-%s-%04d", datePart, seq % 10000);
    }
}
