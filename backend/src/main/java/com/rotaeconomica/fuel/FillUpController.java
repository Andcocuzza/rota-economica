package com.rotaeconomica.fuel;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/fill-ups")
public class FillUpController {
    private final FillUpService service;

    public FillUpController(FillUpService service) {
        this.service = service;
    }

    @GetMapping
    public List<FillUpResponse> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<FillUpResponse> create(@Valid @RequestBody FillUpRequest request) {
        FillUpResponse created = service.create(request);
        return ResponseEntity.created(URI.create("/api/v1/fill-ups/" + created.id())).body(created);
    }

    @GetMapping("/consumption")
    public ConsumptionResponse consumption() {
        return service.latestConsumption();
    }
}
