package com.rotaeconomica.fuel;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FillUpRepository extends JpaRepository<FillUp, Long> {
    List<FillUp> findAllByOrderByOdometerKmAsc();
}
