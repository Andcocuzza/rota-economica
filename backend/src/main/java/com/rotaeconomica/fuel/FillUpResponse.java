package com.rotaeconomica.fuel;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FillUpResponse(Long id, LocalDate filledAt, String stationName, FuelType fuelType,
        BigDecimal pricePerLiter, BigDecimal liters, BigDecimal totalPaid, Integer odometerKm, boolean fullTank) {
    public static FillUpResponse from(FillUp fillUp) {
        return new FillUpResponse(fillUp.getId(), fillUp.getFilledAt(), fillUp.getStationName(), fillUp.getFuelType(),
                fillUp.getPricePerLiter(), fillUp.getLiters(), fillUp.getTotalPaid(), fillUp.getOdometerKm(),
                fillUp.isFullTank());
    }
}
