package com.SmartVehicle.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.SmartVehicle.backend.model.Rc;
import com.SmartVehicle.backend.model.RiskAssessment;
import com.SmartVehicle.backend.model.SellerClaim;

public class RiskAssessmentServiceTest {

    private RiskAssessmentService riskAssessmentService;

    @BeforeEach
    public void setUp() {
        riskAssessmentService = new RiskAssessmentService();
    }

    private Rc buildCleanRc() {
        Rc rc = new Rc();
        rc.setRcNumber("KA01AB1234");
        rc.setStolen(false);
        rc.setSuspicious(false);
        rc.setEngineNumber("ENG123456");
        rc.setChassisNumber("CHS789012");

        Rc.VehicleInfo vi = new Rc.VehicleInfo();
        vi.setMake("Maruti");
        vi.setModel("Swift");
        vi.setMileage(45000);
        rc.setVehicleInfo(vi);

        Rc.Insurance ins = new Rc.Insurance();
        ins.setProvider("ICICI Lombard");
        ins.setValidTill("2030-01-01");
        rc.setInsurance(ins);

        Rc.Puc puc = new Rc.Puc();
        puc.setValidTill("2030-01-01");
        rc.setPuc(puc);

        return rc;
    }

    @Test
    public void testCleanVehicleEvaluation() {
        Rc rc = buildCleanRc();

        SellerClaim claim = new SellerClaim();
        claim.setClaimedOwnerCount(1);
        claim.setClaimedMileage(45000);
        claim.setClaimedEngineNumber("ENG123456");
        claim.setClaimedInsuranceValid(true);
        claim.setClaimedAccidentFree(true);

        RiskAssessment assessment = riskAssessmentService.evaluate(rc, claim, 1);

        assertNotNull(assessment);
        assertEquals(100, assessment.getTrustScore());
        assertEquals("LOW", assessment.getRiskLevel());
        assertTrue(assessment.getMismatches().isEmpty());
        assertFalse(assessment.getFindings().isEmpty());
        assertTrue(assessment.getFindings().stream().allMatch(RiskAssessment.Finding::isMatch));
    }

    @Test
    public void testOwnerCountMismatchAndStolenFlag() {
        Rc rc = buildCleanRc();
        rc.setStolen(true);

        SellerClaim claim = new SellerClaim();
        claim.setClaimedOwnerCount(1); // Mismatch: seller claims 1, actual is 3

        RiskAssessment assessment = riskAssessmentService.evaluate(rc, claim, 3);

        assertNotNull(assessment);
        assertEquals("HIGH", assessment.getRiskLevel());
        assertTrue(assessment.getTrustScore() <= 40);
        assertTrue(assessment.getMismatches().size() >= 2);
    }

    @Test
    public void testMileageRollbackDetected() {
        Rc rc = buildCleanRc();
        rc.getVehicleInfo().setMileage(60000); // recorded: 60k

        SellerClaim claim = new SellerClaim();
        claim.setClaimedMileage(30000); // seller claims 30k — rollback

        RiskAssessment assessment = riskAssessmentService.evaluate(rc, claim, 1);

        assertNotNull(assessment);
        assertTrue(assessment.getTrustScore() <= 80); // -20 for mileage rollback
        assertTrue(assessment.getMismatches().stream().anyMatch(m -> m.contains("odometer rollback")));
        assertTrue(assessment.getFindings().stream()
                .anyMatch(f -> f.getField().equals("Mileage (Odometer)") && !f.isMatch()));
    }

    @Test
    public void testEngineNumberMismatch() {
        Rc rc = buildCleanRc();
        rc.setEngineNumber("ENG123456");

        SellerClaim claim = new SellerClaim();
        claim.setClaimedEngineNumber("ENG999999"); // wrong engine

        RiskAssessment assessment = riskAssessmentService.evaluate(rc, claim, 1);

        assertNotNull(assessment);
        assertTrue(assessment.getTrustScore() <= 80); // -20 for engine mismatch
        assertTrue(assessment.getFindings().stream()
                .anyMatch(f -> f.getField().equals("Engine Number") && !f.isMatch()));
    }

    @Test
    public void testInsuranceClaimVsExpiredRecord() {
        Rc rc = buildCleanRc();
        rc.getInsurance().setValidTill("2020-01-01"); // expired

        SellerClaim claim = new SellerClaim();
        claim.setClaimedInsuranceValid(true);

        RiskAssessment assessment = riskAssessmentService.evaluate(rc, claim, 1);

        assertNotNull(assessment);
        assertTrue(assessment.getTrustScore() <= 90);
        assertTrue(assessment.getFindings().stream()
                .anyMatch(f -> f.getField().equals("Insurance Valid") && !f.isMatch()));
    }

    @Test
    public void testAccidentFreeClaimWithSuspiciousFlag() {
        Rc rc = buildCleanRc();
        rc.setSuspicious(true);

        SellerClaim claim = new SellerClaim();
        claim.setClaimedAccidentFree(true);

        RiskAssessment assessment = riskAssessmentService.evaluate(rc, claim, 1);

        assertNotNull(assessment);
        // -25 for suspicious, -15 for accident claim inconsistency
        assertTrue(assessment.getTrustScore() <= 65);
        assertTrue(assessment.getFindings().stream()
                .anyMatch(f -> f.getField().equals("Accident Free") && !f.isMatch()));
    }

    @Test
    public void testNullRcReturnsHighRisk() {
        RiskAssessment assessment = riskAssessmentService.evaluate(null, null, 0);

        assertNotNull(assessment);
        assertEquals(0, assessment.getTrustScore());
        assertEquals("HIGH", assessment.getRiskLevel());
    }

    @Test
    public void testRiskLevelClassification() {
        // Score 80+ = LOW
        Rc rc = buildCleanRc();
        SellerClaim claim = new SellerClaim();
        RiskAssessment low = riskAssessmentService.evaluate(rc, claim, 1);
        assertEquals("LOW", low.getRiskLevel());
        assertTrue(low.getTrustScore() >= 80);

        // Score 50-79 = MEDIUM
        Rc rcMed = buildCleanRc();
        rcMed.setSuspicious(true);
        SellerClaim claimMed = new SellerClaim();
        claimMed.setClaimedAccidentFree(true);
        RiskAssessment med = riskAssessmentService.evaluate(rcMed, claimMed, 1);
        assertEquals("MEDIUM", med.getRiskLevel());

        // Score <50 = HIGH
        Rc rcHigh = buildCleanRc();
        rcHigh.setStolen(true);
        rcHigh.setSuspicious(true); // stolen(-50) + suspicious(-25) = 25 → HIGH
        RiskAssessment high = riskAssessmentService.evaluate(rcHigh, null, 1);
        assertEquals("HIGH", high.getRiskLevel());
    }
}

