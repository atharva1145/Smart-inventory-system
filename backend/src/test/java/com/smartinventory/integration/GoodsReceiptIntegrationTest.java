package com.smartinventory.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartinventory.goodsreceipt.dto.CreateGoodsReceiptItemRequest;
import com.smartinventory.goodsreceipt.dto.CreateGoodsReceiptRequest;
import com.smartinventory.inventory.InventoryBalance;
import com.smartinventory.inventory.InventoryBalanceRepository;
import com.smartinventory.product.Product;
import com.smartinventory.product.ProductRepository;
import com.smartinventory.purchaseorder.PurchaseOrder;
import com.smartinventory.purchaseorder.PurchaseOrderItem;
import com.smartinventory.purchaseorder.PurchaseOrderRepository;
import com.smartinventory.purchaseorder.PurchaseOrderStatus;
import com.smartinventory.security.JwtTokenProvider;
import com.smartinventory.security.Role;
import com.smartinventory.security.UserPrincipal;
import com.smartinventory.supplier.Supplier;
import com.smartinventory.supplier.SupplierRepository;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Integration Test: Procurement, Purchase Order Receipts & On-Hand Stock Increases")
class GoodsReceiptIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private InventoryBalanceRepository balanceRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    private String managerToken;
    private Warehouse warehouse;
    private Supplier supplier;

    @BeforeEach
    void setUp() {
        User manager = userRepository.findByUsername("testmanager")
                .orElseGet(() -> userRepository.save(new User(
                        "testmanager", "manager@test.local", passwordEncoder.encode("Password@123"), "Manager Tester", Role.INVENTORY_MANAGER
                )));

        UserPrincipal principal = UserPrincipal.create(manager);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        managerToken = jwtTokenProvider.generateToken(auth);

        warehouse = warehouseRepository.findByCode("WH-MAIN")
                .orElseGet(() -> warehouseRepository.save(new Warehouse("WH-MAIN", "Central Depot", "100 Industrial Pkwy")));

        supplier = supplierRepository.save(new Supplier(
                "Apex Electronics", "Mark Vance", "mark@apexelectronics.com", "+1-555-4321", "50 Silicon Way", "Preferred chip vendor"
        ));
    }

    @Test
    @DisplayName("Recording goods receipt atomically increases on-hand stock and updates PO progress")
    void testReceiveGoodsReceiptIncreasesStock() throws Exception {
        String sku = "SKU-PO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Product product = productRepository.save(new Product(
                sku, "USB-C Barcode Scanner", "Handheld scanner",
                null, new BigDecimal("40.00"), new BigDecimal("79.99"), 5, "UNIT"
        ));
        balanceRepository.save(new InventoryBalance(product, warehouse, 10, 0));

        // Create & approve PO for 20 units
        PurchaseOrder po = new PurchaseOrder(
                "PO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                supplier,
                PurchaseOrderStatus.APPROVED,
                null,
                new BigDecimal("800.00"),
                "Restock",
                "testmanager"
        );
        po.addItem(new PurchaseOrderItem(product, 20, new BigDecimal("40.00"), new BigDecimal("800.00")));
        po = purchaseOrderRepository.save(po);

        // Record receipt of 15 units (partial delivery)
        CreateGoodsReceiptRequest receiptReq = new CreateGoodsReceiptRequest();
        receiptReq.setPurchaseOrderId(po.getId());
        receiptReq.setWarehouseId(warehouse.getId());
        receiptReq.setNotes("First batch delivered by carrier");
        receiptReq.setItems(List.of(new CreateGoodsReceiptItemRequest(product.getId(), 15)));

        mockMvc.perform(post("/api/v1/goods-receipts")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(receiptReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.receiptNumber").isNotEmpty());

        // Verify physical on-hand stock increased from 10 to 25
        InventoryBalance balance = balanceRepository.findByProductIdAndWarehouseId(product.getId(), warehouse.getId()).orElseThrow();
        assertEquals(25, balance.getOnHandQuantity(), "On-hand stock must increase from 10 to 25");
        assertEquals(25, balance.getAvailableQuantity());

        // Verify PO status is PARTIALLY_RECEIVED
        PurchaseOrder updatedPo = purchaseOrderRepository.findByIdWithItems(po.getId()).orElseThrow();
        assertEquals(PurchaseOrderStatus.PARTIALLY_RECEIVED, updatedPo.getStatus());
        assertEquals(15, updatedPo.getItems().get(0).getReceivedQuantity());
        assertEquals(5, updatedPo.getItems().get(0).getOutstandingQuantity());
    }

    @Test
    @DisplayName("Over-receipt prevention: Reject goods receipt if received quantity exceeds outstanding")
    void testPreventOverReceipt() throws Exception {
        String sku = "SKU-OVR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Product product = productRepository.save(new Product(
                sku, "Packing Bubble Wrap", "Cushioning material",
                null, new BigDecimal("15.00"), new BigDecimal("29.99"), 5, "ROLL"
        ));

        PurchaseOrder po = new PurchaseOrder(
                "PO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                supplier,
                PurchaseOrderStatus.APPROVED,
                null,
                new BigDecimal("150.00"),
                "Restock",
                "testmanager"
        );
        po.addItem(new PurchaseOrderItem(product, 10, new BigDecimal("15.00"), new BigDecimal("150.00")));
        po = purchaseOrderRepository.save(po);

        // Attempt to receive 15 units when only 10 were ordered
        CreateGoodsReceiptRequest receiptReq = new CreateGoodsReceiptRequest();
        receiptReq.setPurchaseOrderId(po.getId());
        receiptReq.setWarehouseId(warehouse.getId());
        receiptReq.setItems(List.of(new CreateGoodsReceiptItemRequest(product.getId(), 15)));

        mockMvc.perform(post("/api/v1/goods-receipts")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(receiptReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
