package com.SmartVehicle.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.SmartVehicle.backend.model.Rc;
import com.SmartVehicle.backend.model.RiskAssessment;
import com.SmartVehicle.backend.model.RiskAssessment.Finding;
import com.SmartVehicle.backend.model.SellerClaim;

@Service
public class RiskAssessmentService {

    public RiskAssessment evaluate(Rc rc, SellerClaim claim, int actualOwners) {
        int score = 100;
        List<String> mismatches = new ArrayList<>();
        List<String> riskReasons = new ArrayList<>();
        List<String> positiveFactors = new ArrayList<>();
        List<String> inspectionChecklist = new ArrayList<>();
        List<String> negotiationPoints = new ArrayList<>();
        List<Finding> findings = new ArrayList<>();

        if (rc == null) {
            RiskAssessment unverified = new RiskAssessment();
            unverified.setTrustScore(0);
            unverified.setRiskLevel("HIGH");
            unverified.setRiskReasons(List.of("Vehicle record not found in system database"));
            unverified.setFindings(List.of());
            unverified.setMismatches(List.of());
            unverified.setPositiveFactors(List.of());
            unverified.setInspectionChecklist(List.of("☐ Verify vehicle existence with RTO before proceeding"));
            unverified.setNegotiationPoints(List.of());
            unverified.setGeneratedAt(Instant.now());
            return unverified;
        }

        // Always include standard "Before You Pay" checklist items
        inspectionChecklist.add("☐ Verify original RC document physically");
        inspectionChecklist.add("☐ Match chassis number on vehicle body with RC");
        inspectionChecklist.add("☐ Match engine number on engine block with RC");
        inspectionChecklist.add("☐ Confirm seller identity with valid ID proof");
        inspectionChecklist.add("☐ Check active insurance and PUC documents");
        inspectionChecklist.add("☐ Resolve all flagged inconsistencies before payment");

        // 1. Stolen / Suspicious flags
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

        // 2. Owner Count
        if (claim != null && claim.getClaimedOwnerCount() != null) {
            if (!claim.getClaimedOwnerCount().equals(actualOwners)) {
                score -= 15;
                String msg = String.format("Possible inconsistency: Seller claims %d owner(s), records show %d owner(s)",
                        claim.getClaimedOwnerCount(), actualOwners);
                mismatches.add(msg);
                riskReasons.add(msg);
                negotiationPoints.add("Owner count claim conflicts with records (seller claimed "
                        + claim.getClaimedOwnerCount() + " vs " + actualOwners + " actual)");
                findings.add(new Finding("Owner Count",
                        String.valueOf(claim.getClaimedOwnerCount()),
                        String.valueOf(actualOwners),
                        "Possible inconsistency — requires verification", false));
            } else {
                positiveFactors.add("🟢 Claimed owner count (" + actualOwners + ") matches vehicle record");
                findings.add(new Finding("Owner Count",
                        String.valueOf(claim.getClaimedOwnerCount()),
                        String.valueOf(actualOwners),
                        "Match", true));
            }
        }

        // 3. Mileage / Odometer
        if (claim != null && claim.getClaimedMileage() != null) {
            Integer recordedMileage = (rc.getVehicleInfo() != null) ? rc.getVehicleInfo().getMileage() : null;
            if (recordedMileage != null) {
                if (claim.getClaimedMileage() < recordedMileage) {
                    // Seller claims LESS than recorded — odometer rollback risk
                    score -= 20;
                    String msg = String.format("Risk signal: Seller claims %,d km but records show %,d km — possible odometer rollback",
                            claim.getClaimedMileage(), recordedMileage);
                    mismatches.add(msg);
                    riskReasons.add(msg);
                    negotiationPoints.add("Mileage discrepancy: claimed " + claim.getClaimedMileage() + " km vs recorded " + recordedMileage + " km");
                    findings.add(new Finding("Mileage (Odometer)",
                            String.format("%,d km", claim.getClaimedMileage()),
                            String.format("%,d km", recordedMileage),
                            "Risk signal — possible odometer rollback", false));
                } else if (claim.getClaimedMileage() > recordedMileage + 20000) {
                    // Seller claims much MORE than recorded — unusual but less risky
                    score -= 5;
                    String msg = String.format("Requires verification: Seller claims %,d km, records show %,d km — significant gap",
                            claim.getClaimedMileage(), recordedMileage);
                    mismatches.add(msg);
                    findings.add(new Finding("Mileage (Odometer)",
                            String.format("%,d km", claim.getClaimedMileage()),
                            String.format("%,d km", recordedMileage),
                            "Requires verification — significant gap from records", false));
                } else {
                    positiveFactors.add("🟢 Claimed mileage (" + String.format("%,d", claim.getClaimedMileage()) + " km) is consistent with records");
                    findings.add(new Finding("Mileage (Odometer)",
                            String.format("%,d km", claim.getClaimedMileage()),
                            String.format("%,d km", recordedMileage),
                            "Match", true));
                }
            } else {
                // No recorded mileage to compare
                findings.add(new Finding("Mileage (Odometer)",
                        String.format("%,d km", claim.getClaimedMileage()),
                        "Not available in records",
                        "Cannot verify — no recorded mileage", false));
            }
        }

        // 4. Engine Number / Original Engine
        if (claim != null && claim.getClaimedEngineNumber() != null && !claim.getClaimedEngineNumber().isBlank()) {
            String recordedEngine = rc.getEngineNumber();
            if (recordedEngine != null && !recordedEngine.isBlank()) {
                if (recordedEngine.equalsIgnoreCase(claim.getClaimedEngineNumber().trim())) {
                    positiveFactors.add("🟢 Engine number matches vehicle record");
                    findings.add(new Finding("Engine Number",
                            claim.getClaimedEngineNumber().trim(),
                            recordedEngine,
                            "Match", true));
                } else {
                    score -= 20;
                    String msg = "Risk signal: Engine number mismatch — possible engine replacement or tampering";
                    mismatches.add(msg);
                    riskReasons.add(msg);
                    negotiationPoints.add("Engine number does not match RC records");
                    findings.add(new Finding("Engine Number",
                            claim.getClaimedEngineNumber().trim(),
                            recordedEngine,
                            "Risk signal — engine identity mismatch", false));
                }
            } else {
                findings.add(new Finding("Engine Number",
                        claim.getClaimedEngineNumber().trim(),
                        "Not available in records",
                        "Cannot verify — no recorded engine number", false));
            }
        } else if (claim != null && Boolean.FALSE.equals(claim.getClaimedOriginalEngine())) {
            // Seller admits engine is not original
            score -= 10;
            String msg = "Risk signal: Seller acknowledges engine is not original";
            mismatches.add(msg);
            riskReasons.add(msg);
            findings.add(new Finding("Original Engine",
                    "No (seller declared)",
                    rc.getEngineNumber() != null ? "Engine on record: " + rc.getEngineNumber() : "N/A",
                    "Risk signal — engine not original per seller", false));
        }

        // 5. Insurance Validity
        if (claim != null && Boolean.TRUE.equals(claim.getClaimedInsuranceValid())) {
            if (rc.getInsurance() != null && rc.getInsurance().getValidTill() != null) {
                boolean expired = isDateExpired(rc.getInsurance().getValidTill());
                if (expired) {
                    score -= 10;
                    String msg = "Possible inconsistency: Seller claims active insurance, but records show it expired";
                    mismatches.add(msg);
                    riskReasons.add(msg);
                    findings.add(new Finding("Insurance Valid",
                            "Yes (seller claims active)",
                            "Expired (" + rc.getInsurance().getValidTill() + ")",
                            "Possible inconsistency — insurance appears expired", false));
                } else {
                    positiveFactors.add("🟢 Active insurance policy found (" + rc.getInsurance().getProvider() + ")");
                    findings.add(new Finding("Insurance Valid",
                            "Yes",
                            "Valid till " + rc.getInsurance().getValidTill() + " (" + rc.getInsurance().getProvider() + ")",
                            "Match", true));
                }
            } else {
                score -= 10;
                riskReasons.add("Insurance policy is missing or unverified");
                findings.add(new Finding("Insurance Valid",
                        "Yes (seller claims active)",
                        "No insurance record found",
                        "Requires verification — no insurance on record", false));
            }
        } else {
            // No insurance claim made — just check presence
            if (rc.getInsurance() != null && rc.getInsurance().getValidTill() != null) {
                positiveFactors.add("🟢 Active insurance policy found (" + rc.getInsurance().getProvider() + ")");
            } else {
                score -= 10;
                riskReasons.add("Insurance policy is missing or unverified");
                inspectionChecklist.add("☐ Verify active third-party or comprehensive vehicle insurance coverage");
            }
        }

        // 6. Accident History claim
        if (claim != null && Boolean.TRUE.equals(claim.getClaimedAccidentFree())) {
            if (Boolean.TRUE.equals(rc.getSuspicious())) {
                score -= 15;
                String msg = "Possible inconsistency: Seller claims accident-free but vehicle has suspicious flags";
                mismatches.add(msg);
                riskReasons.add(msg);
                findings.add(new Finding("Accident Free",
                        "Yes (seller claims)",
                        "Suspicious flag on record",
                        "Possible inconsistency — vehicle flagged suspicious", false));
            } else {
                positiveFactors.add("🟢 Seller claims accident-free, no contradicting flags on record");
                findings.add(new Finding("Accident Free",
                        "Yes",
                        "No adverse flags",
                        "Match — no contradicting records", true));
            }
        }

        // 7. PUC Status
        if (rc.getPuc() != null && rc.getPuc().getValidTill() != null) {
            positiveFactors.add("🟢 Pollution Under Control (PUC) certificate active");
        } else {
            score -= 5;
            riskReasons.add("PUC certificate status unverified");
        }

        // Final score calculation & risk classification
        score = Math.max(0, Math.min(100, score));
        String riskLevel = score >= 80 ? "LOW" : (score >= 50 ? "MEDIUM" : "HIGH");

        RiskAssessment assessment = new RiskAssessment();
        assessment.setTrustScore(score);
        assessment.setRiskLevel(riskLevel);
        assessment.setFindings(findings);
        assessment.setMismatches(mismatches);
        assessment.setRiskReasons(riskReasons);
        assessment.setPositiveFactors(positiveFactors);
        assessment.setInspectionChecklist(inspectionChecklist);
        assessment.setNegotiationPoints(negotiationPoints);
        assessment.setGeneratedAt(Instant.now());

        return assessment;
    }

    public RiskAssessment evaluate(Rc rc, SellerClaim claim) {
        return evaluate(rc, claim, 1);
    }

    /** Check if a date string (yyyy-MM-dd or similar) is before today */
    private boolean isDateExpired(String dateStr) {
        try {
            LocalDate date = LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
            return date.isBefore(LocalDate.now());
        } catch (Exception e) {
            return false; // if unparseable, don't penalize
        }
    }
}

