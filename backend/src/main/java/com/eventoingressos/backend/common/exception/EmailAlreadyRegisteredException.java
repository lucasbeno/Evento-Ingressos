package com.eventoingressos.backend.common.exception;

public class EmailAlreadyRegisteredException extends RuntimeException {

    public EmailAlreadyRegisteredException(String email) {
        super("Já existe uma conta cadastrada com o e-mail " + email);
    }
}
