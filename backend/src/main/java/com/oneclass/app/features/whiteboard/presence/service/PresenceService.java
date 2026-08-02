package com.oneclass.app.features.whiteboard.presence.service;

import com.oneclass.app.common.model.User;
import com.oneclass.app.features.whiteboard.room.model.Room;
import com.oneclass.app.features.whiteboard.presence.dto.CursorPositionDto;
import com.oneclass.app.features.whiteboard.room.service.RoomService;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class PresenceService {

    private final RoomService roomService;

    public PresenceService(RoomService roomService) {
        this.roomService = roomService;
    }

    public boolean validateCursorBroadcast(CursorPositionDto dto) {
        if (dto.getRoomCode() == null || dto.getUserId() == null) {
            return false;
        }

        Optional<Room> optionalRoom = roomService.getRoomByCode(dto.getRoomCode());
        if (optionalRoom.isEmpty()) return false;

        User user = optionalRoom.get().getUsers().get(dto.getUserId());
        return user != null && user.getRole().canEdit();
    }
}
