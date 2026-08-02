package com.oneclass.app.features.whiteboard.room.controller;

import com.oneclass.app.features.whiteboard.room.model.Room;
import com.oneclass.app.features.whiteboard.room.dto.RoleUpdateRequest;
import com.oneclass.app.features.whiteboard.room.service.RoomService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.ArrayList;
import java.util.Map;

@Controller
public class RoomWebSocketController {

    private final RoomService roomService;
    private final SimpMessagingTemplate messagingTemplate;

    public RoomWebSocketController(RoomService roomService, SimpMessagingTemplate messagingTemplate) {
        this.roomService = roomService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/room.user-joined")
    public void handleUserJoined(@Payload Map<String, String> payload) {
        String roomCode = payload.get("roomCode");
        if (roomCode != null) {
            roomService.getRoomByCode(roomCode).ifPresent(room -> {
                messagingTemplate.convertAndSend(
                        "/topic/room/" + roomCode.toUpperCase() + "/users",
                        new ArrayList<>(room.getUsers().values())
                );
            });
        }
    }

    @MessageMapping("/room.role-change")
    public void handleRoleChange(@Payload RoleUpdateRequest request) {
        try {
            Room room = roomService.updateRole(request);
            messagingTemplate.convertAndSend(
                    "/topic/room/" + request.getRoomCode().toUpperCase() + "/users",
                    new ArrayList<>(room.getUsers().values())
            );
        } catch (Exception e) {
            // Log error
        }
    }
}
