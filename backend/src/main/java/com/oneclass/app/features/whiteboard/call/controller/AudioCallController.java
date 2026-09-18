package com.oneclass.app.features.whiteboard.call.controller;

import com.oneclass.app.features.auth.model.User;
import com.oneclass.app.features.auth.repository.UserRepository;
import com.oneclass.app.features.whiteboard.call.dto.LiveKitCallJoinResponse;
import com.oneclass.app.features.whiteboard.call.service.LiveKitService;
import com.oneclass.app.features.whiteboard.room.service.RoomService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rooms/{roomCode}/audio-call")
public class AudioCallController {

    private final RoomService roomService;
    private final UserRepository userRepository;
    private final LiveKitService liveKitService;

    public AudioCallController(RoomService roomService, UserRepository userRepository, LiveKitService liveKitService) {
        this.roomService = roomService;
        this.userRepository = userRepository;
        this.liveKitService = liveKitService;
    }

    @PostMapping("/join")
    public ResponseEntity<LiveKitCallJoinResponse> joinAudioCall(
            @PathVariable String roomCode,
            Authentication authentication
    ) {
        if (roomService.getRoomByCode(roomCode).isEmpty() && roomService.getRoomByCode(roomCode.toUpperCase()).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userRepository.findByEmail(authentication.getName())
                .filter(foundUser -> !foundUser.getFullName().isBlank())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Authenticated user was not found."));

        return ResponseEntity.ok(liveKitService.createJoinDetails(roomCode, user));
    }
}
