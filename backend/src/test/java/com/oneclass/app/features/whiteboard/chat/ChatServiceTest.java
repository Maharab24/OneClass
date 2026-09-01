package com.oneclass.app.features.whiteboard.chat;

import com.oneclass.app.common.model.User;
import com.oneclass.app.features.whiteboard.chat.dto.SendChatMessageDto;
import com.oneclass.app.features.whiteboard.chat.model.ChatMessage;
import com.oneclass.app.features.whiteboard.chat.model.MessageType;
import com.oneclass.app.features.whiteboard.chat.service.ChatService;
import com.oneclass.app.features.whiteboard.room.model.Role;
import com.oneclass.app.features.whiteboard.room.model.Room;
import com.oneclass.app.features.whiteboard.room.service.RoomService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class ChatServiceTest {

    private RoomService roomService;
    private ChatService chatService;

    @BeforeEach
    void setUp() {
        roomService = Mockito.mock(RoomService.class);
        chatService = new ChatService(roomService);
    }

    @Test
    void testProcessMessage_Success() {
        String roomCode = "TEST01";
        String userId = "user-123";
        Room room = new Room(roomCode, userId);
        User user = new User(userId, "Alice", Role.HOST, "#ef4444");
        room.addUser(user);

        when(roomService.getRoomByCode(roomCode)).thenReturn(Optional.of(room));

        SendChatMessageDto dto = new SendChatMessageDto(roomCode, userId, "Hello World", MessageType.CHAT);
        Optional<ChatMessage> result = chatService.processMessage(dto);

        assertTrue(result.isPresent());
        ChatMessage msg = result.get();
        assertEquals("Hello World", msg.getContent());
        assertEquals("Alice", msg.getSenderName());
        assertEquals(Role.HOST, msg.getSenderRole());
        assertEquals("#ef4444", msg.getSenderColor());
        assertEquals(MessageType.CHAT, msg.getType());
        assertEquals(1, room.getMessages().size());
    }

    @Test
    void testCreateAndAddSystemMessage() {
        String roomCode = "TEST_SYS";
        Room room = new Room(roomCode, "host-1");

        when(roomService.getRoomByCode(roomCode)).thenReturn(Optional.of(room));

        ChatMessage sysMsg = chatService.createAndAddSystemMessage(roomCode, "Alice was made an Editor.");

        assertNotNull(sysMsg);
        assertEquals(MessageType.SYSTEM, sysMsg.getType());
        assertEquals("Alice was made an Editor.", sysMsg.getContent());
        assertEquals(1, room.getMessages().size());
        assertEquals(sysMsg, room.getMessages().get(0));
    }

    @Test
    void testProcessMessage_InvalidUser() {
        String roomCode = "TEST02";
        Room room = new Room(roomCode, "host-1");

        when(roomService.getRoomByCode(roomCode)).thenReturn(Optional.of(room));

        SendChatMessageDto dto = new SendChatMessageDto(roomCode, "unknown-user", "Hello", MessageType.CHAT);
        Optional<ChatMessage> result = chatService.processMessage(dto);

        assertTrue(result.isEmpty());
        assertEquals(0, room.getMessages().size());
    }

    @Test
    void testProcessMessage_EmptyContent() {
        String roomCode = "TEST03";
        String userId = "user-1";
        Room room = new Room(roomCode, userId);
        User user = new User(userId, "Bob", Role.CAN_WATCH, "#3b82f6");
        room.addUser(user);

        when(roomService.getRoomByCode(roomCode)).thenReturn(Optional.of(room));

        SendChatMessageDto dto = new SendChatMessageDto(roomCode, userId, "   ", MessageType.CHAT);
        Optional<ChatMessage> result = chatService.processMessage(dto);

        assertTrue(result.isEmpty());
    }

    @Test
    void testProcessMessage_RoomCapacityCap() {
        String roomCode = "TEST04";
        String userId = "user-1";
        Room room = new Room(roomCode, userId);
        User user = new User(userId, "Charlie", Role.CAN_EDIT, "#10b981");
        room.addUser(user);

        when(roomService.getRoomByCode(roomCode)).thenReturn(Optional.of(room));

        for (int i = 0; i < 110; i++) {
            SendChatMessageDto dto = new SendChatMessageDto(roomCode, userId, "Msg " + i, MessageType.CHAT);
            chatService.processMessage(dto);
        }

        assertEquals(100, room.getMessages().size());
        assertEquals("Msg 109", room.getMessages().get(99).getContent());
    }
}

