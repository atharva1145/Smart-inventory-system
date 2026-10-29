package com.smartinventory.stocktransfer;

import com.smartinventory.common.exception.BadRequestException;
import com.smartinventory.common.exception.InsufficientStockException;
import com.smartinventory.common.exception.InvalidStateTransitionException;
import com.smartinventory.common.exception.ResourceNotFoundException;
import com.smartinventory.inventory.InventoryBalance;
import com.smartinventory.inventory.InventoryBalanceRepository;
import com.smartinventory.inventory.InventoryMovement;
import com.smartinventory.inventory.InventoryMovementRepository;
import com.smartinventory.inventory.MovementType;
import com.smartinventory.product.Product;
import com.smartinventory.product.ProductRepository;
import com.smartinventory.stocktransfer.dto.CreateStockTransferItemRequest;
import com.smartinventory.stocktransfer.dto.CreateStockTransferRequest;
import com.smartinventory.stocktransfer.dto.StockTransferDTO;
import com.smartinventory.stocktransfer.dto.StockTransferItemDTO;
import com.smartinventory.warehouse.Warehouse;
import com.smartinventory.warehouse.WarehouseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class StockTransferService {

    private static final Logger log = LoggerFactory.getLogger(StockTransferService.class);

    private final StockTransferRepository stockTransferRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final InventoryBalanceRepository balanceRepository;
    private final InventoryMovementRepository movementRepository;

    public StockTransferService(
            StockTransferRepository stockTransferRepository,
            WarehouseRepository warehouseRepository,
            ProductRepository productRepository,
            InventoryBalanceRepository balanceRepository,
            InventoryMovementRepository movementRepository) {
        this.stockTransferRepository = stockTransferRepository;
        this.warehouseRepository = warehouseRepository;
        this.productRepository = productRepository;
        this.balanceRepository = balanceRepository;
        this.movementRepository = movementRepository;
    }

    @Transactional
    public StockTransferDTO createTransfer(CreateStockTransferRequest request, String username) {
        if (request.getSourceWarehouseId().equals(request.getDestinationWarehouseId())) {
            throw new BadRequestException("Source and destination warehouses cannot be the same.");
        }

        Warehouse sourceWarehouse = warehouseRepository.findById(request.getSourceWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Source warehouse", "id", request.getSourceWarehouseId()));

        Warehouse destWarehouse = warehouseRepository.findById(request.getDestinationWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination warehouse", "id", request.getDestinationWarehouseId()));

        String transferNumber = generateTransferNumber();
        StockTransfer transfer = new StockTransfer(transferNumber, sourceWarehouse, destWarehouse, request.getNotes(), username);

        // Deterministic sort by productId to prevent deadlocks
        List<CreateStockTransferItemRequest> sortedItems = new ArrayList<>(request.getItems());
        sortedItems.sort(Comparator.comparing(CreateStockTransferItemRequest::getProductId));

        for (CreateStockTransferItemRequest itemReq : sortedItems) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemReq.getProductId()));

            InventoryBalance balance = balanceRepository.findByProductIdAndWarehouseIdForUpdate(product.getId(), sourceWarehouse.getId())
                    .orElseThrow(() -> new InsufficientStockException(product.getSku(), itemReq.getQuantity(), 0));

            if (balance.getAvailableQuantity() < itemReq.getQuantity()) {
                throw new InsufficientStockException(product.getSku(), itemReq.getQuantity(), balance.getAvailableQuantity());
            }

            // Reserve stock at source
            balance.setReservedQuantity(balance.getReservedQuantity() + itemReq.getQuantity());
            balanceRepository.save(balance);

            transfer.addItem(new StockTransferItem(product, itemReq.getQuantity()));
        }

        StockTransfer saved = stockTransferRepository.save(transfer);
        log.info("Stock transfer {} created by {}", saved.getTransferNumber(), username);
        return mapToDTO(saved);
    }

    @Transactional
    public StockTransferDTO dispatchTransfer(Long id, String username) {
        StockTransfer transfer = stockTransferRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("StockTransfer", "id", id));

        if (!transfer.getStatus().canTransitionTo(StockTransferStatus.IN_TRANSIT)) {
            throw new InvalidStateTransitionException("StockTransfer", transfer.getStatus().name(), StockTransferStatus.IN_TRANSIT.name());
        }

        Warehouse source = transfer.getSourceWarehouse();

        for (StockTransferItem item : transfer.getItems()) {
            Product product = item.getProduct();
            InventoryBalance balance = balanceRepository.findByProductIdAndWarehouseIdForUpdate(product.getId(), source.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("InventoryBalance", "productId", product.getId()));

            // Deduct on-hand and reserved
            balance.setOnHandQuantity(balance.getOnHandQuantity() - item.getQuantity());
            balance.setReservedQuantity(balance.getReservedQuantity() - item.getQuantity());
            balanceRepository.save(balance);

            // Record immutable TRANSFER_OUT movement
            movementRepository.save(new InventoryMovement(
                    product, source, MovementType.TRANSFER_OUT,
                    -item.getQuantity(), "TRANSFER", transfer.getTransferNumber(), username,
                    "Dispatched to " + transfer.getDestinationWarehouse().getName()
            ));
        }

        transfer.setStatus(StockTransferStatus.IN_TRANSIT);
        transfer.setDispatchedBy(username);
        transfer.setDispatchedAt(Instant.now());

        StockTransfer updated = stockTransferRepository.save(transfer);
        log.info("Stock transfer {} dispatched by {}", updated.getTransferNumber(), username);
        return mapToDTO(updated);
    }

    @Transactional
    public StockTransferDTO receiveTransfer(Long id, String username) {
        StockTransfer transfer = stockTransferRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("StockTransfer", "id", id));

        if (!transfer.getStatus().canTransitionTo(StockTransferStatus.COMPLETED)) {
            throw new InvalidStateTransitionException("StockTransfer", transfer.getStatus().name(), StockTransferStatus.COMPLETED.name());
        }

        Warehouse dest = transfer.getDestinationWarehouse();

        for (StockTransferItem item : transfer.getItems()) {
            Product product = item.getProduct();
            InventoryBalance balance = balanceRepository.findByProductIdAndWarehouseIdForUpdate(product.getId(), dest.getId())
                    .orElseGet(() -> new InventoryBalance(product, dest, 0, 0));

            // Increase physical on-hand at destination
            balance.setOnHandQuantity(balance.getOnHandQuantity() + item.getQuantity());
            balanceRepository.save(balance);

            // Record immutable TRANSFER_IN movement
            movementRepository.save(new InventoryMovement(
                    product, dest, MovementType.TRANSFER_IN,
                    item.getQuantity(), "TRANSFER", transfer.getTransferNumber(), username,
                    "Received from " + transfer.getSourceWarehouse().getName()
            ));
        }

        transfer.setStatus(StockTransferStatus.COMPLETED);
        transfer.setReceivedBy(username);
        transfer.setReceivedAt(Instant.now());

        StockTransfer updated = stockTransferRepository.save(transfer);
        log.info("Stock transfer {} received by {}", updated.getTransferNumber(), username);
        return mapToDTO(updated);
    }

    @Transactional
    public StockTransferDTO cancelTransfer(Long id, String username) {
        StockTransfer transfer = stockTransferRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("StockTransfer", "id", id));

        if (!transfer.getStatus().canTransitionTo(StockTransferStatus.CANCELLED)) {
            throw new InvalidStateTransitionException("StockTransfer", transfer.getStatus().name(), StockTransferStatus.CANCELLED.name());
        }

        Warehouse source = transfer.getSourceWarehouse();

        // Release reserved stock at source
        for (StockTransferItem item : transfer.getItems()) {
            Product product = item.getProduct();
            balanceRepository.findByProductIdAndWarehouseIdForUpdate(product.getId(), source.getId())
                    .ifPresent(balance -> {
                        balance.setReservedQuantity(Math.max(0, balance.getReservedQuantity() - item.getQuantity()));
                        balanceRepository.save(balance);
                    });
        }

        transfer.setStatus(StockTransferStatus.CANCELLED);
        StockTransfer updated = stockTransferRepository.save(transfer);
        log.info("Stock transfer {} cancelled by {}", updated.getTransferNumber(), username);
        return mapToDTO(updated);
    }

    @Transactional(readOnly = true)
    public Page<StockTransferDTO> getTransfers(String search, StockTransferStatus status, Long warehouseId, Pageable pageable) {
        return stockTransferRepository.searchTransfers(search, status, warehouseId, pageable)
                .map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public StockTransferDTO getTransferById(Long id) {
        StockTransfer transfer = stockTransferRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("StockTransfer", "id", id));
        return mapToDTO(transfer);
    }

    private String generateTransferNumber() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String rand = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return "TRF-" + date + "-" + rand;
    }

    private StockTransferDTO mapToDTO(StockTransfer transfer) {
        StockTransferDTO dto = new StockTransferDTO();
        dto.setId(transfer.getId());
        dto.setTransferNumber(transfer.getTransferNumber());
        dto.setSourceWarehouseId(transfer.getSourceWarehouse().getId());
        dto.setSourceWarehouseName(transfer.getSourceWarehouse().getName());
        dto.setSourceWarehouseCode(transfer.getSourceWarehouse().getCode());
        dto.setDestinationWarehouseId(transfer.getDestinationWarehouse().getId());
        dto.setDestinationWarehouseName(transfer.getDestinationWarehouse().getName());
        dto.setDestinationWarehouseCode(transfer.getDestinationWarehouse().getCode());
        dto.setStatus(transfer.getStatus());
        dto.setNotes(transfer.getNotes());
        dto.setCreatedBy(transfer.getCreatedBy());
        dto.setDispatchedBy(transfer.getDispatchedBy());
        dto.setReceivedBy(transfer.getReceivedBy());
        dto.setDispatchedAt(transfer.getDispatchedAt());
        dto.setReceivedAt(transfer.getReceivedAt());
        dto.setCreatedAt(transfer.getCreatedAt());
        dto.setUpdatedAt(transfer.getUpdatedAt());

        List<StockTransferItemDTO> itemDTOs = transfer.getItems().stream()
                .map(i -> new StockTransferItemDTO(
                        i.getId(),
                        i.getProduct().getId(),
                        i.getProduct().getSku(),
                        i.getProduct().getName(),
                        i.getQuantity()
                )).toList();
        dto.setItems(itemDTOs);

        return dto;
    }
}
