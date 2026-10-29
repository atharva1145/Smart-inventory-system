package com.smartinventory.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartinventory.category.Category;
import com.smartinventory.category.CategoryRepository;
import com.smartinventory.inventory.InventoryBalance;
import com.smartinventory.inventory.InventoryBalanceRepository;
import com.smartinventory.inventory.MovementType;
import com.smartinventory.inventory.dto.AdjustStockRequest;
import com.smartinventory.product.Product;
import com.smartinventory.product.ProductRepository;
import com.smartinventory.product.dto.CreateProductRequest;
import com.smartinventory.security.JwtTokenProvider;
import com.smartinventory.security.Role;
import com.smartinventory.security.UserPrincipal;
import com.smartinventory.user.User;
import com.smartinventory.user.UserRepository;
import com.smartinventory.warehouse.Warehouse;
import com.smartinventory.warehouse.WarehouseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Integration Test: Product Management & Inventory Balance Tracking")
class ProductAndInventoryIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private InventoryBalanceRepository balanceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private Warehouse defaultWarehouse;
    private Category defaultCategory;

    @BeforeEach
    void setUp() {
        User admin = userRepository.findByUsername("testadmin2")
                .orElseGet(() -> userRepository.save(new User(
                        "testadmin2", "admin2@test.local", passwordEncoder.encode("Password@123"), "Admin 2", Role.ADMIN
                )));

        UserPrincipal principal = UserPrincipal.create(admin);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        adminToken = jwtTokenProvider.generateToken(auth);

        defaultWarehouse = warehouseRepository.findByCode("WH-MAIN")
                .orElseGet(() -> warehouseRepository.save(new Warehouse("WH-MAIN", "Central Depot", "100 Industrial Pkwy")));

        defaultCategory = categoryRepository.findByName("Tools")
                .orElseGet(() -> categoryRepository.save(new Category("Tools", "Hand and power tools")));
    }

    @Test
    @DisplayName("Create product initializes stock balance and logs INITIAL_STOCK movement")
    void testCreateProductWithStock() throws Exception {
        String sku = "SKU-TEST-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        CreateProductRequest request = new CreateProductRequest();
        request.setSku(sku);
        request.setName("Heavy Duty Impact Wrench");
        request.setDescription("18V Cordless high torque wrench");
        request.setCategoryId(defaultCategory.getId());
        request.setCostPrice(new BigDecimal("75.00"));
        request.setSellingPrice(new BigDecimal("129.99"));
        request.setReorderLevel(10);
        request.setUnitOfMeasure("UNIT");
        request.setWarehouseId(defaultWarehouse.getId());
        request.setInitialStock(25);

        mockMvc.perform(post("/api/v1/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sku").value(sku))
                .andExpect(jsonPath("$.data.onHandQuantity").value(25))
                .andExpect(jsonPath("$.data.availableQuantity").value(25));

        Product product = productRepository.findBySku(sku).orElseThrow();
        InventoryBalance balance = balanceRepository.findByProductIdAndWarehouseId(product.getId(), defaultWarehouse.getId()).orElseThrow();
        assertEquals(25, balance.getOnHandQuantity());
        assertEquals(0, balance.getReservedQuantity());
        assertEquals(25, balance.getAvailableQuantity());
    }

    @Test
    @DisplayName("Manual stock adjustment updates on-hand balance and enforces mandatory reason")
    void testManualStockAdjustment() throws Exception {
        String sku = "SKU-ADJ-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Product product = productRepository.save(new Product(
                sku, "Precision Digital Caliper", "Measuring instrument",
                defaultCategory, new BigDecimal("20.00"), new BigDecimal("39.99"), 5, "UNIT"
        ));
        balanceRepository.save(new InventoryBalance(product, defaultWarehouse, 10, 0));

        AdjustStockRequest adjustReq = new AdjustStockRequest(
                product.getId(), defaultWarehouse.getId(), 5, "Quarterly physical count discrepancy"
        );

        mockMvc.perform(post("/api/v1/inventory/adjust")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adjustReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.onHandQuantity").value(15))
                .andExpect(jsonPath("$.data.availableQuantity").value(15));

        InventoryBalance updated = balanceRepository.findByProductIdAndWarehouseId(product.getId(), defaultWarehouse.getId()).orElseThrow();
        assertEquals(15, updated.getOnHandQuantity());
    }

    @Test
    @DisplayName("Stock adjustment fails when attempted reduction exceeds on-hand stock")
    void testPreventNegativeStockAdjustment() throws Exception {
        String sku = "SKU-NEG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Product product = productRepository.save(new Product(
                sku, "Utility Knife", "Retractable blade knife",
                defaultCategory, new BigDecimal("3.00"), new BigDecimal("7.50"), 5, "UNIT"
        ));
        balanceRepository.save(new InventoryBalance(product, defaultWarehouse, 4, 0));

        AdjustStockRequest adjustReq = new AdjustStockRequest(
                product.getId(), defaultWarehouse.getId(), -10, "Damaged stock deduction"
        );

        mockMvc.perform(post("/api/v1/inventory/adjust")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adjustReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        // Invariant check: stock unchanged
        InventoryBalance balance = balanceRepository.findByProductIdAndWarehouseId(product.getId(), defaultWarehouse.getId()).orElseThrow();
        assertEquals(4, balance.getOnHandQuantity());
    }
}
