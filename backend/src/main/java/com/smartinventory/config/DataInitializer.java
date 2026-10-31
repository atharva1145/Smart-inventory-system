package com.smartinventory.config;

import com.smartinventory.category.Category;
import com.smartinventory.category.CategoryRepository;
import com.smartinventory.customer.Customer;
import com.smartinventory.customer.CustomerRepository;
import com.smartinventory.inventory.InventoryBalance;
import com.smartinventory.inventory.InventoryBalanceRepository;
import com.smartinventory.inventory.InventoryMovement;
import com.smartinventory.inventory.InventoryMovementRepository;
import com.smartinventory.inventory.MovementType;
import com.smartinventory.order.*;
import com.smartinventory.order.dto.CreateOrderItemRequest;
import com.smartinventory.order.dto.CreateOrderRequest;
import com.smartinventory.product.Product;
import com.smartinventory.product.ProductRepository;
import com.smartinventory.purchaseorder.*;
import com.smartinventory.security.Role;
import com.smartinventory.supplier.Supplier;
import com.smartinventory.supplier.SupplierRepository;
import com.smartinventory.user.User;
import com.smartinventory.user.UserRepository;
import com.smartinventory.warehouse.Warehouse;
import com.smartinventory.warehouse.WarehouseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final InventoryBalanceRepository balanceRepository;
    private final InventoryMovementRepository movementRepository;
    private final SupplierRepository supplierRepository;
    private final CustomerRepository customerRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed-data:true}")
    private boolean seedData;

    public DataInitializer(UserRepository userRepository,
                           CategoryRepository categoryRepository,
                           WarehouseRepository warehouseRepository,
                           ProductRepository productRepository,
                           InventoryBalanceRepository balanceRepository,
                           InventoryMovementRepository movementRepository,
                           SupplierRepository supplierRepository,
                           CustomerRepository customerRepository,
                           PurchaseOrderRepository purchaseOrderRepository,
                           OrderRepository orderRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.warehouseRepository = warehouseRepository;
        this.productRepository = productRepository;
        this.balanceRepository = balanceRepository;
        this.movementRepository = movementRepository;
        this.supplierRepository = supplierRepository;
        this.customerRepository = customerRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedData) {
            log.info("Development data seeding is disabled.");
            return;
        }

        log.info("Checking baseline development seed data...");

        // 1. Seed Roles & Users
        seedUsers();

        // 2. Ensure default warehouse
        Warehouse warehouse = warehouseRepository.findByCode("WH-MAIN")
                .orElseGet(() -> warehouseRepository.save(new Warehouse("WH-MAIN", "Central Distribution Center", "100 Logistics Way")));

        // 3. Seed Suppliers
        Supplier supplier = seedSuppliers();

        // 4. Seed Customers
        Customer customer = seedCustomers();

        // 5. Seed Demo Products & Stock
        seedProductsAndStock(warehouse, supplier, customer);

        log.info("Development seed data verified successfully.");
    }

    private void seedUsers() {
        if (!userRepository.existsByUsername("admin")) {
            userRepository.save(new User(
                    "admin",
                    "admin@smartinventory.local",
                    passwordEncoder.encode("Password@123"),
                    "System Administrator",
                    Role.ADMIN
            ));
            log.info("Seeded user 'admin' (Role: ADMIN)");
        }

        if (!userRepository.existsByUsername("manager")) {
            userRepository.save(new User(
                    "manager",
                    "manager@smartinventory.local",
                    passwordEncoder.encode("Password@123"),
                    "Inventory Manager",
                    Role.INVENTORY_MANAGER
            ));
            log.info("Seeded user 'manager' (Role: INVENTORY_MANAGER)");
        }

        if (!userRepository.existsByUsername("sales")) {
            userRepository.save(new User(
                    "sales",
                    "sales@smartinventory.local",
                    passwordEncoder.encode("Password@123"),
                    "Senior Sales Executive",
                    Role.SALES_STAFF
            ));
            log.info("Seeded user 'sales' (Role: SALES_STAFF)");
        }

        if (!userRepository.existsByUsername("viewer")) {
            userRepository.save(new User(
                    "viewer",
                    "viewer@smartinventory.local",
                    passwordEncoder.encode("Password@123"),
                    "Operations Auditor",
                    Role.VIEWER
            ));
            log.info("Seeded user 'viewer' (Role: VIEWER)");
        }
    }

    private Supplier seedSuppliers() {
        if (supplierRepository.count() == 0) {
            supplierRepository.save(new Supplier(
                    "Global Office Distro", "Alice Miller", "alice@globaldistro.com", "+1-555-0101", "45 Warehouse Blvd, Chicago IL", "Primary stationery vendor"
            ));
            supplierRepository.save(new Supplier(
                    "Precision Hardware Ltd", "Bob Chen", "bob@precisionhardware.com", "+1-555-0102", "88 Industrial Pkwy, Cleveland OH", "Tool and hardware specialist"
            ));
        }
        return supplierRepository.save(new Supplier(
                "Apex Electronics Corp", "Mark Vance", "sales@apexelectronics.com", "+1-555-0100", "120 Silicon Way, San Jose CA", "Key electronic device supplier"
        ));
    }

    private Customer seedCustomers() {
        if (customerRepository.count() == 0) {
            customerRepository.save(new Customer("Nexus Logistics", "procurement@nexuslogistics.com", "+1-555-0202", "200 Harbor Dr, Seattle WA"));
            customerRepository.save(new Customer("Starlight Retailers", "orders@starlightretail.com", "+1-555-0203", "55 Market St, Denver CO"));
        }
        return customerRepository.save(new Customer("Acme Corporation", "purchasing@acmecorp.com", "+1-555-0201", "500 Enterprise Ave, New York NY"));
    }

    private void seedProductsAndStock(Warehouse warehouse, Supplier supplier, Customer customer) {
        if (productRepository.count() > 0) {
            return;
        }

        Category electronics = categoryRepository.findByName("Electronics")
                .orElseGet(() -> categoryRepository.save(new Category("Electronics", "Electronic gear")));
        Category office = categoryRepository.findByName("Office Supplies")
                .orElseGet(() -> categoryRepository.save(new Category("Office Supplies", "Office gear")));
        Category packaging = categoryRepository.findByName("Packaging & Shipping")
                .orElseGet(() -> categoryRepository.save(new Category("Packaging & Shipping", "Shipping boxes and packing")));

        Product p1 = productRepository.save(new Product(
                "SKU-SCAN-01", "Wireless 2D Barcode Scanner", "High precision 2D bluetooth handheld scanner with cradle",
                electronics, new BigDecimal("45.00"), new BigDecimal("89.99"), 15, "UNIT",
                "https://images.unsplash.com/photo-1590396033609-f1947a5089df?auto=format&fit=crop&w=400&q=80",
                "A-01-S2-B4"
        ));
        createStock(p1, warehouse, 60, "admin");

        Product p2 = productRepository.save(new Product(
                "SKU-TAPE-01", "Heavy-Duty Packing Tape (6-Pack)", "Reinforced 3-inch industrial sealing tape",
                packaging, new BigDecimal("8.50"), new BigDecimal("18.00"), 25, "PACK",
                "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80",
                "B-03-S1-B1"
        ));
        createStock(p2, warehouse, 120, "admin");

        Product p3 = productRepository.save(new Product(
                "SKU-LABEL-01", "Direct Thermal Shipping Labels", "4x6 inch blank thermal shipping labels (1000/roll)",
                office, new BigDecimal("6.00"), new BigDecimal("14.50"), 40, "ROLL",
                "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=400&q=80",
                "C-02-S4-B8"
        ));
        // Intentionally low stock to demo alert
        createStock(p3, warehouse, 8, "admin");

        Product p4 = productRepository.save(new Product(
                "SKU-SCALE-01", "Digital Shipping Scale 150kg", "Heavy-duty platform scale with USB PC connectivity",
                electronics, new BigDecimal("70.00"), new BigDecimal("139.00"), 5, "UNIT",
                "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=400&q=80",
                "D-05-S3-B2"
        ));
        createStock(p4, warehouse, 18, "admin");

        // Seed a demo completed order and a pending order for dashboard realism
        createDemoOrder(p1, p2, customer, OrderStatus.DELIVERED, PaymentStatus.PAID, "ORD-20261028-0001", "admin");
        createDemoOrder(p4, p1, customer, OrderStatus.PENDING, PaymentStatus.PENDING, "ORD-20261029-0002", "sales");

        // Seed a demo approved purchase order
        PurchaseOrder po = new PurchaseOrder("PO-20261025-0001", supplier, PurchaseOrderStatus.APPROVED,
                LocalDate.now().plusDays(5), new BigDecimal("1800.00"), "Q4 Restock", "manager");
        po.addItem(new PurchaseOrderItem(p1, 40, new BigDecimal("45.00"), new BigDecimal("1800.00")));
        purchaseOrderRepository.save(po);
    }

    private void createStock(Product product, Warehouse warehouse, int qty, String actor) {
        InventoryBalance balance = new InventoryBalance(product, warehouse, qty, 0);
        balance.setBinLocation(product.getBinLocation());
        balanceRepository.save(balance);

        InventoryMovement movement = new InventoryMovement(
                product, warehouse, MovementType.INITIAL_STOCK, qty,
                "INITIAL_STOCK", "INIT-" + product.getSku(), actor, "Initial stock initialization"
        );
        movementRepository.save(movement);
    }

    private void createDemoOrder(Product p1, Product p2, Customer customer, OrderStatus status, PaymentStatus paymentStatus, String orderNum, String actor) {
        BigDecimal subtotal = p1.getSellingPrice().add(p2.getSellingPrice().multiply(BigDecimal.valueOf(2)));
        Order order = new Order(orderNum, customer, status, subtotal, BigDecimal.ZERO, subtotal, null, "Demo system order", actor);
        order.setPaymentStatus(paymentStatus);

        OrderItem i1 = new OrderItem(p1, 1, p1.getSellingPrice(), p1.getSellingPrice());
        OrderItem i2 = new OrderItem(p2, 2, p2.getSellingPrice(), p2.getSellingPrice().multiply(BigDecimal.valueOf(2)));
        order.addItem(i1);
        order.addItem(i2);

        order.addStatusHistory(new OrderStatusHistory(order, null, status, actor, "Initial demo record"));
        orderRepository.save(order);
    }
}
