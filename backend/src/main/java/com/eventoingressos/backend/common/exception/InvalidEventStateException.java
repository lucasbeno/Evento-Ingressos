package com.eventoingressos.backend.common.exception;

public class InvalidEventStateException extends RuntimeException {

    public InvalidEventStateException(String message) {
        super(message);
    }
}
