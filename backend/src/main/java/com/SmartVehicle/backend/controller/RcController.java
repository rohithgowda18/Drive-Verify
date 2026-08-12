package com.SmartVehicle.backend.controller;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

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
import com.SmartVehicle.backend.exception.RcNotFoundException;
import com.SmartVehicle.backend.exception.UnauthorizedException;
import com.SmartVehicle.backend.model.OwnershipHistory;
import com.SmartVehicle.backend.model.Rc;
import com.SmartVehicle.backend.model.RiskAssessment;
import com.SmartVehicle.backend.model.SellerClaim;
import com.SmartVehicle.backend.repository.OwnershipHistoryRepository;
import com.SmartVehicle.backend.service.RcService;
import com.SmartVehicle.backend.service.RiskAssessmentService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

import com.SmartVehicle.backend.dto.RcResponse;

@RestController
@RequestMapping("/api/rc")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class RcController {

    private final RcService rcService;
    private final AdminKeyValidator adminKeyValidator;
    private final OwnershipHistoryRepository ownershipHistoryRepository;
    private final RiskAssessmentService riskAssessmentService;

    @GetMapping
    public List<RcResponse> getAll(HttpServletRequest request) {
        boolean isAdmin = adminKeyValidator.isAdminAuthorized(request);
        return rcService.getAll().stream()
                .map(rc -> RcResponse.fromEntity(rc, isAdmin))
                .toList();
    }

    @GetMapping("/{id}")
    public RcResponse getById(@PathVariable String id, HttpServletRequest request) {
        Rc rc = rcService.getById(id);
        if (rc == null) {
            throw new RcNotFoundException("Vehicle not found with ID: " + id);
        }
        boolean isAdmin = adminKeyValidator.isAdminAuthorized(request);
        return RcResponse.fromEntity(rc, isAdmin);
    }

    @GetMapping("/{id}/history")
    public List<OwnershipHistory> getHistory(@PathVariable String id) {
        return ownershipHistoryRepository.findByRcIdOrderByTransferredAtDesc(id);
    }

    @GetMapping("/search")
    public RcResponse searchByRcNumber(@RequestParam String rcNumber, HttpServletRequest request) {
        Rc found = rcService.searchByRcNumber(rcNumber);
        if (found == null) {
            throw new RcNotFoundException("Vehicle not found with RC Number: " + rcNumber);
        }
        boolean isAdmin = adminKeyValidator.isAdminAuthorized(request);
        return RcResponse.fromEntity(found, isAdmin);
    }

    @PostMapping("/evaluate")
    public RiskAssessment evaluateVehicle(@RequestBody Rc requestPayload) {
        if (requestPayload.getRcNumber() == null || requestPayload.getRcNumber().isBlank()) {
            throw new IllegalArgumentException("rcNumber is required");
        }
        String cleanRcNumber = requestPayload.getRcNumber().trim();
        Rc existingRc = rcService.searchByRcNumber(cleanRcNumber);
        if (existingRc == null) {
            throw new RcNotFoundException("RC not found: " + cleanRcNumber);
        }

        SellerClaim sellerClaim = requestPayload.getSellerClaim();
        return riskAssessmentService.evaluate(existingRc, sellerClaim);
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats(HttpServletRequest request) {
        if (!adminKeyValidator.isAdminAuthorized(request)) {
            throw new UnauthorizedException();
        }
        List<Rc> all = rcService.getAll();
        long total = all.size();
        long activeCount = all.stream().filter(rc -> rc.getRegistrationInfo() != null && rc.getRegistrationInfo().isActive()).count();
        long stolenCount = all.stream().filter(rc -> Boolean.TRUE.equals(rc.getStolen())).count();
        long suspiciousCount = all.stream().filter(rc -> Boolean.TRUE.equals(rc.getSuspicious())).count();

        Map<String, Integer> byState = new HashMap<>();
        for (Rc rc : all) {
            String st = rc.getRegistrationState();
            if (st != null && !st.isEmpty()) {
                byState.put(st, byState.getOrDefault(st, 0) + 1);
            }
        }

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");
        Map<String, Integer> monthly = new TreeMap<>();
        for (Rc rc : all) {
            if (rc.getCreatedAt() != null) {
                String key = ZonedDateTime.ofInstant(rc.getCreatedAt(), ZoneId.systemDefault()).format(fmt);
                monthly.put(key, monthly.getOrDefault(key, 0) + 1);
            }
        }

        long ownershipTransfersCount = ownershipHistoryRepository.count();

        Map<String, Object> result = new HashMap<>();
        result.put("total", total);
        result.put("activeCount", activeCount);
        result.put("stolenCount", stolenCount);
        result.put("suspiciousCount", suspiciousCount);
        result.put("ownershipTransfersCount", ownershipTransfersCount);
        result.put("byState", byState);
        result.put("monthlyVerifications", monthly.entrySet().stream()
                .map(e -> Map.of("month", e.getKey(), "count", e.getValue()))
                .toList());
        return result;
    }

    @GetMapping("/page")
    public Map<String, Object> getPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String registrationState,
            @RequestParam(required = false) Boolean stolen,
            @RequestParam(required = false) Boolean suspicious,
            @RequestParam(required = false) String make,
            @RequestParam(required = false) String ownerName,
            HttpServletRequest request) {

        if (page < 0) page = 0;
        if (size < 1) size = 10;
        List<Rc> filtered = rcService.getFiltered(registrationState, stolen, suspicious, make, ownerName);
        int total = filtered.size();
        int from = Math.min(page * size, total);
        int to = Math.min(from + size, total);
        List<Rc> slice = filtered.subList(from, to);
        boolean isAdmin = adminKeyValidator.isAdminAuthorized(request);
        List<RcResponse> dtoList = slice.stream()
                .map(rc -> RcResponse.fromEntity(rc, isAdmin))
                .toList();
        int totalPages = (int) Math.ceil(total / (double) size);

        Map<String, Object> result = new HashMap<>();
        result.put("items", dtoList);
        result.put("page", page);
        result.put("size", size);
        result.put("total", total);
        result.put("totalPages", totalPages);
        return result;
    }

    @PostMapping
    public RcResponse create(@RequestBody Rc rc, HttpServletRequest request) {
        if (!adminKeyValidator.isAdminAuthorized(request)) throw new UnauthorizedException();
        Rc saved = rcService.add(rc);
        return RcResponse.fromEntity(saved, true);
    }

    @PutMapping("/{id}")
    public RcResponse update(@PathVariable String id, @RequestBody Rc rc, HttpServletRequest request) {
        if (!adminKeyValidator.isAdminAuthorized(request)) throw new UnauthorizedException();
        Rc updated = rcService.update(id, rc);
        return RcResponse.fromEntity(updated, true);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id, HttpServletRequest request) {
        if (!adminKeyValidator.isAdminAuthorized(request)) throw new UnauthorizedException();
        rcService.delete(id);
    }
}
