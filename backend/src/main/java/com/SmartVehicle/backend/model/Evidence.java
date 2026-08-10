package com.SmartVehicle.backend.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "evidence")
public class Evidence {
    @Id
    private String id;
    private String verificationRequestId;
    private String rcNumber;
    private String type; // RC_DOCUMENT, INSURANCE_DOCUMENT, PUC_DOCUMENT, SERVICE_RECORD, INSPECTION_REPORT
    private String source; // SELLER_PROVIDED, DATABASE, AUTHORIZED_PROVIDER
    private String status; // VERIFIED, MISMATCH, UNVERIFIED, EXPIRED
    private String documentName;
    private String extractedChassisNumber;
    private String extractedEngineNumber;
    private Integer extractedMileage;
    private Instant uploadedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getVerificationRequestId() { return verificationRequestId; }
    public void setVerificationRequestId(String verificationRequestId) { this.verificationRequestId = verificationRequestId; }

    public String getRcNumber() { return rcNumber; }
    public void setRcNumber(String rcNumber) { this.rcNumber = rcNumber; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDocumentName() { return documentName; }
    public void setDocumentName(String documentName) { this.documentName = documentName; }

    public String getExtractedChassisNumber() { return extractedChassisNumber; }
    public void setExtractedChassisNumber(String extractedChassisNumber) { this.extractedChassisNumber = extractedChassisNumber; }

    public String getExtractedEngineNumber() { return extractedEngineNumber; }
    public void setExtractedEngineNumber(String extractedEngineNumber) { this.extractedEngineNumber = extractedEngineNumber; }

    public Integer getExtractedMileage() { return extractedMileage; }
    public void setExtractedMileage(Integer extractedMileage) { this.extractedMileage = extractedMileage; }

    public Instant getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }
}
