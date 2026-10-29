package com.smartinventory.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public class CustomerDTO {

    private Long id;

    @NotBlank(message = "Customer name is required")
    @Size(max = 150)
    private String name;

    @Email(message = "Email must be valid")
    private String email;

    @Size(max = 30)
    private String phone;

    private String address;
    private Long totalOrders = 0L;
    private Double totalSpend = 0.0;
    private Instant createdAt;
    private Instant updatedAt;

    public CustomerDTO() {
    }

    public static CustomerDTO fromEntity(Customer customer) {
        return fromEntity(customer, 0L, 0.0);
    }

    public static CustomerDTO fromEntity(Customer customer, Long totalOrders, Double totalSpend) {
        CustomerDTO dto = new CustomerDTO();
        dto.setId(customer.getId());
        dto.setName(customer.getName());
        dto.setEmail(customer.getEmail());
        dto.setPhone(customer.getPhone());
        dto.setAddress(customer.getAddress());
        dto.setTotalOrders(totalOrders != null ? totalOrders : 0L);
        dto.setTotalSpend(totalSpend != null ? totalSpend : 0.0);
        dto.setCreatedAt(customer.getCreatedAt());
        dto.setUpdatedAt(customer.getUpdatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(Long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public Double getTotalSpend() {
        return totalSpend;
    }

    public void setTotalSpend(Double totalSpend) {
        this.totalSpend = totalSpend;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
