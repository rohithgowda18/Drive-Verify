package com.SmartVehicle.backend.controller;

import java.time.Instant;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.SmartVehicle.backend.exception.RcNotFoundException;
import com.SmartVehicle.backend.model.Evidence;
import com.SmartVehicle.backend.model.Rc;
import com.SmartVehicle.backend.model.RiskAssessment;
import com.SmartVehicle.backend.model.SellerClaim;
import com.SmartVehicle.backend.model.VehicleEvent;
import com.SmartVehicle.backend.model.VerificationRequest;
import com.SmartVehicle.backend.repository.RcRepository;
import com.SmartVehicle.backend.repository.VehicleEventRepository;
import com.SmartVehicle.backend.repository.VerificationRequestRepository;
import com.SmartVehicle.backend.service.RiskAssessmentService;

@RestController
@RequestMapping("/api/verifications")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class VerificationController {

    private final VerificationRequestRepository verificationRequestRepository;
    private final RcRepository rcRepository;
    private final VehicleEventRepository vehicleEventRepository;
    private final RiskAssessmentService riskAssessmentService;

    @Autowired
    public VerificationController(
            VerificationRequestRepository verificationRequestRepository,
            RcRepository rcRepository,
            VehicleEventRepository vehicleEventRepository,
            RiskAssessmentService riskAssessmentService) {
        this.verificationRequestRepository = verificationRequestRepository;
        this.rcRepository = rcRepository;
        this.vehicleEventRepository = vehicleEventRepository;
        this.riskAssessmentService = riskAssessmentService;
    }

    @PostMapping
    public VerificationRequest createVerification(@RequestBody VerificationRequest req) {
        if (req.getRcNumber() == null || req.getRcNumber().isBlank()) {
            throw new IllegalArgumentException("rcNumber is required");
        }
        Rc rc = rcRepository.findByRcNumber(req.getRcNumber().trim());
        RiskAssessment assessment = riskAssessmentService.evaluate(rc, req.getSellerClaim(), req.getEvidences());
        
        req.setRiskAssessment(assessment);
        req.setStatus("COMPLETED");
        req.setCreatedAt(Instant.now());
        req.setUpdatedAt(Instant.now());

        return verificationRequestRepository.save(req);
    }

    @GetMapping("/{id}")
    public VerificationRequest getById(@PathVariable String id) {
        return verificationRequestRepository.findById(id)
                .orElseThrow(() -> new RcNotFoundException("Verification request not found: " + id));
    }

    @GetMapping("/vehicle/{rcNumber}")
    public List<VerificationRequest> getByRcNumber(@PathVariable String rcNumber) {
        return verificationRequestRepository.findByRcNumberOrderByCreatedAtDesc(rcNumber);
    }

    @GetMapping("/vehicle/{rcNumber}/timeline")
    public List<VehicleEvent> getVehicleTimeline(@PathVariable String rcNumber) {
        return vehicleEventRepository.findByRcNumberOrderByTimestampDesc(rcNumber);
    }
}
