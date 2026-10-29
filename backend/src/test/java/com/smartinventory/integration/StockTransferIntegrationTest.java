package com.smartinventory.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartinventory.inventory.InventoryBalance;
import com.smartinventory.inventory.InventoryBalanceRepository;
import com.smartinventory.product.Product;
import com.smartinventory.product.ProductRepository;
import com.smartinventory.security.JwtTokenProvider;
import com.smartinventory.security.UserPrincipal;
import com.smartinventory.stocktransfer.StockTransferStatus;
import com.smartinventory.stocktransfer.dto.CreateStockTransferItemRequest;
import com.smartinventory.stocktransfer.dto.CreateStockTransferRequest;
import com.smartinventory.security.Role;
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
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class StockTransferIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtTokenProvider jwtTokenProvider;
    @Autowired private WarehouseRepository warehouseRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private InventoryBalanceRepository balanceRepository;

    private String managerToken;
    private Warehouse sourceWarehouse;
    private Warehouse destWarehouse;

    @BeforeEach
    void setUp() {
        User manager = userRepository.findByUsername("testmanager")
                .orElseGet(() -> userRepository.save(new User(
                        "testmanager", "manager@test.local", passwordEncoder.encode("Password@123"), "Manager Tester", Role.INVENTORY_MANAGER
                )));

        UserPrincipal principal = UserPrincipal.create(manager);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        managerToken = jwtTokenProvider.generateToken(auth);

        sourceWarehouse = warehouseRepository.findByCode("WH-MAIN")
                .orElseGet(() -> warehouseRepository.save(new Warehouse("WH-MAIN", "Central Depot", "100 Logistics Way")));

        destWarehouse = warehouseRepository.findByCode("WH-WEST")
                .orElseGet(() -> warehouseRepository.save(new Warehouse("WH-WEST", "West Hub", "750 Pacific Blvd")));
    }

    @Test
    @DisplayName("Complete Stock Transfer: Request reserves stock, Dispatch deducts source, Receive increments destination")
    void testCreateAndCompleteStockTransfer() throws Exception {
        String sku = "SKU-TRF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Product product = productRepository.save(new Product(
                sku, "Transferable Widget", "Industrial widget", null,
                new BigDecimal("25.00"), new BigDecimal("49.99"), 5, "UNIT"
        ));

        // Initial 20 units in WH-MAIN
        balanceRepository.save(new InventoryBalance(product, sourceWarehouse, 20, 0));

        // 1. Request Transfer: 5 units from WH-MAIN to WH-WEST
        CreateStockTransferRequest request = new CreateStockTransferRequest();
        request.setSourceWarehouseId(sourceWarehouse.getId());
        request.setDestinationWarehouseId(destWarehouse.getId());
        request.setNotes("Emergency transfer for West Coast stockout");
        request.setItems(List.of(new CreateStockTransferItemRequest(product.getId(), 5)));

        String res = mockMvc.perform(post("/api/v1/stock-transfers")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("REQUESTED"))
                .andReturn().getResponse().getContentAsString();

        Long transferId = objectMapper.readTree(res).path("data").path("id").asLong();

        // Verify source stock reserved
        InventoryBalance sourceBal = balanceRepository.findByProductIdAndWarehouseId(product.getId(), sourceWarehouse.getId()).orElseThrow();
        assertEquals(20, sourceBal.getOnHandQuantity());
        assertEquals(5, sourceBal.getReservedQuantity());
        assertEquals(15, sourceBal.getAvailableQuantity());

        // 2. Dispatch Transfer
        mockMvc.perform(post("/api/v1/stock-transfers/" + transferId + "/dispatch")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("IN_TRANSIT"));

        sourceBal = balanceRepository.findByProductIdAndWarehouseId(product.getId(), sourceWarehouse.getId()).orElseThrow();
        assertEquals(15, sourceBal.getOnHandQuantity(), "Physical stock deducted at source");
        assertEquals(0, sourceBal.getReservedQuantity());
        assertEquals(15, sourceBal.getAvailableQuantity());

        // 3. Receive Transfer at Destination
        mockMvc.perform(post("/api/v1/stock-transfers/" + transferId + "/receive")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));

        InventoryBalance destBal = balanceRepository.findByProductIdAndWarehouseId(product.getId(), destWarehouse.getId()).orElseThrow();
        assertEquals(5, destBal.getOnHandQuantity(), "Stock arrived at destination");
        assertEquals(5, destBal.getAvailableQuantity());
    }

    @Test
    @DisplayName("Cancel Stock Transfer: Releases reserved stock back to available at source warehouse")
    void testCancelStockTransfer() throws Exception {
        String sku = "SKU-CNL-TRF-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        Product product = productRepository.save(new Product(
                sku, "Widget To Cancel", "Desc", null,
                new BigDecimal("10.00"), new BigDecimal("20.00"), 5, "UNIT"
        ));
        balanceRepository.save(new InventoryBalance(product, sourceWarehouse, 10, 0));

        CreateStockTransferRequest request = new CreateStockTransferRequest();
        request.setSourceWarehouseId(sourceWarehouse.getId());
        request.setDestinationWarehouseId(destWarehouse.getId());
        request.setItems(List.of(new CreateStockTransferItemRequest(product.getId(), 4)));

        String res = mockMvc.perform(post("/api/v1/stock-transfers")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long transferId = objectMapper.readTree(res).path("data").path("id").asLong();

        // Cancel
        mockMvc.perform(post("/api/v1/stock-transfers/" + transferId + "/cancel")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));

        InventoryBalance sourceBal = balanceRepository.findByProductIdAndWarehouseId(product.getId(), sourceWarehouse.getId()).orElseThrow();
        assertEquals(10, sourceBal.getOnHandQuantity());
        assertEquals(0, sourceBal.getReservedQuantity(), "Reservation cleanly released");
        assertEquals(10, sourceBal.getAvailableQuantity());
    }
}
