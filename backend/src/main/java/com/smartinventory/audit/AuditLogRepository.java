package com.smartinventory.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a " +
           "WHERE (:entityName IS NULL OR a.entityName = :entityName) " +
           "AND (:actorUsername IS NULL OR a.actorUsername = :actorUsername) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> searchAuditLogs(
            @Param("entityName") String entityName,
            @Param("actorUsername") String actorUsername,
            Pageable pageable
    );
}
