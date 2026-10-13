package com.rotaeconomica.summary;

import com.rotaeconomica.fuel.FillUpRepository;
import com.rotaeconomica.ledger.EntryKind;
import com.rotaeconomica.ledger.LedgerEntry;
import com.rotaeconomica.ledger.LedgerRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SummaryService {
    private final FillUpRepository fillUpRepository;
    private final LedgerRepository ledgerRepository;

    public SummaryService(FillUpRepository fillUpRepository, LedgerRepository ledgerRepository) {
        this.fillUpRepository = fillUpRepository;
        this.ledgerRepository = ledgerRepository;
    }

    @Transactional(readOnly = true)
    public FinancialSummary getSummary() {
        var fillUps = fillUpRepository.findAll();
        List<LedgerEntry> entries = ledgerRepository.findAll();
        BigDecimal revenue = sum(entries, EntryKind.REVENUE);
        BigDecimal otherExpenses = sum(entries, EntryKind.EXPENSE);
        BigDecimal fuelExpenses = fillUps.stream().map(fillUp -> fillUp.getTotalPaid())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalExpenses = otherExpenses.add(fuelExpenses);
        return new FinancialSummary(revenue, otherExpenses, fuelExpenses, totalExpenses,
                revenue.subtract(totalExpenses), fillUps.size(), entries.size());
    }

    private BigDecimal sum(List<LedgerEntry> entries, EntryKind kind) {
        return entries.stream().filter(entry -> entry.getKind() == kind).map(LedgerEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
