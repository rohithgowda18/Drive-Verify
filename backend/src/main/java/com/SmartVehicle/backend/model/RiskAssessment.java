package com.SmartVehicle.backend.model;

import java.time.Instant;
import java.util.List;

public class RiskAssessment {
    private int trustScore;
    private String riskLevel;
    private List<String> mismatches;
    private List<String> riskReasons;
    private List<String> positiveFactors;
    private List<String> inspectionChecklist;
    private List<String> negotiationPoints;
    private Instant generatedAt;

    public int getTrustScore() { return trustScore; }
    public void setTrustScore(int trustScore) { this.trustScore = trustScore; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public List<String> getMismatches() { return mismatches; }
    public void setMismatches(List<String> mismatches) { this.mismatches = mismatches; }

    public List<String> getRiskReasons() { return riskReasons; }
    public void setRiskReasons(List<String> riskReasons) { this.riskReasons = riskReasons; }

    public List<String> getPositiveFactors() { return positiveFactors; }
    public void setPositiveFactors(List<String> positiveFactors) { this.positiveFactors = positiveFactors; }

    public List<String> getInspectionChecklist() { return inspectionChecklist; }
    public void setInspectionChecklist(List<String> inspectionChecklist) { this.inspectionChecklist = inspectionChecklist; }

    public List<String> getNegotiationPoints() { return negotiationPoints; }
    public void setNegotiationPoints(List<String> negotiationPoints) { this.negotiationPoints = negotiationPoints; }

    public Instant getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(Instant generatedAt) { this.generatedAt = generatedAt; }
}
