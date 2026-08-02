package com.oneclass.app.features.whiteboard.presence.controller;

import com.oneclass.app.features.whiteboard.presence.dto.CursorPositionDto;
import com.oneclass.app.features.whiteboard.presence.service.PresenceService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class PresenceWebSocketController {

    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    public PresenceWebSocketController(PresenceService presenceService, SimpMessagingTemplate messagingTemplate) {
        this.presenceService = presenceService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/room.cursor")
    public void handleCursorMove(@Payload CursorPositionDto dto) {
        if (presenceService.validateCursorBroadcast(dto)) {
            messagingTemplate.convertAndSend(
                    "/topic/room/" + dto.getRoomCode().toUpperCase() + "/cursors",
                    dto
            );
        }
    }
}
