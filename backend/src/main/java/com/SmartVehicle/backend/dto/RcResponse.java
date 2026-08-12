package com.SmartVehicle.backend.dto;

import java.time.Instant;
import java.util.List;

import com.SmartVehicle.backend.model.Rc;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RcResponse {

    private String id;
    private String rcNumber;
    private int ownersCount;
    private List<String> previousOwners;

    private OwnerDto owner;
    private Rc.VehicleInfo vehicleInfo;
    private Rc.RegistrationInfo registrationInfo;
    private Rc.Insurance insurance;
    private Rc.Puc puc;
    private String chassisNumber;
    private String engineNumber;
    private String registrationState;
    private Boolean stolen;
    private Boolean suspicious;
    private Integer verified;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    public static class OwnerDto {
        private String name;
        private String phone;
        private String email;
        private String address;
        private String aadhaarLast4;
    }

    public static RcResponse fromEntity(Rc rc, boolean isAdmin) {
        if (rc == null) return null;

        OwnerDto ownerDto = null;
        if (rc.getOwner() != null) {
            Rc.Owner o = rc.getOwner();
            ownerDto = OwnerDto.builder()
                    .name(o.getName())
                    .phone(isAdmin ? o.getPhone() : maskPhone(o.getPhone()))
                    .email(isAdmin ? o.getEmail() : maskEmail(o.getEmail()))
                    .address(isAdmin ? o.getAddress() : "Protected PII Address")
                    .aadhaarLast4(isAdmin ? o.getAadhaarLast4() : "****")
                    .build();
        }

        return RcResponse.builder()
                .id(rc.getId())
                .rcNumber(rc.getRcNumber())
                .ownersCount(rc.getOwnersCount())
                .previousOwners(rc.getPreviousOwners())
                .owner(ownerDto)
                .vehicleInfo(rc.getVehicleInfo())
                .registrationInfo(rc.getRegistrationInfo())
                .insurance(rc.getInsurance())
                .puc(rc.getPuc())
                .chassisNumber(isAdmin ? rc.getChassisNumber() : maskLast4(rc.getChassisNumber()))
                .engineNumber(isAdmin ? rc.getEngineNumber() : maskLast4(rc.getEngineNumber()))
                .registrationState(rc.getRegistrationState())
                .stolen(rc.getStolen())
                .suspicious(rc.getSuspicious())
                .verified(rc.getVerified())
                .createdAt(rc.getCreatedAt())
                .updatedAt(rc.getUpdatedAt())
                .build();
    }

    private static String maskLast4(String val) {
        if (val == null) return null;
        if (val.length() <= 4) return "****";
        return "****" + val.substring(val.length() - 4);
    }

    private static String maskPhone(String phone) {
        if (phone == null) return null;
        if (phone.length() <= 4) return "******";
        return "******" + phone.substring(phone.length() - 4);
    }

    private static String maskEmail(String email) {
        if (email == null) return null;
        return "masked@privacy.internal";
    }
}
