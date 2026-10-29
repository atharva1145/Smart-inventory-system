package com.smartinventory.supplier;

import com.smartinventory.common.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    @Transactional(readOnly = true)
    public Page<SupplierDTO> searchSuppliers(String search, Boolean active, Pageable pageable) {
        return supplierRepository.searchSuppliers(search, active, pageable).map(SupplierDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<SupplierDTO> getAllActiveSuppliers() {
        return supplierRepository.findByActiveTrue().stream().map(SupplierDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SupplierDTO getSupplierById(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
        return SupplierDTO.fromEntity(supplier);
    }

    @Transactional
    public SupplierDTO createSupplier(SupplierDTO dto) {
        Supplier supplier = new Supplier(
                dto.getName(),
                dto.getContactPerson(),
                dto.getEmail(),
                dto.getPhone(),
                dto.getAddress(),
                dto.getNotes()
        );
        return SupplierDTO.fromEntity(supplierRepository.save(supplier));
    }

    @Transactional
    public SupplierDTO updateSupplier(Long id, SupplierDTO dto) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));

        supplier.setName(dto.getName());
        supplier.setContactPerson(dto.getContactPerson());
        supplier.setEmail(dto.getEmail());
        supplier.setPhone(dto.getPhone());
        supplier.setAddress(dto.getAddress());
        supplier.setActive(dto.isActive());
        supplier.setNotes(dto.getNotes());
        return SupplierDTO.fromEntity(supplierRepository.save(supplier));
    }
}
