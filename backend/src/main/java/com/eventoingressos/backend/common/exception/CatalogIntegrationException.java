package com.eventoingressos.backend.common.exception;

/**
 * Falha ao falar com a API externa de catálogo (Ticketmaster) — chave
 * ausente/inválida, indisponibilidade, item não encontrado. Sempre um
 * problema do lado de fora, nunca um bug nosso, então mapeia para 502.
 */
public class CatalogIntegrationException extends RuntimeException {

    public CatalogIntegrationException(String message) {
        super(message);
    }

    public CatalogIntegrationException(String message, Throwable cause) {
        super(message, cause);
    }
}
