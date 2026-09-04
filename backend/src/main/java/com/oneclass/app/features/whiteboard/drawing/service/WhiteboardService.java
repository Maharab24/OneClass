package com.oneclass.app.features.whiteboard.drawing.service;

import com.oneclass.app.features.whiteboard.drawing.model.DrawingElement;
import com.oneclass.app.features.whiteboard.room.model.Room;
import com.oneclass.app.features.whiteboard.room.service.RoomService;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class WhiteboardService {

    private final RoomService roomService;

    public WhiteboardService(RoomService roomService) {
        this.roomService = roomService;
    }

    public boolean addElement(String roomCode, String userId, DrawingElement element) {
        Optional<Room> optionalRoom = roomService.getAuthorizedEditorRoom(roomCode, userId);
        if (optionalRoom.isEmpty() || element == null) {
            return false;
        }

        Room room = optionalRoom.get();
        element.setUserId(userId);
        element.setTimestamp(System.currentTimeMillis());
        room.addElement(element);
        return true;
    }

    public boolean deleteElement(String roomCode, String userId, String elementId) {
        if (elementId == null) return false;
        return roomService.getAuthorizedEditorRoom(roomCode, userId)
                .map(room -> room.getElements().removeIf(e -> elementId.equals(e.getId())))
                .orElse(false);
    }

    public boolean clearCanvas(String roomCode, String userId) {
        Optional<Room> optionalRoom = roomService.getAuthorizedEditorRoom(roomCode, userId);
        if (optionalRoom.isEmpty()) {
            return false;
        }

        optionalRoom.get().clearElements();
        return true;
    }
}
