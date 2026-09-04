package com.oneclass.app.features.whiteboard.room.controller;

import com.oneclass.app.common.model.User;
import com.oneclass.app.features.whiteboard.chat.model.ChatMessage;
import com.oneclass.app.features.whiteboard.chat.service.ChatService;
import com.oneclass.app.features.whiteboard.room.dto.RoleUpdateRequest;
import com.oneclass.app.features.whiteboard.room.model.Role;
import com.oneclass.app.features.whiteboard.room.model.Room;
import com.oneclass.app.features.whiteboard.room.service.RoomService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class RoomWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(RoomWebSocketController.class);

    private final RoomService roomService;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public RoomWebSocketController(RoomService roomService, ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.roomService = roomService;
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/room.user-joined")
    public void handleUserJoined(@Payload Map<String, String> payload, SimpMessageHeaderAccessor headerAccessor) {
        String roomCode = payload.get("roomCode");
        String userId = payload.get("userId");
        String userName = payload.get("userName");

        if (headerAccessor != null && headerAccessor.getSessionId() != null && roomCode != null && userId != null) {
            roomService.registerSession(headerAccessor.getSessionId(), roomCode, userId);
        }

        if (roomCode != null) {
            roomService.getRoomByCode(roomCode.toUpperCase()).ifPresent(room -> {
                messagingTemplate.convertAndSend(
                        "/topic/room/" + roomCode.toUpperCase() + "/users",
                        room.getUsers().values()
                );

                if (userName != null && !userName.trim().isEmpty()) {
                    ChatMessage systemMsg = chatService.createAndAddSystemMessage(
                            roomCode,
                            userName.trim() + " joined the room."
                    );
                    messagingTemplate.convertAndSend(
                            "/topic/room/" + roomCode.toUpperCase() + "/chat",
                            systemMsg
                    );
                }
            });
        }
    }

    @MessageMapping("/room.role-change")
    public void handleRoleChange(@Payload RoleUpdateRequest request) {
        try {
            Room room = roomService.updateRole(request);
            messagingTemplate.convertAndSend(
                    "/topic/room/" + request.getRoomCode().toUpperCase() + "/users",
                    room.getUsers().values()
            );

            User targetUser = room.getUsers().get(request.getTargetUserId());
            if (targetUser != null) {
                String roleText = targetUser.getRole() == Role.CAN_EDIT ? "an Editor" : "a Watcher";
                String systemText = targetUser.getName() + " is now " + roleText + ".";
                ChatMessage systemMsg = chatService.createAndAddSystemMessage(request.getRoomCode(), systemText);
                messagingTemplate.convertAndSend(
                        "/topic/room/" + request.getRoomCode().toUpperCase() + "/chat",
                        systemMsg
                );
            }
        } catch (Exception e) {
            log.warn("Failed to update role for room {}: {}", request.getRoomCode(), e.getMessage());
        }
    }
}
