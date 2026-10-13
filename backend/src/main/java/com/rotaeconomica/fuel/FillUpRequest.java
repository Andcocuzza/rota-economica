package com.rotaeconomica.fuel;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record FillUpRequest(
        @NotNull LocalDate filledAt,
        @NotBlank @Size(max = 120) String stationName,
        @NotNull FuelType fuelType,
        @NotNull @Positive BigDecimal pricePerLiter,
        @NotNull @Positive BigDecimal liters,
        @NotNull @Positive Integer odometerKm,
        boolean fullTank) {
}
