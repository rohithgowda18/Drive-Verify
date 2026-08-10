package com.SmartVehicle.backend.repository;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.SmartVehicle.backend.model.VehicleEvent;

public interface VehicleEventRepository extends MongoRepository<VehicleEvent, String> {
    List<VehicleEvent> findByRcNumberOrderByTimestampDesc(String rcNumber);
}
