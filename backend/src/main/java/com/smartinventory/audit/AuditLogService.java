package com.smartinventory.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String entityName, String entityId, String action, String actorUsername, String details, String ipAddress) {
        AuditLog auditLog = new AuditLog(entityName, entityId, action, actorUsername, details, ipAddress);
        auditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogDTO> searchAuditLogs(String entityName, String actorUsername, Pageable pageable) {
        return auditLogRepository.searchAuditLogs(entityName, actorUsername, pageable)
                .map(AuditLogDTO::fromEntity);
    }
}
