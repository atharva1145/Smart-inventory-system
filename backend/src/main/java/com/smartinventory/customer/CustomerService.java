package com.smartinventory.customer;

import com.smartinventory.common.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public Page<CustomerDTO> searchCustomers(String search, Pageable pageable) {
        return customerRepository.searchCustomers(search, pageable).map(CustomerDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<CustomerDTO> getAllCustomers() {
        return customerRepository.findAll().stream().map(CustomerDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CustomerDTO getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));
        return CustomerDTO.fromEntity(customer);
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
