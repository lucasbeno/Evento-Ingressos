package com.eventoingressos.backend.common.exception;

import java.util.UUID;

public class ReservationNotFoundException extends RuntimeException {

    public ReservationNotFoundException(UUID id) {
        super("Reserva não encontrada: " + id);
    }
}
