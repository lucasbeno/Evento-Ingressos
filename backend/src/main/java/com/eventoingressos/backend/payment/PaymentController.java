package com.eventoingressos.backend.payment;

import com.eventoingressos.backend.auth.AuthenticatedPrincipal;
import com.eventoingressos.backend.payment.dto.PaymentRequest;
import com.eventoingressos.backend.payment.dto.PaymentResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/reservations")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/{id}/pay")
    public PaymentResponse pay(
            @AuthenticationPrincipal AuthenticatedPrincipal customer,
            @PathVariable UUID id,
            @Valid @RequestBody PaymentRequest request) {
        return paymentService.pay(id, customer, request);
    }
}
