package com.oneclass.app.features.whiteboard.presence.service;

import com.oneclass.app.features.whiteboard.presence.dto.CursorPositionDto;
import com.oneclass.app.features.whiteboard.room.service.RoomService;
import org.springframework.stereotype.Service;

@Service
public class PresenceService {

    private final RoomService roomService;

    public PresenceService(RoomService roomService) {
        this.roomService = roomService;
    }

    public boolean validateCursorBroadcast(CursorPositionDto dto) {
        if (dto == null || dto.getRoomCode() == null || dto.getUserId() == null) {
            return false;
        }
        return roomService.canUserEdit(dto.getRoomCode(), dto.getUserId());
    }
}
