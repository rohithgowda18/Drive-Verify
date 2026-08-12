package com.SmartVehicle.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;

import com.SmartVehicle.backend.model.Rc;
import com.SmartVehicle.backend.repository.OwnershipHistoryRepository;
import com.SmartVehicle.backend.repository.RcRepository;

public class RcServiceTest {

    @Mock
    private RcRepository rcRepository;

    @Mock
    private OwnershipHistoryRepository ownershipHistoryRepository;

    @Mock
    private MeterRegistry meterRegistry;

    @Mock
    private Counter counter;

    @Mock
    private EmailService emailService;

    @Mock
    private org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;

    private RcServiceImpl rcService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        when(meterRegistry.counter(anyString(), any(String[].class))).thenReturn(counter);
        rcService = new RcServiceImpl(rcRepository, ownershipHistoryRepository, meterRegistry, emailService, mongoTemplate);
    }

    @Test
    public void testGetByIdNotFound() {
        when(rcRepository.findById("invalid")).thenReturn(Optional.empty());
        Rc found = rcService.getById("invalid");
        assertNull(found);
    }

    @Test
    public void testAddVehicleValidatesRequiredFields() {
        Rc invalid = new Rc();
        assertThrows(IllegalArgumentException.class, () -> rcService.add(invalid));
    }
}
