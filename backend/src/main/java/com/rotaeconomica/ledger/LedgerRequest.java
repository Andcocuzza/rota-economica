package com.rotaeconomica.ledger;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record LedgerRequest(
        @NotNull LocalDate entryDate,
        @NotBlank @Size(max = 160) String description,
        @NotBlank @Size(max = 60) String category,
        @NotNull @Positive BigDecimal amount,
        @NotNull EntryKind kind) {
}
