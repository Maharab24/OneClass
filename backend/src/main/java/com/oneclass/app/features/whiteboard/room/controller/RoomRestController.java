package com.oneclass.app.features.whiteboard.room.controller;

import com.oneclass.app.features.whiteboard.room.dto.CreateRoomRequest;
import com.oneclass.app.features.whiteboard.room.dto.JoinRoomRequest;
import com.oneclass.app.features.whiteboard.room.dto.RoomResponse;
import com.oneclass.app.features.whiteboard.room.service.RoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "*")
public class RoomRestController {

    private final RoomService roomService;

    public RoomRestController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping("/create")
    public ResponseEntity<RoomResponse> createRoom(@RequestBody CreateRoomRequest request) {
        if (request.getHostName() == null || request.getHostName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        RoomResponse response = roomService.createRoom(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinRoom(@RequestBody JoinRoomRequest request) {
        try {
            if (request.getRoomCode() == null || request.getUserName() == null) {
                return ResponseEntity.badRequest().body("Room code and user name are required.");
            }
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
