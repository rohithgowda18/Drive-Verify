package com.SmartVehicle.backend.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "vehicle_events")
public class VehicleEvent {
    @Id
    private String id;
    private String rcNumber;
    private String eventType; // REGISTRATION, OWNERSHIP_TRANSFER, INSURANCE_RENEWAL, PUC_CHECK, SERVICE_EVENT, ACCIDENT_FLAG, SUSPICIOUS_FLAG
    private Instant timestamp;
    private String source;
    private String description;
    private Integer recordedMileage;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRcNumber() { return rcNumber; }
    public void setRcNumber(String rcNumber) { this.rcNumber = rcNumber; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getRecordedMileage() { return recordedMileage; }
    public void setRecordedMileage(Integer recordedMileage) { this.recordedMileage = recordedMileage; }
}
