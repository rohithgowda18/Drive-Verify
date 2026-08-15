package com.SmartVehicle.backend.dto;

import com.SmartVehicle.backend.model.Rc;
import lombok.Data;

@Data
public class OwnershipTransferRequest {
    private Rc.Owner newOwner;
}
