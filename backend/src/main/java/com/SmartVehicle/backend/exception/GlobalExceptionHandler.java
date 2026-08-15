package com.SmartVehicle.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Object> handleUnauthorized(UnauthorizedException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", ex.getMessage());
        body.put("timestamp", Instant.now());
        body.put("status", 401);
        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(RcNotFoundException.class)
    public ResponseEntity<Object> handleNotFound(RcNotFoundException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", ex.getMessage());
        body.put("timestamp", Instant.now());
        body.put("status", 404);
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(org.springframework.dao.DuplicateKeyException.class)
    public ResponseEntity<Object> handleDuplicateKey(org.springframework.dao.DuplicateKeyException ex) {
        Map<String, Object> body = new HashMap<>();
        String errorMsg = ex.getMessage();
        if (errorMsg != null && (errorMsg.contains("Vehicle with this RC number already exists") || (errorMsg.contains("vehicles") && errorMsg.contains("rcNumber")))) {
            errorMsg = "Vehicle with this RC number already exists";
        } else if (errorMsg == null || errorMsg.isBlank()) {
            errorMsg = "Duplicate key constraint violation";
        }
        body.put("error", errorMsg);
        body.put("timestamp", Instant.now());
        body.put("status", 409);
        return new ResponseEntity<>(body, HttpStatus.CONFLICT);
    }






    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Object> handleBadRequest(IllegalArgumentException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", ex.getMessage());
        body.put("timestamp", Instant.now());
        body.put("status", 400);
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGeneralException(Exception ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "An internal server error occurred");
        body.put("timestamp", Instant.now());
        body.put("status", 500);
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
