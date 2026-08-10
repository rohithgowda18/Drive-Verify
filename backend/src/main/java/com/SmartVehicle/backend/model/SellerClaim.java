package com.SmartVehicle.backend.model;

import java.util.List;

public class SellerClaim {
    private Integer claimedOwnerCount;
    private Integer claimedMileage;
    private Boolean claimedAccidentFree;
    private Boolean claimedOriginalEngine;
    private Boolean claimedOriginalChassis;
    private Boolean claimedInsuranceValid;
    private Boolean claimedLoanCleared;

    public Integer getClaimedOwnerCount() { return claimedOwnerCount; }
    public void setClaimedOwnerCount(Integer claimedOwnerCount) { this.claimedOwnerCount = claimedOwnerCount; }

    public Integer getClaimedMileage() { return claimedMileage; }
    public void setClaimedMileage(Integer claimedMileage) { this.claimedMileage = claimedMileage; }

    public Boolean getClaimedAccidentFree() { return claimedAccidentFree; }
    public void setClaimedAccidentFree(Boolean claimedAccidentFree) { this.claimedAccidentFree = claimedAccidentFree; }

    public Boolean getClaimedOriginalEngine() { return claimedOriginalEngine; }
    public void setClaimedOriginalEngine(Boolean claimedOriginalEngine) { this.claimedOriginalEngine = claimedOriginalEngine; }

    public Boolean getClaimedOriginalChassis() { return claimedOriginalChassis; }
    public void setClaimedOriginalChassis(Boolean claimedOriginalChassis) { this.claimedOriginalChassis = claimedOriginalChassis; }

    public Boolean getClaimedInsuranceValid() { return claimedInsuranceValid; }
    public void setClaimedInsuranceValid(Boolean claimedInsuranceValid) { this.claimedInsuranceValid = claimedInsuranceValid; }

    public Boolean getClaimedLoanCleared() { return claimedLoanCleared; }
    public void setClaimedLoanCleared(Boolean claimedLoanCleared) { this.claimedLoanCleared = claimedLoanCleared; }
}
