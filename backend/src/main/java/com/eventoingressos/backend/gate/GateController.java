package com.eventoingressos.backend.gate;

import com.eventoingressos.backend.gate.dto.GateValidationRequest;
import com.eventoingressos.backend.gate.dto.GateValidationResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/gate")
public class GateController {

    private final GateService gateService;

    public GateController(GateService gateService) {
        this.gateService = gateService;
    }

    @PostMapping("/validate")
    public GateValidationResponse validate(@Valid @RequestBody GateValidationRequest request) {
        return gateService.validate(request);
    }
}
