package com.SmartVehicle.backend.model;

import java.time.Instant;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
public class RiskAssessment {
    private int trustScore;
    private String riskLevel;
    private List<Finding> findings;         // structured claim vs evidence comparisons
    private List<String> mismatches;
    private List<String> riskReasons;
    private List<String> positiveFactors;
    private List<String> inspectionChecklist;
    private List<String> negotiationPoints;
    private Instant generatedAt;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Finding {
        private String field;           // e.g. "Owner Count"
        private String sellerClaim;     // what the seller said
        private String recordedValue;   // what records show
        private String result;          // "Match" or "Possible inconsistency" etc.
        private boolean match;
    }
}
