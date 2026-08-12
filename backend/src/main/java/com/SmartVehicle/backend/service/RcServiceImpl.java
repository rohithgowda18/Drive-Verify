package com.SmartVehicle.backend.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import com.SmartVehicle.backend.exception.RcNotFoundException;
import com.SmartVehicle.backend.model.OwnershipHistory;
import com.SmartVehicle.backend.model.Rc;
import com.SmartVehicle.backend.repository.OwnershipHistoryRepository;
import com.SmartVehicle.backend.repository.RcRepository;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;

@Service
public class RcServiceImpl implements RcService {

    private final RcRepository repo;
    private final OwnershipHistoryRepository ownershipHistoryRepository;
    private final EmailService emailService;
    private final MongoTemplate mongoTemplate;
    private final MeterRegistry meterRegistry;

    private Counter rcCreateCounter;
    private Counter rcUpdateCounter;
    private Counter rcDeleteCounter;
    private Counter rcSearchCounter;

    public RcServiceImpl(RcRepository repo, OwnershipHistoryRepository ownershipHistoryRepository, MeterRegistry meterRegistry, EmailService emailService, MongoTemplate mongoTemplate) {
        this.repo = repo;
        this.ownershipHistoryRepository = ownershipHistoryRepository;
        this.meterRegistry = meterRegistry;
        this.emailService = emailService;
        this.mongoTemplate = mongoTemplate;
        this.rcCreateCounter = meterRegistry.counter("rc_operations_total", "operation", "create");
        this.rcUpdateCounter = meterRegistry.counter("rc_operations_total", "operation", "update");
        this.rcDeleteCounter = meterRegistry.counter("rc_operations_total", "operation", "delete");
        this.rcSearchCounter = meterRegistry.counter("rc_operations_total", "operation", "search");
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
            Query query = new Query(Criteria.where("rcNumber").is(rcNumber));
            Update update = new Update()
                    .inc("verified", 1)
                    .set("updatedAt", Instant.now());
            mongoTemplate.updateFirst(query, update, Rc.class);
            found.setVerified((found.getVerified() == null ? 0 : found.getVerified()) + 1);
            found.setUpdatedAt(Instant.now());
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
        if (existing == null) {
            throw new RcNotFoundException("Vehicle not found with ID: " + id);
        }
        rc.setId(id);
        validateRequired(rc);
        normalizeAndEnsureConsistency(rc);
        rc.setUpdatedAt(Instant.now());
        Rc saved = repo.save(rc);
        rcUpdateCounter.increment();
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
        rcDeleteCounter.increment();
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

    private void normalizeAndEnsureConsistency(Rc rc) {
        if (rc.getPreviousOwners() == null) {
            rc.setPreviousOwners(new ArrayList<>());
        }
        int computed = 1 + rc.getPreviousOwners().size();
        rc.setOwnersCount(computed);
    }
}
