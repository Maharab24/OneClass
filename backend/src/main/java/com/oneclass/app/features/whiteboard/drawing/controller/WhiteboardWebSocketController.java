package com.oneclass.app.features.whiteboard.drawing.controller;

import com.oneclass.app.features.whiteboard.drawing.dto.ClearCanvasDto;
import com.oneclass.app.features.whiteboard.drawing.dto.DrawElementDto;
import com.oneclass.app.features.whiteboard.drawing.service.WhiteboardService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;

@Controller
public class WhiteboardWebSocketController {

    private final WhiteboardService whiteboardService;
    private final SimpMessagingTemplate messagingTemplate;

    public WhiteboardWebSocketController(WhiteboardService whiteboardService, SimpMessagingTemplate messagingTemplate) {
        this.whiteboardService = whiteboardService;
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
                    new HashMap<>(Map.of("elementId", elementId, "deletedBy", userId))
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
                    new HashMap<>(Map.of("clearedBy", dto.getUserId()))
            );
        }
    }
}
