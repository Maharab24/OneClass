package com.oneclass.app.features.whiteboard.room.controller;

import com.oneclass.app.features.auth.model.User;
import com.oneclass.app.features.auth.repository.UserRepository;
import com.oneclass.app.features.whiteboard.room.dto.CreateRoomRequest;
import com.oneclass.app.features.whiteboard.room.dto.JoinRoomRequest;
import com.oneclass.app.features.whiteboard.room.dto.RoomResponse;
import com.oneclass.app.features.whiteboard.room.service.RoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "*")
public class RoomRestController {

    private final RoomService roomService;
    private final UserRepository userRepository;

    public RoomRestController(RoomService roomService, UserRepository userRepository) {
        this.roomService = roomService;
        this.userRepository = userRepository;
    }

    @PostMapping("/create")
    public ResponseEntity<RoomResponse> createRoom(
            @RequestBody(required = false) CreateRoomRequest request,
            Authentication authentication
    ) {
        String hostName = null;
        if (authentication != null && authentication.isAuthenticated()) {
            hostName = userRepository.findByEmail(authentication.getName())
                    .map(User::getFullName)
                    .orElse(null);
        }

        if ((hostName == null || hostName.trim().isEmpty()) && request != null) {
            hostName = request.getHostName();
        }

        if (hostName == null || hostName.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        CreateRoomRequest finalRequest = new CreateRoomRequest(hostName.trim());
        RoomResponse response = roomService.createRoom(finalRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinRoom(
            @RequestBody JoinRoomRequest request,
            Authentication authentication
    ) {
        try {
            if (request == null || request.getRoomCode() == null || request.getRoomCode().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Room code is required.");
            }

            String userName = null;
            if (authentication != null && authentication.isAuthenticated()) {
                userName = userRepository.findByEmail(authentication.getName())
                        .map(User::getFullName)
                        .orElse(null);
            }

            if ((userName == null || userName.trim().isEmpty()) && request.getUserName() != null) {
                userName = request.getUserName();
            }

            if (userName == null || userName.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("User name is required.");
            }

            request.setRoomCode(request.getRoomCode().trim().toUpperCase());
            request.setUserName(userName.trim());
            RoomResponse response = roomService.joinRoom(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{roomCode}")
    public ResponseEntity<?> getRoom(@PathVariable String roomCode) {
        return roomService.getRoomByCode(roomCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
