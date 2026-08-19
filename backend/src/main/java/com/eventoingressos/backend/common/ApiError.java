package com.eventoingressos.backend.common;

import java.time.Instant;
import java.util.Map;

public record ApiError(String message, Instant timestamp, Map<String, String> fieldErrors) {

    public static ApiError of(String message) {
        return new ApiError(message, Instant.now(), null);
    }

    public static ApiError of(String message, Map<String, String> fieldErrors) {
        return new ApiError(message, Instant.now(), fieldErrors);
    }
}
