package com.SmartVehicle.backend.model;

import java.time.Instant;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "vehicles")
public class Rc {

    @Id
    private String id;

    @Indexed(unique = true)
    private String rcNumber;
    private int ownersCount;
    private List<String> previousOwners;

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
    private Integer verified;
    private Instant createdAt;
    private Instant updatedAt;

    @Version
    private Long version;

    private SellerClaim sellerClaim;
    private RiskAssessment riskAssessment;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRcNumber() { return rcNumber; }
    public void setRcNumber(String rcNumber) { this.rcNumber = rcNumber; }

    public int getOwnersCount() { return ownersCount; }
    public void setOwnersCount(int ownersCount) { this.ownersCount = ownersCount; }

    public List<String> getPreviousOwners() { return previousOwners; }
    public void setPreviousOwners(List<String> previousOwners) { this.previousOwners = previousOwners; }

    public Owner getOwner() { return owner; }
    public void setOwner(Owner owner) { this.owner = owner; }

    public VehicleInfo getVehicleInfo() { return vehicleInfo; }
    public void setVehicleInfo(VehicleInfo vehicleInfo) { this.vehicleInfo = vehicleInfo; }

    public RegistrationInfo getRegistrationInfo() { return registrationInfo; }
    public void setRegistrationInfo(RegistrationInfo registrationInfo) { this.registrationInfo = registrationInfo; }

    public Insurance getInsurance() { return insurance; }
    public void setInsurance(Insurance insurance) { this.insurance = insurance; }

    public Puc getPuc() { return puc; }
    public void setPuc(Puc puc) { this.puc = puc; }

    public String getChassisNumber() { return chassisNumber; }
    public void setChassisNumber(String chassisNumber) { this.chassisNumber = chassisNumber; }

    public String getEngineNumber() { return engineNumber; }
    public void setEngineNumber(String engineNumber) { this.engineNumber = engineNumber; }

    public String getRegistrationState() { return registrationState; }
    public void setRegistrationState(String registrationState) { this.registrationState = registrationState; }

    public Boolean getStolen() { return stolen; }
    public void setStolen(Boolean stolen) { this.stolen = stolen; }

    public Boolean getSuspicious() { return suspicious; }
    public void setSuspicious(Boolean suspicious) { this.suspicious = suspicious; }

    public Integer getVerified() { return verified; }
    public void setVerified(Integer verified) { this.verified = verified; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public SellerClaim getSellerClaim() { return sellerClaim; }
    public void setSellerClaim(SellerClaim sellerClaim) { this.sellerClaim = sellerClaim; }

    public RiskAssessment getRiskAssessment() { return riskAssessment; }
    public void setRiskAssessment(RiskAssessment riskAssessment) { this.riskAssessment = riskAssessment; }

    // Static nested helper structures for MongoDB embedding
    public static class Owner {
        private String name;
        private String phone;
        private String email;
        private String address;
        private String aadhaarLast4;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getAadhaarLast4() { return aadhaarLast4; }
        public void setAadhaarLast4(String aadhaarLast4) { this.aadhaarLast4 = aadhaarLast4; }
    }

    public static class VehicleInfo {
        private String type;
        private String make;
        private String model;
        private String variant;
        private String fuelType;
        private String color;
        private int manufactureYear;

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getMake() { return make; }
        public void setMake(String make) { this.make = make; }
        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }
        public String getVariant() { return variant; }
        public void setVariant(String variant) { this.variant = variant; }
        public String getFuelType() { return fuelType; }
        public void setFuelType(String fuelType) { this.fuelType = fuelType; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
        public int getManufactureYear() { return manufactureYear; }
        public void setManufactureYear(int manufactureYear) { this.manufactureYear = manufactureYear; }
    }

    public static class RegistrationInfo {
        private String registrationDate;
        private String validTill;
        private boolean active;

        public String getRegistrationDate() { return registrationDate; }
        public void setRegistrationDate(String registrationDate) { this.registrationDate = registrationDate; }
        public String getValidTill() { return validTill; }
        public void setValidTill(String validTill) { this.validTill = validTill; }
        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }
    }

    public static class Insurance {
        private String provider;
        private String policyNumber;
        private String validTill;

        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }
        public String getPolicyNumber() { return policyNumber; }
        public void setPolicyNumber(String policyNumber) { this.policyNumber = policyNumber; }
        public String getValidTill() { return validTill; }
        public void setValidTill(String validTill) { this.validTill = validTill; }
    }

    public static class Puc {
        private String certificateNumber;
        private String validTill;
        private boolean stolen;
        private boolean suspicious;

        public String getCertificateNumber() { return certificateNumber; }
        public void setCertificateNumber(String certificateNumber) { this.certificateNumber = certificateNumber; }
        public String getValidTill() { return validTill; }
        public void setValidTill(String validTill) { this.validTill = validTill; }
        public boolean isStolen() { return stolen; }
        public void setStolen(boolean stolen) { this.stolen = stolen; }
        public boolean isSuspicious() { return suspicious; }
        public void setSuspicious(boolean suspicious) { this.suspicious = suspicious; }
    }
}
