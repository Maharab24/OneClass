package com.oneclass.app.features.whiteboard.drawing.service;

import com.oneclass.app.common.model.User;
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
        Optional<Room> optionalRoom = roomService.getRoomByCode(roomCode);
        if (optionalRoom.isEmpty()) return false;

        Room room = optionalRoom.get();
        User user = room.getUsers().get(userId);

        if (user == null || !user.getRole().canEdit()) {
            return false;
        }

        element.setUserId(userId);
        element.setTimestamp(System.currentTimeMillis());
        room.addElement(element);
        return true;
    }

    public boolean deleteElement(String roomCode, String userId, String elementId) {
        Optional<Room> optionalRoom = roomService.getRoomByCode(roomCode);
        if (optionalRoom.isEmpty()) return false;

        Room room = optionalRoom.get();
        User user = room.getUsers().get(userId);

        if (user == null || !user.getRole().canEdit()) {
            return false;
        }

        return room.getElements().removeIf(e -> e.getId().equals(elementId));
    }

    public boolean clearCanvas(String roomCode, String userId) {
        Optional<Room> optionalRoom = roomService.getRoomByCode(roomCode);
        if (optionalRoom.isEmpty()) return false;

        Room room = optionalRoom.get();
        User user = room.getUsers().get(userId);

        if (user == null || !user.getRole().canEdit()) {
            return false;
        }

        room.clearElements();
        return true;
    }
}
