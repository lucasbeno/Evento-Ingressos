package com.eventoingressos.backend.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Pagamento simulado: nenhum dado aqui é enviado a um gateway de verdade.
 * Um número de cartão terminado em "0002" simula recusa — convenção comum
 * de sandbox de pagamento (ex: cartões de teste do Stripe), documentada no
 * README para quem for avaliar testar os dois caminhos.
 */
public record PaymentRequest(
        @NotBlank @Pattern(regexp = "\\d{13,19}", message = "Número do cartão inválido") String cardNumber,
        @NotBlank(message = "Nome do titular é obrigatório") String cardHolderName,
        @NotBlank @Pattern(regexp = "(0[1-9]|1[0-2])/\\d{2}", message = "Validade inválida (use MM/AA)") String expiry,
        @NotBlank @Pattern(regexp = "\\d{3,4}", message = "CVV inválido") String cvv) {
}
