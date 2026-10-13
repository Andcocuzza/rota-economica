package com.rotaeconomica.summary;

import java.math.BigDecimal;

public record FinancialSummary(BigDecimal revenue, BigDecimal otherExpenses, BigDecimal fuelExpenses,
        BigDecimal totalExpenses, BigDecimal estimatedProfit, int fillUpCount, int ledgerEntryCount) {
}
