package com.SmartVehicle.backend.dto;

import lombok.Data;

@Data
public class EvaluateVehicleRequest {
    private String rcNumber;
    private SellerClaim sellerClaim;

    @Data
    public static class SellerClaim {
        private Integer claimedOwnerCount;
        private Integer claimedMileage;
        private String claimedEngineNumber;
        private Boolean claimedAccidentFree;
        private Boolean claimedOriginalEngine;
        private Boolean claimedOriginalChassis;
        private Boolean claimedInsuranceValid;
        private Boolean claimedLoanCleared;
    }
}
