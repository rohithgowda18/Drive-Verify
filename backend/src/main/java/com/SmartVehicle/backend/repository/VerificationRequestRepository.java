package com.SmartVehicle.backend.repository;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.SmartVehicle.backend.model.VerificationRequest;

public interface VerificationRequestRepository extends MongoRepository<VerificationRequest, String> {
    List<VerificationRequest> findByRcNumberOrderByCreatedAtDesc(String rcNumber);
}
