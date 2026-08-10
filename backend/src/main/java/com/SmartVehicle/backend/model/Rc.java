package com.SmartVehicle.backend.model;

import java.time.Instant;
import java.util.List;

import org.springframework.data.annotation.Id;
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
    // Root-level technical identifiers now (moved from VehicleInfo per new format)
    private String chassisNumber;
    private String engineNumber;
    private String registrationState;
    // Fraud/status flags moved to root per new format
    private Boolean stolen;
    private Boolean suspicious;
    private Integer verified; // Number of times this RC has been verified
    private Instant createdAt;
    private Instant updatedAt;

    @org.springframework.data.annotation.Version
    private Long version;

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    // Getters & Setters (explicit to ensure Jackson binding without Lombok)
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

    private SellerClaim sellerClaim;
    private RiskAssessment riskAssessment;

    public SellerClaim getSellerClaim() { return sellerClaim; }
    public void setSellerClaim(SellerClaim sellerClaim) { this.sellerClaim = sellerClaim; }

    public RiskAssessment getRiskAssessment() { return riskAssessment; }
    public void setRiskAssessment(RiskAssessment riskAssessment) { this.riskAssessment = riskAssessment; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
