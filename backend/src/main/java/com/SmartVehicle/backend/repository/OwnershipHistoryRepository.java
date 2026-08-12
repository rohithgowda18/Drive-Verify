package com.SmartVehicle.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.SmartVehicle.backend.model.OwnershipHistory;

public interface OwnershipHistoryRepository extends MongoRepository<OwnershipHistory, String> {
    List<OwnershipHistory> findByRcIdOrderByTransferredAtDesc(String rcId);
    long countByRcId(String rcId);
}
