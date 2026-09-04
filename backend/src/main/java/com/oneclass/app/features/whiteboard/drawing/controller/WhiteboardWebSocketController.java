package com.oneclass.app.features.whiteboard.drawing.controller;

import com.oneclass.app.common.model.User;
import com.oneclass.app.features.whiteboard.chat.model.ChatMessage;
import com.oneclass.app.features.whiteboard.chat.service.ChatService;
import com.oneclass.app.features.whiteboard.drawing.dto.ClearCanvasDto;
import com.oneclass.app.features.whiteboard.drawing.dto.DrawElementDto;
import com.oneclass.app.features.whiteboard.drawing.service.WhiteboardService;
import com.oneclass.app.features.whiteboard.room.service.RoomService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class WhiteboardWebSocketController {

    private final WhiteboardService whiteboardService;
    private final RoomService roomService;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public WhiteboardWebSocketController(WhiteboardService whiteboardService,
                                         RoomService roomService,
                                         ChatService chatService,
                                         SimpMessagingTemplate messagingTemplate) {
        this.whiteboardService = whiteboardService;
        this.roomService = roomService;
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/room.draw")
    public void handleDrawElement(@Payload DrawElementDto dto) {
        if (dto.getRoomCode() == null || dto.getUserId() == null || dto.getElement() == null) {
            return;
        }

        boolean success = whiteboardService.addElement(dto.getRoomCode(), dto.getUserId(), dto.getElement());

        if (success) {
            messagingTemplate.convertAndSend(
                    "/topic/room/" + dto.getRoomCode().toUpperCase() + "/draw",
                    dto
            );
        }
    }

    @MessageMapping("/room.delete-element")
    public void handleDeleteElement(@Payload Map<String, String> payload) {
        String roomCode = payload.get("roomCode");
        String userId = payload.get("userId");
        String elementId = payload.get("elementId");

        if (roomCode == null || userId == null || elementId == null) {
            return;
        }

        boolean success = whiteboardService.deleteElement(roomCode, userId, elementId);

        if (success) {
            messagingTemplate.convertAndSend(
                    "/topic/room/" + roomCode.toUpperCase() + "/delete-element",
                    Map.of("elementId", elementId, "deletedBy", userId)
            );
        }
    }

    @MessageMapping("/room.clear")
    public void handleClearCanvas(@Payload ClearCanvasDto dto) {
        if (dto.getRoomCode() == null || dto.getUserId() == null) {
            return;
        }

        boolean success = whiteboardService.clearCanvas(dto.getRoomCode(), dto.getUserId());

        if (success) {
            messagingTemplate.convertAndSend(
                    "/topic/room/" + dto.getRoomCode().toUpperCase() + "/clear",
                    Map.of("clearedBy", dto.getUserId())
            );

            // Emit System Chat Notification for clear canvas
            roomService.getRoomByCode(dto.getRoomCode().toUpperCase()).ifPresent(room -> {
                User user = room.getUsers().get(dto.getUserId());
                String userName = user != null ? user.getName() : "A participant";
                ChatMessage systemMsg = chatService.createAndAddSystemMessage(
                        dto.getRoomCode(),
                        userName + " cleared the whiteboard."
                );
                messagingTemplate.convertAndSend(
                        "/topic/room/" + dto.getRoomCode().toUpperCase() + "/chat",
                        systemMsg
                );
            });
        }
    }
}
