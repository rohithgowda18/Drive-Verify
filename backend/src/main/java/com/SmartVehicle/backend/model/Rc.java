package com.SmartVehicle.backend.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "vehicles")
public class Rc {

    @Id
    private String id;

    @Indexed(unique = true)
    private String rcNumber;

    private Owner owner;
    private VehicleInfo vehicleInfo;
    private RegistrationInfo registrationInfo;
    private Insurance insurance;
    private Puc puc;
    private String chassisNumber;
    private String engineNumber;
    private String registrationState;
    private Boolean stolen;
    private Boolean suspicious;
    private Instant createdAt;
    private Instant updatedAt;


    @Data
    public static class Owner {
        private String name;
        private String phone;
        private String email;
        private String address;
        private String aadhaarLast4;
    }

    @Data
    public static class VehicleInfo {
        private String type;
        private String make;
        private String model;
        private String variant;
        private String fuelType;
        private String color;
        private int manufactureYear;
        private String imageUrl;
    }


    @Data
    public static class RegistrationInfo {
        private String registrationDate;
        private String validTill;
        private boolean active;
    }

    @Data
    public static class Insurance {
        private String provider;
        private String policyNumber;
        private String validTill;
    }

    @Data
    public static class Puc {
        private String certificateNumber;
        private String validTill;
    }
}
