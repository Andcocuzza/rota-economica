package com.rotaeconomica.fuel;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "fill_ups")
public class FillUp {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate filledAt;

    @Column(nullable = false, length = 120)
    private String stationName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private FuelType fuelType;

    @Column(nullable = false, precision = 8, scale = 3)
    private BigDecimal pricePerLiter;

    @Column(nullable = false, precision = 8, scale = 3)
    private BigDecimal liters;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPaid;

    @Column(nullable = false)
    private Integer odometerKm;

    @Column(nullable = false)
    private boolean fullTank;

    protected FillUp() { }

    public FillUp(LocalDate filledAt, String stationName, FuelType fuelType, BigDecimal pricePerLiter,
            BigDecimal liters, Integer odometerKm, boolean fullTank) {
        this.filledAt = filledAt;
        this.stationName = stationName;
        this.fuelType = fuelType;
        this.pricePerLiter = pricePerLiter;
        this.liters = liters;
        this.totalPaid = FuelMath.total(pricePerLiter, liters);
        this.odometerKm = odometerKm;
        this.fullTank = fullTank;
    }

    public Long getId() { return id; }
    public LocalDate getFilledAt() { return filledAt; }
    public String getStationName() { return stationName; }
    public FuelType getFuelType() { return fuelType; }
    public BigDecimal getPricePerLiter() { return pricePerLiter; }
    public BigDecimal getLiters() { return liters; }
    public BigDecimal getTotalPaid() { return totalPaid; }
    public Integer getOdometerKm() { return odometerKm; }
    public boolean isFullTank() { return fullTank; }
}
