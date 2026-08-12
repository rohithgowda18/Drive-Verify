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

public class RiskAssessmentServiceTest {

    private RiskAssessmentService riskAssessmentService;

    @BeforeEach
    public void setUp() {
        riskAssessmentService = new RiskAssessmentService();
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

        RiskAssessment assessment = riskAssessmentService.evaluate(rc, claim);

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

        RiskAssessment assessment = riskAssessmentService.evaluate(rc, claim);

        assertNotNull(assessment);
        assertEquals("HIGH", assessment.getRiskLevel());
        assertTrue(assessment.getTrustScore() <= 40);
        assertTrue(assessment.getMismatches().size() >= 2);
    }
}
