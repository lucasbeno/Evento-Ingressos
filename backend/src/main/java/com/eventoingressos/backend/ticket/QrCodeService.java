package com.eventoingressos.backend.ticket;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.UUID;

/**
 * O QR code não é só o UUID do ingresso — é "{id}.{assinatura HMAC}". Sem
 * conhecer o segredo do servidor, ninguém consegue forjar um código válido
 * mesmo sabendo (ou adivinhando) o id de um ingresso real. A portaria
 * valida recomputando a assinatura, não confiando no que veio no QR.
 */
@Service
public class QrCodeService {

    private final SecretKeySpec keySpec;

    public QrCodeService(@Value("${app.ticket.qr-secret}") String secret) {
        this.keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    public String generate(UUID ticketId, UUID eventId) {
        return ticketId + "." + sign(payload(ticketId, eventId));
    }

    public boolean isValid(String qrCode, UUID ticketId, UUID eventId) {
        String expected = generate(ticketId, eventId);
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                qrCode.getBytes(StandardCharsets.UTF_8));
    }

    private String payload(UUID ticketId, UUID eventId) {
        return ticketId + ":" + eventId;
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(keySpec);
            byte[] raw = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao assinar QR code", e);
        }
    }
}
