package com.eventoingressos.backend.reservation;

import com.eventoingressos.backend.auth.AuthenticatedPrincipal;
import com.eventoingressos.backend.reservation.dto.CreateReservationRequest;
import com.eventoingressos.backend.reservation.dto.ReservationResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    public ResponseEntity<ReservationResponse> create(
            @AuthenticationPrincipal AuthenticatedPrincipal customer,
            @Valid @RequestBody CreateReservationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reservationService.create(customer, request));
    }

    @GetMapping
    public List<ReservationResponse> listMine(@AuthenticationPrincipal AuthenticatedPrincipal customer) {
        return reservationService.listMine(customer);
    }

    @GetMapping("/{id}")
    public ReservationResponse getMine(
            @AuthenticationPrincipal AuthenticatedPrincipal customer, @PathVariable UUID id) {
        return reservationService.getOwnedResponse(id, customer);
    }
}
