package com.oneclass.app.features.whiteboard.room;

import com.oneclass.app.common.model.User;
import com.oneclass.app.features.whiteboard.room.dto.CreateRoomRequest;
import com.oneclass.app.features.whiteboard.room.dto.JoinRoomRequest;
import com.oneclass.app.features.whiteboard.room.dto.RoleUpdateRequest;
import com.oneclass.app.features.whiteboard.room.dto.RoomResponse;
import com.oneclass.app.features.whiteboard.room.model.Role;
import com.oneclass.app.features.whiteboard.room.model.Room;
import com.oneclass.app.features.whiteboard.room.repository.RoomRepository;
import com.oneclass.app.features.whiteboard.room.service.RoomService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class RoomServiceTest {

    private RoomRepository roomRepository;
    private RoomService roomService;

    @BeforeEach
    void setUp() {
        roomRepository = new RoomRepository();
        roomService = new RoomService(roomRepository);
    }

    @Test
    void testCreateRoom() {
        CreateRoomRequest request = new CreateRoomRequest("HostUser");
        RoomResponse response = roomService.createRoom(request);

        assertNotNull(response);
        assertNotNull(response.getRoomCode());
        assertEquals("HostUser", response.getCurrentUser().getName());
        assertEquals(Role.HOST, response.getCurrentUser().getRole());
        assertEquals(1, response.getParticipants().size());
        assertTrue(roomRepository.existsByRoomCode(response.getRoomCode()));
    }

    @Test
    void testJoinRoom_Success() {
        RoomResponse created = roomService.createRoom(new CreateRoomRequest("HostUser"));

        JoinRoomRequest joinReq = new JoinRoomRequest();
        joinReq.setRoomCode(created.getRoomCode());
        joinReq.setUserName("Student1");
        joinReq.setRequestedRole(Role.CAN_WATCH);

        RoomResponse joined = roomService.joinRoom(joinReq);

        assertNotNull(joined);
        assertEquals("Student1", joined.getCurrentUser().getName());
        assertEquals(Role.CAN_WATCH, joined.getCurrentUser().getRole());
        assertEquals(2, joined.getParticipants().size());
    }

    @Test
    void testJoinRoom_NotFound() {
        JoinRoomRequest joinReq = new JoinRoomRequest();
        joinReq.setRoomCode("NONEXISTENT");
        joinReq.setUserName("Student1");

        assertThrows(IllegalArgumentException.class, () -> roomService.joinRoom(joinReq));
    }

    @Test
    void testUpdateRole_Success() {
        RoomResponse created = roomService.createRoom(new CreateRoomRequest("HostUser"));
        String hostId = created.getHostUserId();

        JoinRoomRequest joinReq = new JoinRoomRequest();
        joinReq.setRoomCode(created.getRoomCode());
        joinReq.setUserName("Student1");
        joinReq.setRequestedRole(Role.CAN_WATCH);
        RoomResponse joined = roomService.joinRoom(joinReq);
        String studentId = joined.getCurrentUser().getId();

        RoleUpdateRequest updateReq = new RoleUpdateRequest();
        updateReq.setRoomCode(created.getRoomCode());
        updateReq.setRequesterUserId(hostId);
        updateReq.setTargetUserId(studentId);
        updateReq.setNewRole(Role.CAN_EDIT);

        Room updatedRoom = roomService.updateRole(updateReq);
        assertEquals(Role.CAN_EDIT, updatedRoom.getUsers().get(studentId).getRole());
    }

    @Test
    void testUpdateRole_UnauthorizedRequester() {
        RoomResponse created = roomService.createRoom(new CreateRoomRequest("HostUser"));

        JoinRoomRequest joinReq = new JoinRoomRequest();
        joinReq.setRoomCode(created.getRoomCode());
        joinReq.setUserName("Student1");
        RoomResponse joined = roomService.joinRoom(joinReq);
        String studentId = joined.getCurrentUser().getId();

        RoleUpdateRequest updateReq = new RoleUpdateRequest();
        updateReq.setRoomCode(created.getRoomCode());
        updateReq.setRequesterUserId(studentId); // Not host
        updateReq.setTargetUserId(studentId);
        updateReq.setNewRole(Role.CAN_EDIT);

        assertThrows(IllegalStateException.class, () -> roomService.updateRole(updateReq));
    }

    @Test
    void testCanUserEdit_Permissions() {
        RoomResponse created = roomService.createRoom(new CreateRoomRequest("HostUser"));
        String hostId = created.getHostUserId();
        String roomCode = created.getRoomCode();

        JoinRoomRequest joinReq = new JoinRoomRequest();
        joinReq.setRoomCode(roomCode);
        joinReq.setUserName("Watcher");
        joinReq.setRequestedRole(Role.CAN_WATCH);
        RoomResponse joined = roomService.joinRoom(joinReq);
        String watcherId = joined.getCurrentUser().getId();

        assertTrue(roomService.canUserEdit(roomCode, hostId));
        assertFalse(roomService.canUserEdit(roomCode, watcherId));
        assertFalse(roomService.canUserEdit(roomCode, "unknown-user"));
        assertFalse(roomService.canUserEdit("INVALID_CODE", hostId));
    }

    @Test
    void testSessionTracking() {
        String sessionId = "sess-123";
        String roomCode = "ABC123";
        String userId = "user-1";

        roomService.registerSession(sessionId, roomCode, userId);

        Optional<RoomService.UserSession> session = roomService.getSession(sessionId);
        assertTrue(session.isPresent());
        assertEquals("ABC123", session.get().roomCode());
        assertEquals(userId, session.get().userId());

        Optional<RoomService.UserSession> unregistered = roomService.unregisterSession(sessionId);
        assertTrue(unregistered.isPresent());
        assertTrue(roomService.getSession(sessionId).isEmpty());
    }

    @Test
    void testRemoveUserFromRoom_SetsEmptySinceWhenEmpty() {
        RoomResponse created = roomService.createRoom(new CreateRoomRequest("HostUser"));
        String hostId = created.getHostUserId();
        String roomCode = created.getRoomCode();

        Room room = roomRepository.findByRoomCode(roomCode).orElseThrow();
        assertNull(room.getEmptySince());

        Optional<User> removed = roomService.removeUserFromRoom(roomCode, hostId);
        assertTrue(removed.isPresent());
        assertEquals("HostUser", removed.get().getName());
        assertTrue(room.getUsers().isEmpty());
        assertNotNull(room.getEmptySince());
    }

    @Test
    void testCleanupInactiveRooms_ClosesAfter2Minutes() {
        Room room = new Room("EMPTY1", "host-1");
        room.setEmptySince(System.currentTimeMillis() - 130_000); // Empty for 130 seconds (> 120s)
        roomRepository.save(room);

        Room activeRoom = new Room("ACTIVE", "host-2");
        activeRoom.addUser(new User("host-2", "Host", Role.HOST, "#ef4444"));
        roomRepository.save(activeRoom);

        Room recentlyEmptyRoom = new Room("EMPTY2", "host-3");
        recentlyEmptyRoom.setEmptySince(System.currentTimeMillis() - 30_000); // Empty for 30s (< 120s)
        roomRepository.save(recentlyEmptyRoom);

        roomService.cleanupInactiveRooms();

        assertFalse(roomRepository.existsByRoomCode("EMPTY1"), "Room empty > 2 mins must be deleted");
        assertTrue(roomRepository.existsByRoomCode("ACTIVE"), "Active room must remain");
        assertTrue(roomRepository.existsByRoomCode("EMPTY2"), "Room empty < 2 mins must remain");
    }
}

