package com.SmartVehicle.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.SmartVehicle.backend.config.AdminKeyValidator;
import com.SmartVehicle.backend.exception.UnauthorizedException;
import com.SmartVehicle.backend.model.Rc;
import com.SmartVehicle.backend.service.RcService;
import com.SmartVehicle.backend.repository.OwnershipHistoryRepository;
import com.SmartVehicle.backend.model.OwnershipHistory;
import com.SmartVehicle.backend.model.SellerClaim;
import com.SmartVehicle.backend.model.RiskAssessment;
import com.SmartVehicle.backend.service.RiskAssessmentService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/rc")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {org.springframework.web.bind.annotation.RequestMethod.GET, org.springframework.web.bind.annotation.RequestMethod.POST, org.springframework.web.bind.annotation.RequestMethod.PUT, org.springframework.web.bind.annotation.RequestMethod.DELETE, org.springframework.web.bind.annotation.RequestMethod.OPTIONS})
public class RcController {

    private final RcService rcService;
    private final AdminKeyValidator adminKeyValidator;
    private final OwnershipHistoryRepository ownershipHistoryRepository;
    private final org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;

    @Autowired
    public RcController(RcService rcService, AdminKeyValidator adminKeyValidator, OwnershipHistoryRepository ownershipHistoryRepository, org.springframework.data.mongodb.core.MongoTemplate mongoTemplate) {
        this.rcService = rcService;
        this.adminKeyValidator = adminKeyValidator;
        this.ownershipHistoryRepository = ownershipHistoryRepository;
        this.mongoTemplate = mongoTemplate;
    }

    @GetMapping
    public List<Rc> getAll() {
        return rcService.getAll();
    }

    @GetMapping("/{id}")
    public Rc getById(@PathVariable String id) {
        return rcService.getById(id);
    }

    @GetMapping("/{id}/history")
    public List<OwnershipHistory> getHistory(@PathVariable String id) {
        return ownershipHistoryRepository.findByRcIdOrderByTransferredAtDesc(id);
    }

    @GetMapping("/search")
    public Rc searchByRcNumber(@RequestParam String rcNumber) {
        return rcService.searchByRcNumber(rcNumber);
    }

    @Autowired
    private RiskAssessmentService riskAssessmentService;

    @PostMapping("/evaluate")
    public RiskAssessment evaluateVehicle(@RequestBody Rc requestPayload) {
        if (requestPayload.getRcNumber() == null || requestPayload.getRcNumber().isBlank()) {
            throw new IllegalArgumentException("rcNumber is required");
        }
        String cleanRcNumber = requestPayload.getRcNumber().trim();
        Rc existingRc = rcService.searchByRcNumber(cleanRcNumber);

        SellerClaim sellerClaim = requestPayload.getSellerClaim();
        RiskAssessment assessment = riskAssessmentService.evaluate(existingRc, sellerClaim, null);

        if (existingRc != null) {
            org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query(
                    org.springframework.data.mongodb.core.query.Criteria.where("rcNumber").is(cleanRcNumber)
            );
            org.springframework.data.mongodb.core.query.Update update = new org.springframework.data.mongodb.core.query.Update()
                    .set("sellerClaim", sellerClaim)
                    .set("riskAssessment", assessment)
                    .set("updatedAt", java.time.Instant.now());
            mongoTemplate.updateFirst(query, update, Rc.class);
        }

        return assessment;
    }

    @GetMapping("/stats")
    public java.util.Map<String, Object> getStats() {
        List<Rc> all = rcService.getAll();
        long total = all.size();
        long activeCount = all.stream().filter(rc -> rc.getRegistrationInfo() != null && rc.getRegistrationInfo().isActive()).count();
        long stolenCount = all.stream().filter(rc -> Boolean.TRUE.equals(rc.getStolen())).count();
        long suspiciousCount = all.stream().filter(rc -> Boolean.TRUE.equals(rc.getSuspicious())).count();

        java.util.Map<String, Integer> byState = new java.util.HashMap<>();
        for (Rc rc : all) {
            String st = rc.getRegistrationState();
            if (st != null && !st.isEmpty()) {
                byState.put(st, byState.getOrDefault(st, 0) + 1);
            }
        }

        // Monthly verifications (by Rc.createdAt month)
        java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM");
        java.util.Map<String, Integer> monthly = new java.util.TreeMap<>();
        for (Rc rc : all) {
            if (rc.getCreatedAt() != null) {
                String key = java.time.ZonedDateTime.ofInstant(rc.getCreatedAt(), java.time.ZoneId.systemDefault()).format(fmt);
                monthly.put(key, monthly.getOrDefault(key, 0) + 1);
            }
        }

        // Total ownership transfers across system
        long ownershipTransfersCount = ownershipHistoryRepository.count();

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("total", total);
        result.put("activeCount", activeCount);
        result.put("stolenCount", stolenCount);
        result.put("suspiciousCount", suspiciousCount);
        result.put("ownershipTransfersCount", ownershipTransfersCount);
        result.put("byState", byState);
        result.put("monthlyVerifications", monthly.entrySet().stream()
                .map(e -> java.util.Map.of("month", e.getKey(), "count", e.getValue()))
                .toList());
        return result;
    }

    @GetMapping("/page")
    public java.util.Map<String, Object> getPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String registrationState,
            @RequestParam(required = false) Boolean stolen,
            @RequestParam(required = false) Boolean suspicious,
            @RequestParam(required = false) String make,
            @RequestParam(required = false) String ownerName) {

        if (page < 0) page = 0;
        if (size < 1) size = 10;
        List<Rc> filtered = rcService.getFiltered(registrationState, stolen, suspicious, make, ownerName);
        int total = filtered.size();
        int from = Math.min(page * size, total);
        int to = Math.min(from + size, total);
        List<Rc> slice = filtered.subList(from, to);
        int totalPages = (int) Math.ceil(total / (double) size);

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("items", slice);
        result.put("page", page);
        result.put("size", size);
        result.put("total", total);
        result.put("totalPages", totalPages);
        return result;
    }

    @PostMapping
    public Rc create(@RequestBody Rc rc, HttpServletRequest request) {
        if (!adminKeyValidator.isAdminAuthorized(request)) throw new UnauthorizedException();
        return rcService.add(rc);
    }

    @PutMapping("/{id}")
    public Rc update(@PathVariable String id, @RequestBody Rc rc, HttpServletRequest request) {
        if (!adminKeyValidator.isAdminAuthorized(request)) throw new UnauthorizedException();
        return rcService.update(id, rc);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id, HttpServletRequest request) {
        if (!adminKeyValidator.isAdminAuthorized(request)) throw new UnauthorizedException();
        rcService.delete(id);
    }
}
