package com.SmartVehicle.backend.controller;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.SmartVehicle.backend.exception.UnauthorizedException;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AuthController {

    @Value("${admin.secret-key:${admin.secret.key}}")
    private String adminSecretKey;

    // Simple thread-safe in-memory session token store
    private static final Map<String, Boolean> ACTIVE_SESSIONS = new ConcurrentHashMap<>();

    public static boolean isValidSessionToken(String token) {
        return token != null && ACTIVE_SESSIONS.containsKey(token);
    }

    @PostMapping("/admin")
    public ResponseEntity<Map<String, Object>> loginAdmin(@RequestBody String adminKey) {
        if (adminKey != null && adminKey.equals(adminSecretKey)) {
            String token = "ADM_SESS_" + UUID.randomUUID().toString();
            ACTIVE_SESSIONS.put(token, true);
            return ResponseEntity.ok(Map.of(
                "authenticated", true,
                "token", token,
                "message", "Admin authentication successful"
            ));
        }
        throw new UnauthorizedException();
    }
}
