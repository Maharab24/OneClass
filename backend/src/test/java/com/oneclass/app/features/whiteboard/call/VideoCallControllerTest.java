package com.oneclass.app.features.whiteboard.call;

import com.oneclass.app.features.auth.model.User;
import com.oneclass.app.features.auth.repository.UserRepository;
import com.oneclass.app.features.whiteboard.call.controller.VideoCallController;
import com.oneclass.app.features.whiteboard.call.dto.LiveKitVideoCallJoinResponse;
import com.oneclass.app.features.whiteboard.call.service.LiveKitService;
import com.oneclass.app.features.whiteboard.room.model.Room;
import com.oneclass.app.features.whiteboard.room.service.RoomService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class VideoCallControllerTest {

    private RoomService roomService;
    private UserRepository userRepository;
    private LiveKitService liveKitService;
    private VideoCallController controller;

    @BeforeEach
    void setUp() {
        roomService = mock(RoomService.class);
        userRepository = mock(UserRepository.class);
        liveKitService = mock(LiveKitService.class);
        controller = new VideoCallController(roomService, userRepository, liveKitService);
    }

    @Test
    void testJoinVideoCall_AsHost_ReturnsSuccessWithPublishPermission() {
        String roomCode = "ROOM12";
        Room room = new Room(roomCode, "host-id");
        when(roomService.getRoomByCode(roomCode)).thenReturn(Optional.of(room));

        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("teacher@oneclass.com");

        User user = new User();
        user.setEmail("teacher@oneclass.com");
        user.setFullName("Prof. Teacher");
        when(userRepository.findByEmail("teacher@oneclass.com")).thenReturn(Optional.of(user));

        when(roomService.isHost(roomCode, "teacher@oneclass.com", "Prof. Teacher")).thenReturn(true);

        LiveKitVideoCallJoinResponse expected = new LiveKitVideoCallJoinResponse(
                "ws://localhost:7880", "mock-token", Instant.now().plusSeconds(3600), "Prof. Teacher", true);
        when(liveKitService.createVideoJoinDetails(roomCode, user, true)).thenReturn(expected);

        ResponseEntity<LiveKitVideoCallJoinResponse> response = controller.joinVideoCall(roomCode, auth);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isHost());
        assertEquals("Prof. Teacher", response.getBody().userName());
    }

    @Test
    void testJoinVideoCall_AsStudent_ReturnsSuccessWithSubscriberPermission() {
        String roomCode = "ROOM12";
        Room room = new Room(roomCode, "host-id");
        when(roomService.getRoomByCode(roomCode)).thenReturn(Optional.of(room));

        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("student@oneclass.com");

        User user = new User();
        user.setEmail("student@oneclass.com");
        user.setFullName("Student One");
        when(userRepository.findByEmail("student@oneclass.com")).thenReturn(Optional.of(user));

        when(roomService.isHost(roomCode, "student@oneclass.com", "Student One")).thenReturn(false);

        LiveKitVideoCallJoinResponse expected = new LiveKitVideoCallJoinResponse(
                "ws://localhost:7880", "mock-token-viewer", Instant.now().plusSeconds(3600), "Student One", false);
        when(liveKitService.createVideoJoinDetails(roomCode, user, false)).thenReturn(expected);

        ResponseEntity<LiveKitVideoCallJoinResponse> response = controller.joinVideoCall(roomCode, auth);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertFalse(response.getBody().isHost());
    }

    @Test
    void testJoinVideoCall_RoomNotFound_Returns404() {
        String roomCode = "NONEXIST";
        when(roomService.getRoomByCode(roomCode)).thenReturn(Optional.empty());
        when(roomService.getRoomByCode("NONEXIST")).thenReturn(Optional.empty());

        Authentication auth = mock(Authentication.class);

        ResponseEntity<LiveKitVideoCallJoinResponse> response = controller.joinVideoCall(roomCode, auth);

        assertNotNull(response);
        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void testJoinVideoCall_UserNotFound_ThrowsUnauthorized() {
        String roomCode = "ROOM12";
        Room room = new Room(roomCode, "host-id");
        when(roomService.getRoomByCode(roomCode)).thenReturn(Optional.of(room));

        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("unknown@oneclass.com");
        when(userRepository.findByEmail("unknown@oneclass.com")).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> controller.joinVideoCall(roomCode, auth));
    }
}

