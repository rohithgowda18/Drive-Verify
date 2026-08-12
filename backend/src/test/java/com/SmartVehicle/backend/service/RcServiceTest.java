package com.SmartVehicle.backend.service;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.mongodb.core.MongoTemplate;

import com.SmartVehicle.backend.model.Rc;
import com.SmartVehicle.backend.repository.OwnershipHistoryRepository;
import com.SmartVehicle.backend.repository.RcRepository;

public class RcServiceTest {

    @Mock
    private RcRepository rcRepository;

    @Mock
    private OwnershipHistoryRepository ownershipHistoryRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private MongoTemplate mongoTemplate;

    private RcServiceImpl rcService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        rcService = new RcServiceImpl(rcRepository, ownershipHistoryRepository, emailService, mongoTemplate);
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
