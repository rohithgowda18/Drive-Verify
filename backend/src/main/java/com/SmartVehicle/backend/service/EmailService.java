package com.SmartVehicle.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    @Value("${spring.mail.username:}")
    private String fromAddress;

    @Autowired
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendRcCreatedEmail(String to, String name, String rcNumber) {
        if (to == null || to.isBlank()) return; // defensive
        SimpleMailMessage msg = new SimpleMailMessage();
        if (fromAddress != null && !fromAddress.isBlank()) msg.setFrom(fromAddress);
        msg.setTo(to);
        msg.setSubject("RC Registered Successfully");
        msg.setText("""
                Hello %s,

                Your vehicle registration has been successfully added.
                RC Number: %s

                Thank you,
                Drive Verify System
                """.formatted(name, rcNumber));
        mailSender.send(msg);
    }

    @Async
    public void sendOwnershipTransferEmail(String to, String name, String rcNumber) {
        if (to == null || to.isBlank()) return; // defensive
        SimpleMailMessage msg = new SimpleMailMessage();
        if (fromAddress != null && !fromAddress.isBlank()) msg.setFrom(fromAddress);
        msg.setTo(to);
        msg.setSubject("RC Ownership Transfer Complete");
        msg.setText("""
                Hello %s,

                The ownership of the vehicle with RC Number %s
                has been successfully updated under your name.

                Thank you,
                Drive Verify System
                """.formatted(name, rcNumber));
        mailSender.send(msg);
    }
}
