package com.oneclass.app.features.whiteboard.chat.service;

import com.oneclass.app.common.model.User;
import com.oneclass.app.features.whiteboard.chat.dto.SendChatMessageDto;
import com.oneclass.app.features.whiteboard.chat.model.ChatMessage;
import com.oneclass.app.features.whiteboard.chat.model.MessageType;
import com.oneclass.app.features.whiteboard.room.model.Room;
import com.oneclass.app.features.whiteboard.room.service.RoomService;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class ChatService {

    private final RoomService roomService;

    public ChatService(RoomService roomService) {
        this.roomService = roomService;
    }

    public Optional<ChatMessage> processMessage(SendChatMessageDto dto) {
        if (dto == null || dto.getRoomCode() == null || dto.getSenderId() == null) {
            return Optional.empty();
        }

        String content = dto.getContent() != null ? dto.getContent().trim() : "";
        if (content.isEmpty()) {
            return Optional.empty();
        }

        Optional<Room> optionalRoom = roomService.getRoomByCode(dto.getRoomCode().toUpperCase());
        if (optionalRoom.isEmpty()) {
            return Optional.empty();
        }

        Room room = optionalRoom.get();
        User sender = room.getUsers().get(dto.getSenderId());
        if (sender == null) {
            return Optional.empty();
        }

        MessageType msgType = dto.getType() != null ? dto.getType() : MessageType.CHAT;

        ChatMessage message = new ChatMessage(
                UUID.randomUUID().toString(),
                room.getRoomCode(),
                sender.getId(),
                sender.getName(),
                sender.getRole(),
                sender.getColor(),
                content,
                msgType
        );

        room.addMessage(message);

        return Optional.of(message);
    }

    public ChatMessage createAndAddSystemMessage(String roomCode, String content) {
        ChatMessage message = new ChatMessage(
                UUID.randomUUID().toString(),
                roomCode.toUpperCase(),
                "SYSTEM",
                "System",
                null,
                "#64748b",
                content,
                MessageType.SYSTEM
        );

        roomService.getRoomByCode(roomCode.toUpperCase()).ifPresent(room -> {
            room.addMessage(message);
        });

        return message;
    }
}

