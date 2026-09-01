package com.oneclass.app.features.whiteboard.chat.controller;

import com.oneclass.app.features.whiteboard.chat.dto.SendChatMessageDto;
import com.oneclass.app.features.whiteboard.chat.model.ChatMessage;
import com.oneclass.app.features.whiteboard.chat.service.ChatService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Optional;

@Controller
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatWebSocketController(ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/room.chat")
    public void handleChatMessage(@Payload SendChatMessageDto dto) {
        Optional<ChatMessage> optionalMessage = chatService.processMessage(dto);
        optionalMessage.ifPresent(message -> {
            messagingTemplate.convertAndSend(
                    "/topic/room/" + message.getRoomCode().toUpperCase() + "/chat",
                    message
            );
        });
    }
}

