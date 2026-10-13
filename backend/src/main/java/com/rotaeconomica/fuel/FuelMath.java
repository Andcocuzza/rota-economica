package com.rotaeconomica.fuel;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class FuelMath {
    private FuelMath() { }

    public static BigDecimal total(BigDecimal pricePerLiter, BigDecimal liters) {
        return pricePerLiter.multiply(liters).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal costPerKm(BigDecimal pricePerLiter, BigDecimal kilometersPerLiter) {
        if (kilometersPerLiter.signum() <= 0) {
            throw new IllegalArgumentException("O consumo deve ser maior que zero.");
        }
        return pricePerLiter.divide(kilometersPerLiter, 4, RoundingMode.HALF_UP);
    }
}
