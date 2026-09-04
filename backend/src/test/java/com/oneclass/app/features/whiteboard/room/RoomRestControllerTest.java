package com.oneclass.app.features.whiteboard.room;

import com.oneclass.app.features.whiteboard.room.controller.RoomRestController;
import com.oneclass.app.features.whiteboard.room.dto.CreateRoomRequest;
import com.oneclass.app.features.whiteboard.room.dto.JoinRoomRequest;
import com.oneclass.app.features.whiteboard.room.dto.RoomResponse;
import com.oneclass.app.features.whiteboard.room.model.Role;
import com.oneclass.app.features.whiteboard.room.model.Room;
import com.oneclass.app.features.whiteboard.room.service.RoomService;
import com.oneclass.app.features.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RoomRestControllerTest {

    private RoomService roomService;
    private UserRepository userRepository;
    private RoomRestController controller;

    @BeforeEach
    void setUp() {
        roomService = mock(RoomService.class);
        userRepository = mock(UserRepository.class);
        controller = new RoomRestController(roomService, userRepository);
    }

    @Test
    void testCreateRoom_Authenticated_UsesDbFullName() {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("teacher@oneclass.com");

        com.oneclass.app.features.auth.model.User authUser = new com.oneclass.app.features.auth.model.User();
        authUser.setEmail("teacher@oneclass.com");
        authUser.setFullName("Prof. Einstein");
        when(userRepository.findByEmail("teacher@oneclass.com")).thenReturn(Optional.of(authUser));

        com.oneclass.app.common.model.User roomUser = new com.oneclass.app.common.model.User("u1", "Prof. Einstein", Role.HOST, "#ff0000");
        RoomResponse expectedResponse = new RoomResponse("ROOM12", "u1", roomUser, List.of(roomUser), Collections.emptyList(), Collections.emptyList());
        when(roomService.createRoom(any(CreateRoomRequest.class))).thenReturn(expectedResponse);

        ResponseEntity<RoomResponse> result = controller.createRoom(null, auth);

        assertNotNull(result);
        assertEquals(200, result.getStatusCode().value());
        assertEquals("Prof. Einstein", result.getBody().getCurrentUser().getName());
        verify(roomService).createRoom(argThat(req -> "Prof. Einstein".equals(req.getHostName())));
    }

    @Test
    void testJoinRoom_Authenticated_UsesDbFullName() {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("student@oneclass.com");

        com.oneclass.app.features.auth.model.User authUser = new com.oneclass.app.features.auth.model.User();
        authUser.setEmail("student@oneclass.com");
        authUser.setFullName("Jane Doe");
        when(userRepository.findByEmail("student@oneclass.com")).thenReturn(Optional.of(authUser));

        JoinRoomRequest req = new JoinRoomRequest();
        req.setRoomCode("ROOM12");
        req.setUserName("IgnoredName");

        com.oneclass.app.common.model.User roomUser = new com.oneclass.app.common.model.User("u2", "Jane Doe", Role.CAN_WATCH, "#00ff00");
        RoomResponse expectedResponse = new RoomResponse("ROOM12", "u1", roomUser, List.of(roomUser), Collections.emptyList(), Collections.emptyList());
        when(roomService.joinRoom(any(JoinRoomRequest.class))).thenReturn(expectedResponse);

        ResponseEntity<?> result = controller.joinRoom(req, auth);

        assertNotNull(result);
        assertEquals(200, result.getStatusCode().value());
        verify(roomService).joinRoom(argThat(r -> "Jane Doe".equals(r.getUserName()) && "ROOM12".equals(r.getRoomCode())));
    }

    @Test
    void testJoinRoom_MissingRoomCode_ReturnsBadRequest() {
        JoinRoomRequest req = new JoinRoomRequest();
        req.setRoomCode("");

        ResponseEntity<?> result = controller.joinRoom(req, null);

        assertNotNull(result);
        assertEquals(400, result.getStatusCode().value());
        assertEquals("Room code is required.", result.getBody());
    }

    @Test
    void testGetRoom_Found() {
        Room room = new Room("ABCDEF", "hostId");
        when(roomService.getRoomByCode("ABCDEF")).thenReturn(Optional.of(room));

        ResponseEntity<?> result = controller.getRoom("ABCDEF");

        assertNotNull(result);
        assertEquals(200, result.getStatusCode().value());
    }
}

