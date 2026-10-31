package com.smartinventory.product;

import com.smartinventory.category.Category;
import com.smartinventory.category.CategoryRepository;
import com.smartinventory.common.exception.ConflictException;
import com.smartinventory.common.exception.ResourceNotFoundException;
import com.smartinventory.inventory.InventoryBalance;
import com.smartinventory.inventory.InventoryBalanceRepository;
import com.smartinventory.inventory.InventoryMovementRepository;
import com.smartinventory.inventory.InventoryService;
import com.smartinventory.product.dto.CreateProductRequest;
import com.smartinventory.product.dto.ProductDTO;
import com.smartinventory.product.dto.UpdateProductRequest;
import com.smartinventory.warehouse.Warehouse;
import com.smartinventory.warehouse.WarehouseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryBalanceRepository balanceRepository;
    private final InventoryMovementRepository movementRepository;
    private final InventoryService inventoryService;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          WarehouseRepository warehouseRepository,
                          InventoryBalanceRepository balanceRepository,
                          InventoryMovementRepository movementRepository,
                          InventoryService inventoryService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.warehouseRepository = warehouseRepository;
        this.balanceRepository = balanceRepository;
        this.movementRepository = movementRepository;
        this.inventoryService = inventoryService;
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO> searchProducts(String query, Long categoryId, Boolean active, Pageable pageable) {
        Page<Product> products = productRepository.searchProducts(query, categoryId, active, pageable);
        return products.map(this::enrichWithStock);
    }

    @Transactional(readOnly = true)
    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return enrichWithStock(product);
    }

    @Transactional(readOnly = true)
    public ProductDTO getProductBySku(String sku) {
        Product product = productRepository.findBySku(sku)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "sku", sku));
        return enrichWithStock(product);
    }

    @Transactional
    public ProductDTO createProduct(CreateProductRequest request, String actorUsername) {
        if (productRepository.existsBySku(request.getSku())) {
            throw new ConflictException("Product with SKU '" + request.getSku() + "' already exists");
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
        }

        Product product = new Product(
                request.getSku(),
                request.getName(),
                request.getDescription(),
                category,
                request.getCostPrice(),
                request.getSellingPrice(),
                request.getReorderLevel(),
                request.getUnitOfMeasure(),
                request.getImageUrl(),
                request.getBinLocation()
        );

        Product savedProduct = productRepository.save(product);

        // Initialize inventory balance if initial stock specified or in default warehouse
        Warehouse warehouse = null;
        if (request.getWarehouseId() != null) {
            warehouse = warehouseRepository.findById(request.getWarehouseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", request.getWarehouseId()));
        } else {
            List<Warehouse> warehouses = warehouseRepository.findAll();
            if (!warehouses.isEmpty()) {
                warehouse = warehouses.get(0);
            }
        }

        int onHand = 0;
        int reserved = 0;
        if (warehouse != null) {
            int initStock = request.getInitialStock() != null ? request.getInitialStock() : 0;
            InventoryBalance balance = inventoryService.initializeStock(savedProduct, warehouse, initStock, actorUsername);
            onHand = balance.getOnHandQuantity();
            reserved = balance.getReservedQuantity();
        }

        return ProductDTO.fromEntityWithStock(savedProduct, onHand, reserved);
    }

    @Transactional
    public ProductDTO updateProduct(Long id, UpdateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        if (request.getName() != null && !request.getName().isBlank()) {
            product.setName(request.getName());
        }
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
            product.setCategory(category);
        }
        if (request.getCostPrice() != null) {
            product.setCostPrice(request.getCostPrice());
        }
        if (request.getSellingPrice() != null) {
            product.setSellingPrice(request.getSellingPrice());
        }
        if (request.getReorderLevel() != null) {
            product.setReorderLevel(request.getReorderLevel());
        }
        if (request.getUnitOfMeasure() != null && !request.getUnitOfMeasure().isBlank()) {
            product.setUnitOfMeasure(request.getUnitOfMeasure());
        }
        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }
        if (request.getImageUrl() != null) {
            product.setImageUrl(request.getImageUrl());
        }
        if (request.getBinLocation() != null) {
            product.setBinLocation(request.getBinLocation());
        }

        Product saved = productRepository.save(product);
        return enrichWithStock(saved);
    }

    @Transactional
    public List<ProductDTO> bulkImportProducts(List<CreateProductRequest> requests, String actorUsername) {
        List<ProductDTO> imported = new java.util.ArrayList<>();
        for (CreateProductRequest req : requests) {
            imported.add(createProduct(req, actorUsername));
        }
        return imported;
    }

    @Transactional
    public void deleteOrDeactivateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        // Check if referenced by historical inventory movements
        boolean hasMovements = movementRepository.searchMovements(id, null, Pageable.unpaged()).getTotalElements() > 0;
        if (hasMovements) {
            // Cannot hard delete, de-activate instead to maintain audit trail integrity!
            product.setActive(false);
            productRepository.save(product);
        } else {
            productRepository.delete(product);
        }
    }

    private ProductDTO enrichWithStock(Product product) {
        List<InventoryBalance> balances = balanceRepository.findByProductId(product.getId());
        int totalOnHand = balances.stream().mapToInt(InventoryBalance::getOnHandQuantity).sum();
        int totalReserved = balances.stream().mapToInt(InventoryBalance::getReservedQuantity).sum();
        ProductDTO dto = ProductDTO.fromEntityWithStock(product, totalOnHand, totalReserved);

        List<ProductDTO.WarehouseStockInfo> warehouseStocks = balances.stream()
                .map(b -> new ProductDTO.WarehouseStockInfo(
                        b.getWarehouse().getId(),
                        b.getWarehouse().getCode(),
                        b.getWarehouse().getName(),
                        b.getBinLocation() != null ? b.getBinLocation() : product.getBinLocation(),
                        b.getOnHandQuantity(),
                        b.getReservedQuantity()
                ))
                .toList();
        dto.setWarehouseStocks(warehouseStocks);
        return dto;
    }
}
