package com.smartinventory.order.dto;

import com.smartinventory.order.OrderStatus;
import com.smartinventory.order.OrderStatusHistory;

import java.time.Instant;

public class OrderStatusHistoryDTO {

    private Long id;
    private OrderStatus previousStatus;
    private OrderStatus newStatus;
    private String actorUsername;
    private String comment;
    private Instant createdAt;

    public OrderStatusHistoryDTO() {
    }

    public static OrderStatusHistoryDTO fromEntity(OrderStatusHistory history) {
        OrderStatusHistoryDTO dto = new OrderStatusHistoryDTO();
        dto.setId(history.getId());
        dto.setPreviousStatus(history.getPreviousStatus());
        dto.setNewStatus(history.getNewStatus());
        dto.setActorUsername(history.getActorUsername());
        dto.setComment(history.getComment());
        dto.setCreatedAt(history.getCreatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public OrderStatus getPreviousStatus() {
        return previousStatus;
    }

    public void setPreviousStatus(OrderStatus previousStatus) {
        this.previousStatus = previousStatus;
    }

    public OrderStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(OrderStatus newStatus) {
        this.newStatus = newStatus;
    }

    public String getActorUsername() {
        return actorUsername;
    }

    public void setActorUsername(String actorUsername) {
        this.actorUsername = actorUsername;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
