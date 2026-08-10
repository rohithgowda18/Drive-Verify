package com.SmartVehicle.backend.service;

import java.time.Instant;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;

import com.SmartVehicle.backend.model.Rc;
import com.SmartVehicle.backend.model.OwnershipHistory;
import com.SmartVehicle.backend.repository.OwnershipHistoryRepository;
import com.SmartVehicle.backend.repository.RcRepository;
import org.springframework.beans.factory.annotation.Qualifier;

@SuppressWarnings("unused")

@Service
public class RcServiceImpl implements RcService {

    private final RcRepository repo;
    private final OwnershipHistoryRepository ownershipHistoryRepository;
    private final Counter rcCreateCounter;
    private final Counter rcUpdateCounter;
    private final Counter rcDeleteCounter;
    private final Counter rcSearchCounter;

    @Autowired
    private final EmailService emailService;

    @Autowired
    public RcServiceImpl(RcRepository repo, OwnershipHistoryRepository ownershipHistoryRepository, MeterRegistry meterRegistry, EmailService emailService) {
        this.repo = repo;
        this.ownershipHistoryRepository = ownershipHistoryRepository;
        this.rcCreateCounter = meterRegistry.counter("rc_operations_total", "operation", "create");
        this.rcUpdateCounter = meterRegistry.counter("rc_operations_total", "operation", "update");
        this.rcDeleteCounter = meterRegistry.counter("rc_operations_total", "operation", "delete");
        this.rcSearchCounter = meterRegistry.counter("rc_operations_total", "operation", "search");
        this.emailService = emailService;
    }

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
        Rc found = repo.findByRcNumber(rcNumber);
        rcSearchCounter.increment();
        if (found != null) {
            if (found.getVerified() == null) {
                found.setVerified(1);
            } else {
                found.setVerified(found.getVerified() + 1);
            }
            repo.save(found);
        }
        return found;
    }

    @Override
    public Rc add(Rc rc) {
        validateRequired(rc);
        normalizeAndEnsureConsistency(rc);
        rc.setCreatedAt(Instant.now());
        rc.setUpdatedAt(Instant.now());
        Rc saved = repo.save(rc);
        rcCreateCounter.increment();
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
        rc.setId(id);
        validateRequired(rc);
        normalizeAndEnsureConsistency(rc);
        rc.setUpdatedAt(Instant.now());
        Rc saved = repo.save(rc);
        rcUpdateCounter.increment();
        // Record ownership change if owner name differs
        if (existing != null && existing.getOwner() != null && rc.getOwner() != null) {
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
        rcDeleteCounter.increment();
    }

    @Autowired
    private org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;

    @Override
    public List<Rc> getFiltered(String registrationState, Boolean stolen, Boolean suspicious, String make, String ownerName) {
        org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();
        if (registrationState != null && !registrationState.isBlank()) {
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("registrationState").regex(registrationState, "i"));
        }
        if (stolen != null) {
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("stolen").is(stolen));
        }
        if (suspicious != null) {
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("suspicious").is(suspicious));
        }
        if (make != null && !make.isBlank()) {
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("vehicleInfo.make").regex(make, "i"));
        }
        if (ownerName != null && !ownerName.isBlank()) {
            query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("owner.name").regex(ownerName, "i"));
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

    private void normalizeAndEnsureConsistency(Rc rc) {
        // Ensure previousOwners is non-null
        if (rc.getPreviousOwners() == null) {
            rc.setPreviousOwners(new java.util.ArrayList<>());
        }
        // ownersCount must be 1 (current owner) + previous owners length
        int computed = 1 + rc.getPreviousOwners().size();
        rc.setOwnersCount(computed);
    }
}
