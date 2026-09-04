package com.oneclass.app.features.whiteboard.drawing;

import com.oneclass.app.common.model.User;
import com.oneclass.app.features.whiteboard.drawing.model.DrawingElement;
import com.oneclass.app.features.whiteboard.drawing.service.WhiteboardService;
import com.oneclass.app.features.whiteboard.room.model.Role;
import com.oneclass.app.features.whiteboard.room.model.Room;
import com.oneclass.app.features.whiteboard.room.service.RoomService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class WhiteboardServiceTest {

    private RoomService roomService;
    private WhiteboardService whiteboardService;

    @BeforeEach
    void setUp() {
        roomService = Mockito.mock(RoomService.class);
        whiteboardService = new WhiteboardService(roomService);
    }

    @Test
    void testAddElement_Success() {
        String roomCode = "ROOM01";
        String userId = "user-1";
        Room room = new Room(roomCode, userId);
        room.addUser(new User(userId, "Alice", Role.HOST, "#ef4444"));

        when(roomService.getAuthorizedEditorRoom(roomCode, userId)).thenReturn(Optional.of(room));

        DrawingElement element = new DrawingElement();
        element.setId("elem-1");
        element.setType("brush");

        boolean result = whiteboardService.addElement(roomCode, userId, element);

        assertTrue(result);
        assertEquals(1, room.getElements().size());
        assertEquals("user-1", element.getUserId());
        assertTrue(element.getTimestamp() > 0);
    }

    @Test
    void testAddElement_PermissionDenied() {
        String roomCode = "ROOM02";
        String userId = "user-2";

        when(roomService.getAuthorizedEditorRoom(roomCode, userId)).thenReturn(Optional.empty());

        DrawingElement element = new DrawingElement();
        boolean result = whiteboardService.addElement(roomCode, userId, element);

        assertFalse(result);
    }

    @Test
    void testDeleteElement_Success() {
        String roomCode = "ROOM03";
        String userId = "user-1";
        Room room = new Room(roomCode, userId);
        DrawingElement element = new DrawingElement();
        element.setId("elem-delete-1");
        room.addElement(element);

        when(roomService.getAuthorizedEditorRoom(roomCode, userId)).thenReturn(Optional.of(room));

        boolean result = whiteboardService.deleteElement(roomCode, userId, "elem-delete-1");

        assertTrue(result);
        assertTrue(room.getElements().isEmpty());
    }

    @Test
    void testDeleteElement_Unauthorized() {
        String roomCode = "ROOM04";
        String userId = "user-3";

        when(roomService.getAuthorizedEditorRoom(roomCode, userId)).thenReturn(Optional.empty());

        boolean result = whiteboardService.deleteElement(roomCode, userId, "elem-1");
        assertFalse(result);
    }

    @Test
    void testClearCanvas_Success() {
        String roomCode = "ROOM05";
        String userId = "user-1";
        Room room = new Room(roomCode, userId);
        DrawingElement elem1 = new DrawingElement();
        elem1.setId("e1");
        room.addElement(elem1);

        when(roomService.getAuthorizedEditorRoom(roomCode, userId)).thenReturn(Optional.of(room));

        boolean result = whiteboardService.clearCanvas(roomCode, userId);

        assertTrue(result);
        assertTrue(room.getElements().isEmpty());
    }

    @Test
    void testClearCanvas_Unauthorized() {
        String roomCode = "ROOM06";
        String userId = "user-4";

        when(roomService.getAuthorizedEditorRoom(roomCode, userId)).thenReturn(Optional.empty());

        boolean result = whiteboardService.clearCanvas(roomCode, userId);
        assertFalse(result);
    }
}

