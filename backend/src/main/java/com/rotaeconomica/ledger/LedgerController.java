package com.rotaeconomica.ledger;

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
@RequestMapping("/api/v1/ledger")
public class LedgerController {
    private final LedgerService service;

    public LedgerController(LedgerService service) {
        this.service = service;
    }

    @GetMapping
    public List<LedgerResponse> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<LedgerResponse> create(@Valid @RequestBody LedgerRequest request) {
        LedgerResponse created = service.create(request);
        return ResponseEntity.created(URI.create("/api/v1/ledger/" + created.id())).body(created);
    }
}
