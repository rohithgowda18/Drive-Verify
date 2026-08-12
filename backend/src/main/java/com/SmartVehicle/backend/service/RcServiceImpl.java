package com.SmartVehicle.backend.service;

import java.time.Instant;
import java.util.List;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import com.SmartVehicle.backend.exception.RcNotFoundException;
import com.SmartVehicle.backend.model.OwnershipHistory;
import com.SmartVehicle.backend.model.Rc;
import com.SmartVehicle.backend.repository.OwnershipHistoryRepository;
import com.SmartVehicle.backend.repository.RcRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RcServiceImpl implements RcService {

    private final RcRepository repo;
    private final OwnershipHistoryRepository ownershipHistoryRepository;
    private final EmailService emailService;
    private final MongoTemplate mongoTemplate;

    @Override
    public List<Rc> getAll() {
        return repo.findAll();
    }

    @Override
    public Rc getById(String id) {
        return repo.findById(id).orElse(null);
    }

    @Override
    public Rc searchByRcNumber(String rcNumber) {
        return repo.findByRcNumber(rcNumber);
    }

    @Override
    public Rc add(Rc rc) {
        validateRequired(rc);
        rc.setCreatedAt(Instant.now());
        rc.setUpdatedAt(Instant.now());
        Rc saved = repo.save(rc);
        if (saved.getOwner() != null && saved.getOwner().getEmail() != null) {
            emailService.sendRcCreatedEmail(
                    saved.getOwner().getEmail(),
                    saved.getOwner().getName(),
                    saved.getRcNumber()
            );
        }
        return saved;
    }

    @Override
    public Rc update(String id, Rc rc) {
        Rc existing = repo.findById(id).orElse(null);
        if (existing == null) {
            throw new RcNotFoundException("Vehicle not found with ID: " + id);
        }
        rc.setId(id);
        validateRequired(rc);
        rc.setUpdatedAt(Instant.now());
        Rc saved = repo.save(rc);
        // Record ownership change if owner name differs
        if (existing.getOwner() != null && rc.getOwner() != null) {
            String oldName = existing.getOwner().getName();
            String newName = rc.getOwner().getName();
            if (oldName != null && newName != null && !oldName.equals(newName)) {
                OwnershipHistory h = new OwnershipHistory();
                h.setRcId(saved.getId());
                h.setRcNumber(saved.getRcNumber());
                h.setPreviousOwnerName(oldName);
                h.setNewOwnerName(newName);
                h.setTransferredAt(Instant.now());
                h.setStolenAtTransfer(saved.getStolen());
                h.setSuspiciousAtTransfer(saved.getSuspicious());
                ownershipHistoryRepository.save(h);
                if (saved.getOwner() != null && saved.getOwner().getEmail() != null) {
                    emailService.sendOwnershipTransferEmail(
                            saved.getOwner().getEmail(),
                            saved.getOwner().getName(),
                            saved.getRcNumber()
                    );
                }
            }
        }
        return saved;
    }

    @Override
    public void delete(String id) {
        repo.deleteById(id);
    }

    @Override
    public List<Rc> getFiltered(String registrationState, Boolean stolen, Boolean suspicious, String make, String ownerName) {
        Query query = new Query();
        if (registrationState != null && !registrationState.isBlank()) {
            query.addCriteria(Criteria.where("registrationState").regex(registrationState, "i"));
        }
        if (stolen != null) {
            query.addCriteria(Criteria.where("stolen").is(stolen));
        }
        if (suspicious != null) {
            query.addCriteria(Criteria.where("suspicious").is(suspicious));
        }
        if (make != null && !make.isBlank()) {
            query.addCriteria(Criteria.where("vehicleInfo.make").regex(make, "i"));
        }
        if (ownerName != null && !ownerName.isBlank()) {
            query.addCriteria(Criteria.where("owner.name").regex(ownerName, "i"));
        }
        return mongoTemplate.find(query, Rc.class);
    }

    private void validateRequired(Rc rc) {
        if (rc.getRcNumber() == null || rc.getRcNumber().isBlank()) {
            throw new IllegalArgumentException("rcNumber is required");
        }
        if (rc.getOwner() == null || rc.getOwner().getName() == null || rc.getOwner().getName().isBlank()) {
            throw new IllegalArgumentException("owner.name is required");
        }
        if (rc.getRegistrationState() == null || rc.getRegistrationState().isBlank()) {
            throw new IllegalArgumentException("registrationState is required");
        }
        if (rc.getVehicleInfo() == null || rc.getVehicleInfo().getMake() == null || rc.getVehicleInfo().getModel() == null) {
            throw new IllegalArgumentException("vehicleInfo.make and vehicleInfo.model are required");
        }
        if (rc.getChassisNumber() == null || rc.getChassisNumber().isBlank()) {
            throw new IllegalArgumentException("chassisNumber is required");
        }
        if (rc.getEngineNumber() == null || rc.getEngineNumber().isBlank()) {
            throw new IllegalArgumentException("engineNumber is required");
        }
    }
}
