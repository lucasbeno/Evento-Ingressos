package com.eventoingressos.backend.common.exception;

public class InsufficientAvailabilityException extends RuntimeException {

    public InsufficientAvailabilityException(String message) {
        super(message);
    }
}
