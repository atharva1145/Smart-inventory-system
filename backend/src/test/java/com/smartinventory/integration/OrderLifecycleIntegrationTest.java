package com.smartinventory.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartinventory.category.Category;
import com.smartinventory.category.CategoryRepository;
import com.smartinventory.customer.Customer;
import com.smartinventory.customer.CustomerRepository;
import com.smartinventory.inventory.InventoryBalance;
import com.smartinventory.inventory.InventoryBalanceRepository;
import com.smartinventory.order.Order;
import com.smartinventory.order.OrderRepository;
import com.smartinventory.order.OrderStatus;
import com.smartinventory.order.PaymentStatus;
import com.smartinventory.order.dto.CreateOrderItemRequest;
import com.smartinventory.order.dto.CreateOrderRequest;
import com.smartinventory.order.dto.UpdateOrderStatusRequest;
import com.smartinventory.product.Product;
import com.smartinventory.product.ProductRepository;
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
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Integration Test: Complete Order Lifecycle, Stock Reservation & Fulfillment")
class OrderLifecycleIntegrationTest {

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
    private CustomerRepository customerRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    private String salesToken;
    private Warehouse warehouse;
    private Customer customer;

    @BeforeEach
    void setUp() {
        User sales = userRepository.findByUsername("testsales")
                .orElseGet(() -> userRepository.save(new User(
                        "testsales", "sales@test.local", passwordEncoder.encode("Password@123"), "Sales Tester", Role.SALES_STAFF
                )));

        UserPrincipal principal = UserPrincipal.create(sales);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        salesToken = jwtTokenProvider.generateToken(auth);

        warehouse = warehouseRepository.findByCode("WH-MAIN")
                .orElseGet(() -> warehouseRepository.save(new Warehouse("WH-MAIN", "Central Depot", "100 Industrial Pkwy")));

        customer = customerRepository.save(new Customer(
                "Acme Global", "procurement@acmeglobal.com", "+1-555-9988", "400 Business Blvd"
        ));
    }

    @Test
    @DisplayName("Creating order reserves stock, leaves on-hand unchanged, and decrements available stock")
    void testOrderCreationReservesStock() throws Exception {
        String sku = "SKU-ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Product product = productRepository.save(new Product(
                sku, "Label Printer", "Desktop barcode printer",
                null, new BigDecimal("120.00"), new BigDecimal("199.99"), 5, "UNIT"
        ));
        balanceRepository.save(new InventoryBalance(product, warehouse, 10, 0));

        CreateOrderRequest request = new CreateOrderRequest();
        request.setCustomerId(customer.getId());
        request.setWarehouseId(warehouse.getId());
        request.setItems(List.of(new CreateOrderItemRequest(product.getId(), 3)));
        request.setDiscountAmount(new BigDecimal("9.99"));

        String res = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + salesToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderNumber").isNotEmpty())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.totalAmount").value(589.98)) // (3 * 199.99) - 9.99 = 589.98
                .andReturn().getResponse().getContentAsString();

        // Verify stock balance invariants
        InventoryBalance balance = balanceRepository.findByProductIdAndWarehouseId(product.getId(), warehouse.getId()).orElseThrow();
        assertEquals(10, balance.getOnHandQuantity(), "Physical on-hand remains 10");
        assertEquals(3, balance.getReservedQuantity(), "Reserved quantity is 3");
        assertEquals(7, balance.getAvailableQuantity(), "Available quantity is 10 - 3 = 7");
    }

    @Test
    @DisplayName("Cancelling an order releases reserved stock back to available inventory")
    void testOrderCancellationReleasesStock() throws Exception {
        String sku = "SKU-CNL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Product product = productRepository.save(new Product(
                sku, "Laser Barcode Scanner", "High speed scanner",
                null, new BigDecimal("50.00"), new BigDecimal("99.00"), 5, "UNIT"
        ));
        balanceRepository.save(new InventoryBalance(product, warehouse, 8, 0));

        // Create Order
        CreateOrderRequest request = new CreateOrderRequest();
        request.setCustomerId(customer.getId());
        request.setWarehouseId(warehouse.getId());
        request.setItems(List.of(new CreateOrderItemRequest(product.getId(), 2)));

        String res = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + salesToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long orderId = objectMapper.readTree(res).path("data").path("id").asLong();

        // Cancel Order
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/cancel")
                        .header("Authorization", "Bearer " + salesToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\": \"Customer requested cancellation\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));

        // Verify stock reservation released
        InventoryBalance balance = balanceRepository.findByProductIdAndWarehouseId(product.getId(), warehouse.getId()).orElseThrow();
        assertEquals(8, balance.getOnHandQuantity());
        assertEquals(0, balance.getReservedQuantity(), "Reserved stock released to 0");
        assertEquals(8, balance.getAvailableQuantity(), "Available stock restored to 8");
    }

    @Test
    @DisplayName("Idempotency: Retrying with same idempotency key returns stored order without double reservation")
    void testIdempotentOrderSubmission() throws Exception {
        String sku = "SKU-IDEM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Product product = productRepository.save(new Product(
                sku, "Shipping Cartons (Pack)", "Box bundle",
                null, new BigDecimal("10.00"), new BigDecimal("25.00"), 5, "PACK"
        ));
        balanceRepository.save(new InventoryBalance(product, warehouse, 10, 0));

        String key = "IDEMP-KEY-" + UUID.randomUUID();

        CreateOrderRequest request = new CreateOrderRequest();
        request.setCustomerId(customer.getId());
        request.setWarehouseId(warehouse.getId());
        request.setIdempotencyKey(key);
        request.setItems(List.of(new CreateOrderItemRequest(product.getId(), 2)));

        // Request 1
        String res1 = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + salesToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String orderNum1 = objectMapper.readTree(res1).path("data").path("orderNumber").asText();

        // Request 2 (Retry with identical key)
        String res2 = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + salesToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String orderNum2 = objectMapper.readTree(res2).path("data").path("orderNumber").asText();

        assertEquals(orderNum1, orderNum2, "Idempotent request returns identical existing order");

        // Stock reserved only once (2 units, not 4!)
        InventoryBalance balance = balanceRepository.findByProductIdAndWarehouseId(product.getId(), warehouse.getId()).orElseThrow();
        assertEquals(2, balance.getReservedQuantity());
        assertEquals(8, balance.getAvailableQuantity());
    }
}
