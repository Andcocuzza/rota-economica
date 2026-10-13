package com.rotaeconomica.fuel;

import java.math.BigDecimal;

public record ConsumptionResponse(Integer distanceKm, BigDecimal liters, BigDecimal kilometersPerLiter,
        BigDecimal costPerKm, boolean measured) {
    public static ConsumptionResponse insufficientData() {
        return new ConsumptionResponse(null, null, null, null, false);
    }
}
