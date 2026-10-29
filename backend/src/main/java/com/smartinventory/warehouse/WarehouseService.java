package com.smartinventory.warehouse;

import com.smartinventory.common.exception.ConflictException;
import com.smartinventory.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;

    public WarehouseService(WarehouseRepository warehouseRepository) {
        this.warehouseRepository = warehouseRepository;
    }

    @Transactional(readOnly = true)
    public List<WarehouseDTO> getAllWarehouses() {
        return warehouseRepository.findAll().stream()
                .map(WarehouseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WarehouseDTO getWarehouseById(Long id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", id));
        return WarehouseDTO.fromEntity(warehouse);
    }

    @Transactional
    public WarehouseDTO createWarehouse(WarehouseDTO dto) {
        if (warehouseRepository.existsByCode(dto.getCode())) {
            throw new ConflictException("Warehouse with code '" + dto.getCode() + "' already exists");
        }
        Warehouse warehouse = new Warehouse(dto.getCode(), dto.getName(), dto.getAddress());
        return WarehouseDTO.fromEntity(warehouseRepository.save(warehouse));
    }

    @Transactional
    public WarehouseDTO updateWarehouse(Long id, WarehouseDTO dto) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", id));

        if (!warehouse.getCode().equalsIgnoreCase(dto.getCode()) && warehouseRepository.existsByCode(dto.getCode())) {
            throw new ConflictException("Warehouse with code '" + dto.getCode() + "' already exists");
        }

        warehouse.setCode(dto.getCode());
        warehouse.setName(dto.getName());
        warehouse.setAddress(dto.getAddress());
        warehouse.setActive(dto.isActive());
        return WarehouseDTO.fromEntity(warehouseRepository.save(warehouse));
    }
}
