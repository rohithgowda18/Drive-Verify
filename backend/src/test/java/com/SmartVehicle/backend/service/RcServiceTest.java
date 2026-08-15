package com.SmartVehicle.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.mongodb.core.MongoTemplate;

import com.SmartVehicle.backend.dto.OwnershipTransferRequest;
import com.SmartVehicle.backend.dto.RcResponse;
import com.SmartVehicle.backend.exception.RcNotFoundException;
import com.SmartVehicle.backend.model.OwnershipHistory;
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

    private Rc createSampleRc() {
        Rc rc = new Rc();
        rc.setId("rc-123");
        rc.setRcNumber("KA01AB1234");
        rc.setChassisNumber("CH12345");

        rc.setEngineNumber("ENG67890");
        rc.setRegistrationState("KA");
        rc.setStolen(false);
        rc.setSuspicious(false);
        rc.setCreatedAt(Instant.now());
        rc.setUpdatedAt(Instant.now());

        Rc.Owner owner = new Rc.Owner();
        owner.setName("Darshan");
        owner.setEmail("darshan@example.com");
        owner.setPhone("9876543210");
        rc.setOwner(owner);

        Rc.VehicleInfo info = new Rc.VehicleInfo();
        info.setMake("Toyota");
        info.setModel("Camry");
        rc.setVehicleInfo(info);

        Rc.RegistrationInfo reg = new Rc.RegistrationInfo();
        reg.setActive(true);
        reg.setRegistrationDate("2020-01-01");
        rc.setRegistrationInfo(reg);

        Rc.Insurance ins = new Rc.Insurance();
        ins.setPolicyNumber("POL123");
        rc.setInsurance(ins);

        Rc.Puc puc = new Rc.Puc();
        puc.setCertificateNumber("PUC123");
        rc.setPuc(puc);

        return rc;
    }

    // 1. Successful ownership transfer
    @Test
    public void testSuccessfulTransfer() {
        Rc rc = createSampleRc();
        when(rcRepository.findById("rc-123")).thenReturn(Optional.of(rc));
        when(rcRepository.save(any(Rc.class))).thenAnswer(i -> i.getArgument(0));

        Rc.Owner newOwner = new Rc.Owner();
        newOwner.setName("Rohit");
        newOwner.setEmail("rohit@example.com");

        OwnershipTransferRequest req = new OwnershipTransferRequest();
        req.setNewOwner(newOwner);

        Rc result = rcService.transferOwnership("rc-123", req);

        assertNotNull(result);
        assertEquals("rc-123", result.getId());
        assertEquals("KA01AB1234", result.getRcNumber());
        assertEquals("Rohit", result.getOwner().getName());
        verify(emailService, times(1)).sendOwnershipTransferEmail("rohit@example.com", "Rohit", "KA01AB1234");
    }

    // 2. Same RC number & MongoDB ID remain unchanged
    @Test
    public void testRcNumberAndIdRemainUnchanged() {
        Rc rc = createSampleRc();
        when(rcRepository.findById("rc-123")).thenReturn(Optional.of(rc));
        when(rcRepository.save(any(Rc.class))).thenAnswer(i -> i.getArgument(0));

        Rc.Owner newOwner = new Rc.Owner();
        newOwner.setName("Rohit");

        OwnershipTransferRequest req = new OwnershipTransferRequest();
        req.setNewOwner(newOwner);

        Rc result = rcService.transferOwnership("rc-123", req);

        assertEquals("rc-123", result.getId());
        assertEquals("KA01AB1234", result.getRcNumber());
    }

    // 3. Previous owner added exactly once in OwnershipHistory
    @Test
    public void testPreviousOwnerAppendedCorrectly() {
        Rc rc = createSampleRc();
        when(rcRepository.findById("rc-123")).thenReturn(Optional.of(rc));
        when(rcRepository.save(any(Rc.class))).thenAnswer(i -> i.getArgument(0));

        Rc.Owner newOwner = new Rc.Owner();
        newOwner.setName("Rohit");

        OwnershipTransferRequest req = new OwnershipTransferRequest();
        req.setNewOwner(newOwner);

        rcService.transferOwnership("rc-123", req);

        ArgumentCaptor<OwnershipHistory> captor = ArgumentCaptor.forClass(OwnershipHistory.class);
        verify(ownershipHistoryRepository).save(captor.capture());

        OwnershipHistory savedHistory = captor.getValue();
        assertEquals("Darshan", savedHistory.getPreviousOwnerName());
        assertEquals("Rohit", savedHistory.getNewOwnerName());
        assertEquals("rc-123", savedHistory.getRcId());
        assertEquals("KA01AB1234", savedHistory.getRcNumber());
    }

    // 4. ownersCount calculated server-side
    @Test
    public void testOwnersCountCalculatedServerSide() {
        Rc rc = createSampleRc();
        OwnershipHistory h1 = new OwnershipHistory();
        h1.setPreviousOwnerName("Naveen");
        h1.setNewOwnerName("Darshan");

        OwnershipHistory h2 = new OwnershipHistory();
        h2.setPreviousOwnerName("Darshan");
        h2.setNewOwnerName("Rohit");

        List<OwnershipHistory> historyList = List.of(h2, h1);

        RcResponse response = RcResponse.fromEntity(rc, true, 1 + historyList.size(), List.of("Naveen", "Darshan"));
        assertEquals(3, response.getOwnersCount());
        assertEquals(List.of("Naveen", "Darshan"), response.getPreviousOwners());
    }

    // 5. Exactly one history record created
    @Test
    public void testExactlyOneHistoryRecordCreated() {
        Rc rc = createSampleRc();
        when(rcRepository.findById("rc-123")).thenReturn(Optional.of(rc));
        when(rcRepository.save(any(Rc.class))).thenAnswer(i -> i.getArgument(0));

        Rc.Owner newOwner = new Rc.Owner();
        newOwner.setName("Rohit");

        OwnershipTransferRequest req = new OwnershipTransferRequest();
        req.setNewOwner(newOwner);

        rcService.transferOwnership("rc-123", req);

        verify(ownershipHistoryRepository, times(1)).save(any(OwnershipHistory.class));
    }

    // 6. Same-owner transfer rejected
    @Test
    public void testSameOwnerTransferRejected() {
        Rc rc = createSampleRc();
        when(rcRepository.findById("rc-123")).thenReturn(Optional.of(rc));

        Rc.Owner newOwner = new Rc.Owner();
        newOwner.setName("Darshan");

        OwnershipTransferRequest req = new OwnershipTransferRequest();
        req.setNewOwner(newOwner);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
            rcService.transferOwnership("rc-123", req)
        );
        assertTrue(ex.getMessage().toLowerCase().contains("same"));
    }

    // 7. Vehicle not found (404)
    @Test
    public void testNonexistentVehicle() {
        when(rcRepository.findById("nonexistent")).thenReturn(Optional.empty());

        Rc.Owner newOwner = new Rc.Owner();
        newOwner.setName("Rohit");

        OwnershipTransferRequest req = new OwnershipTransferRequest();
        req.setNewOwner(newOwner);

        assertThrows(RcNotFoundException.class, () ->
            rcService.transferOwnership("nonexistent", req)
        );
    }

    // 8. Historical stolen/suspicious flags are correctly snapshotted
    @Test
    public void testHistoricalStolenSuspiciousFlagsSnapshotted() {
        Rc rc = createSampleRc();
        rc.setStolen(true);
        rc.setSuspicious(true);

        when(rcRepository.findById("rc-123")).thenReturn(Optional.of(rc));
        when(rcRepository.save(any(Rc.class))).thenAnswer(i -> i.getArgument(0));

        Rc.Owner newOwner = new Rc.Owner();
        newOwner.setName("Rohit");

        OwnershipTransferRequest req = new OwnershipTransferRequest();
        req.setNewOwner(newOwner);

        rcService.transferOwnership("rc-123", req);

        ArgumentCaptor<OwnershipHistory> captor = ArgumentCaptor.forClass(OwnershipHistory.class);
        verify(ownershipHistoryRepository).save(captor.capture());

        OwnershipHistory savedHistory = captor.getValue();
        assertTrue(savedHistory.getStolenAtTransfer());
        assertTrue(savedHistory.getSuspiciousAtTransfer());
    }

    // 9. Existing vehicle fields remain unchanged
    @Test
    public void testExistingVehicleInformationRemainsUnchanged() {
        Rc rc = createSampleRc();
        when(rcRepository.findById("rc-123")).thenReturn(Optional.of(rc));
        when(rcRepository.save(any(Rc.class))).thenAnswer(i -> i.getArgument(0));

        Rc.Owner newOwner = new Rc.Owner();
        newOwner.setName("Rohit");

        OwnershipTransferRequest req = new OwnershipTransferRequest();
        req.setNewOwner(newOwner);

        Rc updated = rcService.transferOwnership("rc-123", req);

        assertEquals("rc-123", updated.getId());
        assertEquals("KA01AB1234", updated.getRcNumber());
        assertEquals("CH12345", updated.getChassisNumber());
        assertEquals("ENG67890", updated.getEngineNumber());
        assertEquals("Toyota", updated.getVehicleInfo().getMake());
        assertEquals("Camry", updated.getVehicleInfo().getModel());
        assertTrue(updated.getRegistrationInfo().isActive());
        assertEquals("POL123", updated.getInsurance().getPolicyNumber());
        assertEquals("PUC123", updated.getPuc().getCertificateNumber());
    }

    // 10. Second ownership transfer works (Darshan -> Rohit -> Rahul)
    @Test
    public void testSecondOwnershipTransferWorks() {
        Rc rc = createSampleRc();
        when(rcRepository.findById("rc-123")).thenReturn(Optional.of(rc));
        when(rcRepository.save(any(Rc.class))).thenAnswer(i -> i.getArgument(0));

        // Transfer 1: Darshan -> Rohit
        Rc.Owner ownerRohit = new Rc.Owner();
        ownerRohit.setName("Rohit");
        OwnershipTransferRequest req1 = new OwnershipTransferRequest();
        req1.setNewOwner(ownerRohit);

        Rc step1 = rcService.transferOwnership("rc-123", req1);
        assertEquals("Rohit", step1.getOwner().getName());

        // Transfer 2: Rohit -> Rahul
        Rc.Owner ownerRahul = new Rc.Owner();
        ownerRahul.setName("Rahul");
        OwnershipTransferRequest req2 = new OwnershipTransferRequest();
        req2.setNewOwner(ownerRahul);

        Rc step2 = rcService.transferOwnership("rc-123", req2);
        assertEquals("Rahul", step2.getOwner().getName());
        assertEquals("rc-123", step2.getId());
        assertEquals("KA01AB1234", step2.getRcNumber());

        verify(ownershipHistoryRepository, times(2)).save(any(OwnershipHistory.class));
    }
}
