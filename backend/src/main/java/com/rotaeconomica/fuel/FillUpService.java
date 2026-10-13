package com.rotaeconomica.fuel;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class FillUpService {
    private final FillUpRepository repository;

    public FillUpService(FillUpRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<FillUpResponse> list() {
        return repository.findAllByOrderByOdometerKmAsc().stream().map(FillUpResponse::from).toList();
    }

    public FillUpResponse create(FillUpRequest request) {
        Integer lastOdometer = repository.findAllByOrderByOdometerKmAsc().stream()
                .map(FillUp::getOdometerKm).max(Integer::compareTo).orElse(0);
        if (request.odometerKm() <= lastOdometer) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A quilometragem deve ser maior que a do abastecimento anterior.");
        }
        FillUp fillUp = new FillUp(request.filledAt(), request.stationName().trim(), request.fuelType(),
                request.pricePerLiter(), request.liters(), request.odometerKm(), request.fullTank());
        return FillUpResponse.from(repository.save(fillUp));
    }

    @Transactional(readOnly = true)
    public ConsumptionResponse latestConsumption() {
        List<FillUp> all = repository.findAllByOrderByOdometerKmAsc();
        List<FillUp> fullTanks = all.stream().filter(FillUp::isFullTank).toList();
        if (fullTanks.size() < 2)
            return ConsumptionResponse.insufficientData();

        FillUp previous = fullTanks.get(fullTanks.size() - 2);
        FillUp latest = fullTanks.get(fullTanks.size() - 1);
        int distance = latest.getOdometerKm() - previous.getOdometerKm();
        BigDecimal liters = all.stream()
                .filter(fillUp -> fillUp.getOdometerKm() > previous.getOdometerKm())
                .filter(fillUp -> fillUp.getOdometerKm() <= latest.getOdometerKm())
                .map(FillUp::getLiters)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (distance <= 0 || liters.signum() <= 0)
            return ConsumptionResponse.insufficientData();

        BigDecimal consumption = BigDecimal.valueOf(distance).divide(liters, 2, RoundingMode.HALF_UP);
        BigDecimal costPerKm = FuelMath.costPerKm(latest.getPricePerLiter(), consumption);
        return new ConsumptionResponse(distance, liters, consumption, costPerKm, true);
    }
}
