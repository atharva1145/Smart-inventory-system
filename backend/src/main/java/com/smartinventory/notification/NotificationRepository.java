package com.smartinventory.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop20ByOrderByCreatedAtDesc();

    Page<Notification> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByReadFalse();

    boolean existsByTypeAndReferenceIdAndReadFalse(NotificationType type, String referenceId);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.read = false")
    void markAllAsRead();

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.id = :id")
    void markAsRead(@Param("id") Long id);
}
