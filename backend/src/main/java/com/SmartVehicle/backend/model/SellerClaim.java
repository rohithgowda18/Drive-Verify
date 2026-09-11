package com.SmartVehicle.backend.model;

import lombok.Data;

@Data
public class SellerClaim {
    private Integer claimedOwnerCount;
    private Integer claimedMileage;        // odometer in km
    private String claimedEngineNumber;     // engine number seller claims is on the vehicle
    private Boolean claimedAccidentFree;
    private Boolean claimedOriginalEngine;
    private Boolean claimedOriginalChassis;
    private Boolean claimedInsuranceValid;
    private Boolean claimedLoanCleared;
}
