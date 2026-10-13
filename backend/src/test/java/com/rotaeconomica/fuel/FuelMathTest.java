package com.rotaeconomica.fuel;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class FuelMathTest {
    @Test
    void calculatesPaidTotalAndCostPerKilometer() {
        assertThat(FuelMath.total(new BigDecimal("5.79"), new BigDecimal("37.000")))
                .isEqualByComparingTo("214.23");
        assertThat(FuelMath.costPerKm(new BigDecimal("5.79"), new BigDecimal("12.30")))
                .isEqualByComparingTo("0.4707");
    }

    @Test
    void rejectsZeroConsumption() {
        assertThatThrownBy(() -> FuelMath.costPerKm(new BigDecimal("5.79"), BigDecimal.ZERO))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
