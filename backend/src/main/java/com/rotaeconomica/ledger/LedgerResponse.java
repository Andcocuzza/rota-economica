package com.rotaeconomica.ledger;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LedgerResponse(Long id, LocalDate entryDate, String description, String category,
        BigDecimal amount, EntryKind kind) {
    public static LedgerResponse from(LedgerEntry entry) {
        return new LedgerResponse(entry.getId(), entry.getEntryDate(), entry.getDescription(), entry.getCategory(),
                entry.getAmount(), entry.getKind());
    }
}
