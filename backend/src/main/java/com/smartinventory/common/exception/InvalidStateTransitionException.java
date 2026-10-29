package com.smartinventory.common.exception;

import org.springframework.http.HttpStatus;

public class InvalidStateTransitionException extends ApiException {
    public InvalidStateTransitionException(String entityName, String currentStatus, String targetStatus) {
        super(String.format("Invalid %s state transition from '%s' to '%s'", entityName, currentStatus, targetStatus),
                HttpStatus.BAD_REQUEST);
    }
}
