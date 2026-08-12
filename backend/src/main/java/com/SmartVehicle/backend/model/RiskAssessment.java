package com.SmartVehicle.backend.model;

import java.time.Instant;
import java.util.List;

import lombok.Data;

@Data
public class RiskAssessment {
    private int trustScore;
    private String riskLevel;
    private List<String> mismatches;
    private List<String> riskReasons;
    private List<String> positiveFactors;
    private List<String> inspectionChecklist;
    private List<String> negotiationPoints;
    private Instant generatedAt;
}
