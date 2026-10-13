package com.rotaeconomica.ledger;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LedgerRepository extends JpaRepository<LedgerEntry, Long> {
    List<LedgerEntry> findAllByOrderByEntryDateDesc();
}
