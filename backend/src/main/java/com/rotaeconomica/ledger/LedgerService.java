package com.rotaeconomica.ledger;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class LedgerService {
    private final LedgerRepository repository;

    public LedgerService(LedgerRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<LedgerResponse> list() {
        return repository.findAllByOrderByEntryDateDesc().stream().map(LedgerResponse::from).toList();
    }

    public LedgerResponse create(LedgerRequest request) {
        LedgerEntry entry = new LedgerEntry(request.entryDate(), request.description().trim(),
                request.category().trim(),
                request.amount(), request.kind());
        return LedgerResponse.from(repository.save(entry));
    }
}
