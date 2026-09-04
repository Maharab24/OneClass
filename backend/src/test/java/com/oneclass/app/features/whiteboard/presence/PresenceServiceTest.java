package com.oneclass.app.features.whiteboard.presence;

import com.oneclass.app.features.whiteboard.presence.dto.CursorPositionDto;
import com.oneclass.app.features.whiteboard.presence.service.PresenceService;
import com.oneclass.app.features.whiteboard.room.service.RoomService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class PresenceServiceTest {

    private RoomService roomService;
    private PresenceService presenceService;

    @BeforeEach
    void setUp() {
        roomService = Mockito.mock(RoomService.class);
        presenceService = new PresenceService(roomService);
    }

    @Test
    void testValidateCursorBroadcast_Success() {
        String roomCode = "ROOM01";
        String userId = "user-1";
        CursorPositionDto dto = new CursorPositionDto();
        dto.setRoomCode(roomCode);
        dto.setUserId(userId);

        when(roomService.canUserEdit(roomCode, userId)).thenReturn(true);

        assertTrue(presenceService.validateCursorBroadcast(dto));
    }

    @Test
    void testValidateCursorBroadcast_Unauthorized() {
        String roomCode = "ROOM02";
        String userId = "watcher-1";
        CursorPositionDto dto = new CursorPositionDto();
        dto.setRoomCode(roomCode);
        dto.setUserId(userId);

        when(roomService.canUserEdit(roomCode, userId)).thenReturn(false);

        assertFalse(presenceService.validateCursorBroadcast(dto));
    }

    @Test
    void testValidateCursorBroadcast_NullInputs() {
        assertFalse(presenceService.validateCursorBroadcast(null));

        CursorPositionDto dto = new CursorPositionDto();
        assertFalse(presenceService.validateCursorBroadcast(dto));
    }
}

