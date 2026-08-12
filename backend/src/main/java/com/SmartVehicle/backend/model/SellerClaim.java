package com.SmartVehicle.backend.model;

import lombok.Data;

@Data
public class SellerClaim {
    private Integer claimedOwnerCount;
    private Boolean claimedAccidentFree;
    private Boolean claimedOriginalEngine;
    private Boolean claimedOriginalChassis;
    private Boolean claimedInsuranceValid;
    private Boolean claimedLoanCleared;
}
