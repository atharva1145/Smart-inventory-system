package com.smartinventory.customer;

import com.smartinventory.common.exception.ResourceNotFoundException;
import com.smartinventory.order.OrderRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;

    public CustomerService(CustomerRepository customerRepository, OrderRepository orderRepository) {
        this.customerRepository = customerRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional(readOnly = true)
    public Page<CustomerDTO> searchCustomers(String search, Pageable pageable) {
        return customerRepository.searchCustomers(search, pageable).map(c -> {
            long count = orderRepository.countOrdersByCustomerId(c.getId());
            Double spend = orderRepository.sumSpendByCustomerId(c.getId());
            return CustomerDTO.fromEntity(c, count, spend);
        });
    }

    @Transactional(readOnly = true)
    public List<CustomerDTO> getAllCustomers() {
        return customerRepository.findAll().stream().map(c -> {
            long count = orderRepository.countOrdersByCustomerId(c.getId());
            Double spend = orderRepository.sumSpendByCustomerId(c.getId());
            return CustomerDTO.fromEntity(c, count, spend);
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CustomerDTO getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));
        long count = orderRepository.countOrdersByCustomerId(customer.getId());
        Double spend = orderRepository.sumSpendByCustomerId(customer.getId());
        return CustomerDTO.fromEntity(customer, count, spend);
    }

    @Transactional
    public CustomerDTO createCustomer(CustomerDTO dto) {
        Customer customer = new Customer(dto.getName(), dto.getEmail(), dto.getPhone(), dto.getAddress());
        return CustomerDTO.fromEntity(customerRepository.save(customer));
    }

    @Transactional
    public CustomerDTO updateCustomer(Long id, CustomerDTO dto) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));

        customer.setName(dto.getName());
        customer.setEmail(dto.getEmail());
        customer.setPhone(dto.getPhone());
        customer.setAddress(dto.getAddress());
        return CustomerDTO.fromEntity(customerRepository.save(customer));
    }
}
