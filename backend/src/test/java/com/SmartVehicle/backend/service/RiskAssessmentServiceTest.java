package com.SmartVehicle.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.SmartVehicle.backend.model.Insurance;
import com.SmartVehicle.backend.model.Puc;
import com.SmartVehicle.backend.model.Rc;
import com.SmartVehicle.backend.model.RiskAssessment;
import com.SmartVehicle.backend.model.SellerClaim;
import com.SmartVehicle.backend.model.VehicleEvent;
import com.SmartVehicle.backend.repository.VehicleEventRepository;

public class RiskAssessmentServiceTest {

    @Mock
    private VehicleEventRepository vehicleEventRepository;

    @InjectMocks
    private RiskAssessmentService riskAssessmentService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testCleanVehicleEvaluation() {
        Rc rc = new Rc();
        rc.setRcNumber("KA01AB1234");
        rc.setOwnersCount(1);
        rc.setStolen(false);
        rc.setSuspicious(false);
        Insurance ins = new Insurance();
        ins.setValidTill("2030-01-01");
        rc.setInsurance(ins);
        Puc puc = new Puc();
        puc.setValidTill("2030-01-01");
        rc.setPuc(puc);

        SellerClaim claim = new SellerClaim();
        claim.setClaimedOwnerCount(1);
        claim.setClaimedMileage(45000);

        when(vehicleEventRepository.findByRcNumberOrderByTimestampDesc("KA01AB1234"))
                .thenReturn(Collections.emptyList());

        RiskAssessment assessment = riskAssessmentService.evaluate(rc, claim, Collections.emptyList());

        assertNotNull(assessment);
        assertEquals(100, assessment.getTrustScore());
        assertEquals("LOW", assessment.getRiskLevel());
        assertTrue(assessment.getMismatches().isEmpty());
    }

    @Test
    public void testOwnerCountMismatchAndStolenFlag() {
        Rc rc = new Rc();
        rc.setRcNumber("KA01AB1234");
        rc.setOwnersCount(3);
        rc.setStolen(true);

        SellerClaim claim = new SellerClaim();
        claim.setClaimedOwnerCount(1); // Mismatch: seller claims 1, actual is 3

        when(vehicleEventRepository.findByRcNumberOrderByTimestampDesc("KA01AB1234"))
                .thenReturn(Collections.emptyList());

        RiskAssessment assessment = riskAssessmentService.evaluate(rc, claim, Collections.emptyList());

        assertNotNull(assessment);
        assertEquals("HIGH", assessment.getRiskLevel());
        assertTrue(assessment.getTrustScore() <= 40);
        assertTrue(assessment.getMismatches().size() >= 2);
    }

    @Test
    public void testOdometerRollbackDetection() {
        Rc rc = new Rc();
        rc.setRcNumber("KA01AB1234");
        rc.setOwnersCount(1);

        SellerClaim claim = new SellerClaim();
        claim.setClaimedMileage(45000); // Seller claims 45,000 km

        VehicleEvent pastService = new VehicleEvent();
        pastService.setRcNumber("KA01AB1234");
        pastService.setRecordedMileage(75000); // Past service was 75,000 km -> Rollback!

        when(vehicleEventRepository.findByRcNumberOrderByTimestampDesc("KA01AB1234"))
                .thenReturn(List.of(pastService));

        RiskAssessment assessment = riskAssessmentService.evaluate(rc, claim, Collections.emptyList());

        assertNotNull(assessment);
        assertTrue(assessment.getTrustScore() < 100);
        assertTrue(assessment.getRiskReasons().stream().anyMatch(r -> r.contains("odometer rollback")));
    }
}
