package com.SmartVehicle.backend.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.SmartVehicle.backend.model.Evidence;
import com.SmartVehicle.backend.model.Rc;
import com.SmartVehicle.backend.model.RiskAssessment;
import com.SmartVehicle.backend.model.SellerClaim;
@Service
public class RiskAssessmentService {

    public RiskAssessment evaluate(Rc rc, SellerClaim claim, List<Evidence> evidences) {
        int score = 100;
        List<String> mismatches = new ArrayList<>();
        List<String> riskReasons = new ArrayList<>();
        List<String> positiveFactors = new ArrayList<>();
        List<String> inspectionChecklist = new ArrayList<>();
        List<String> negotiationPoints = new ArrayList<>();

        if (rc == null) {
            RiskAssessment unverified = new RiskAssessment();
            unverified.setTrustScore(0);
            unverified.setRiskLevel("HIGH");
            unverified.setRiskReasons(List.of("Vehicle record not found in system database"));
            unverified.setGeneratedAt(Instant.now());
            return unverified;
        }

        // 1. Check Flagged Status (Stolen / Suspicious)
        if (Boolean.TRUE.equals(rc.getStolen())) {
            score -= 50;
            mismatches.add("🔴 VEHICLE REPORTED STOLEN in police database");
            riskReasons.add("Vehicle is flagged as stolen. Illegal to purchase or transfer.");
            inspectionChecklist.add("☐ Immediately report to local authorities if seller insists on transaction");
        } else {
            positiveFactors.add("🟢 Clean stolen vehicle status check");
        }

        if (Boolean.TRUE.equals(rc.getSuspicious())) {
            score -= 25;
            mismatches.add("🟡 SUSPICIOUS ACTIVITY FLAG present");
            riskReasons.add("Vehicle has suspicious activity flags recorded by law enforcement / system check");
            inspectionChecklist.add("☐ Inspect chassis and engine numbers closely for signs of physical tampering");
        }

        // 2. Owner Count Verification & Mismatch Detection
        if (claim != null && claim.getClaimedOwnerCount() != null) {
            int actualOwners = rc.getOwnersCount() > 0 ? rc.getOwnersCount() : (1 + (rc.getPreviousOwners() != null ? rc.getPreviousOwners().size() : 0));
            if (!claim.getClaimedOwnerCount().equals(actualOwners)) {
                score -= 15;
                String msg = String.format("🔴 Owner count mismatch: Seller claims %d owner(s), but evidence shows %d owner(s)", claim.getClaimedOwnerCount(), actualOwners);
                mismatches.add(msg);
                riskReasons.add(msg);
                inspectionChecklist.add("☐ Request complete ownership transfer history and original RC card");
                negotiationPoints.add("Owner count claim conflicts with records (seller claimed " + claim.getClaimedOwnerCount() + " vs " + actualOwners + " actual)");
            } else {
                positiveFactors.add("🟢 Claimed owner count (" + actualOwners + ") matches vehicle record");
            }
        }

        // 3. Insurance & PUC Status Checks
        if (rc.getInsurance() != null && rc.getInsurance().getValidTill() != null) {
            positiveFactors.add("🟢 Active insurance policy found (" + rc.getInsurance().getProvider() + ")");
        } else {
            score -= 10;
            riskReasons.add("Insurance policy is missing or unverified");
            inspectionChecklist.add("☐ Verify active third-party or comprehensive vehicle insurance coverage");
        }

        if (rc.getPuc() != null && rc.getPuc().getValidTill() != null) {
            positiveFactors.add("🟢 Pollution Under Control (PUC) certificate active");
        } else {
            score -= 5;
            riskReasons.add("PUC certificate status unverified");
        }

        // 5. Evidence Document Analysis
        if (evidences != null && !evidences.isEmpty()) {
            for (Evidence ev : evidences) {
                if ("MISMATCH".equalsIgnoreCase(ev.getStatus())) {
                    score -= 15;
                    mismatches.add("🔴 Uploaded document (" + ev.getType() + ") contains data mismatches");
                    riskReasons.add("Uploaded evidence document (" + ev.getDocumentName() + ") failed verification check");
                } else if ("VERIFIED".equalsIgnoreCase(ev.getStatus())) {
                    positiveFactors.add("🟢 Verified evidence document: " + ev.getType());
                }
            }
        }

        // Final score calculation & risk classification
        score = Math.max(0, Math.min(100, score));
        String riskLevel = score >= 80 ? "LOW" : (score >= 50 ? "MEDIUM" : "HIGH");

        RiskAssessment assessment = new RiskAssessment();
        assessment.setTrustScore(score);
        assessment.setRiskLevel(riskLevel);
        assessment.setMismatches(mismatches);
        assessment.setRiskReasons(riskReasons);
        assessment.setPositiveFactors(positiveFactors);
        assessment.setInspectionChecklist(inspectionChecklist);
        assessment.setNegotiationPoints(negotiationPoints);
        assessment.setGeneratedAt(Instant.now());

        return assessment;
    }
}
