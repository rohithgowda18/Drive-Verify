package com.SmartVehicle.backend.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "ownership_history")
public class OwnershipHistory {

    @Id
    private String id;

    @Indexed
    private String rcId;
    @Indexed
    private String rcNumber;

    private String previousOwnerName;
    private String newOwnerName;
    private Instant transferredAt;
    private Boolean stolenAtTransfer;
    private Boolean suspiciousAtTransfer;
}
