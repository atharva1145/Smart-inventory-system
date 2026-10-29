package com.smartinventory.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getRecentNotifications() {
        return notificationRepository.findTop20ByOrderByCreatedAtDesc().stream()
                .map(NotificationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<NotificationDTO> getAllNotifications(Pageable pageable) {
        return notificationRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(NotificationDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        return notificationRepository.countByReadFalse();
    }

    @Transactional
    public void createNotificationIfNotExists(NotificationType type, String title, String message, String referenceId) {
        if (!notificationRepository.existsByTypeAndReferenceIdAndReadFalse(type, referenceId)) {
            Notification notification = new Notification(type, title, message, referenceId);
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAsRead(Long id) {
        notificationRepository.markAsRead(id);
    }

    @Transactional
    public void markAllAsRead() {
        notificationRepository.markAllAsRead();
    }
}
