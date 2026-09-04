package com.oneclass.app.config;

import com.oneclass.app.common.model.User;
import com.oneclass.app.features.whiteboard.chat.model.ChatMessage;
import com.oneclass.app.features.whiteboard.chat.service.ChatService;
import com.oneclass.app.features.whiteboard.room.service.RoomService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Collections;
import java.util.Optional;

@Component
public class WebSocketEventListener {

    private static final Logger log = LoggerFactory.getLogger(WebSocketEventListener.class);

    private final RoomService roomService;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketEventListener(RoomService roomService, ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.roomService = roomService;
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        if (sessionId == null) return;

        Optional<RoomService.UserSession> optionalSession = roomService.unregisterSession(sessionId);
        optionalSession.ifPresent(session -> {
            String roomCode = session.roomCode().toUpperCase();
            String userId = session.userId();

            log.info("WebSocket disconnect detected for user {} in room {}", userId, roomCode);

            Optional<User> removedUser = roomService.removeUserFromRoom(roomCode, userId);

            // Broadcast updated participant list
            roomService.getRoomByCode(roomCode).ifPresentOrElse(
                    room -> messagingTemplate.convertAndSend(
                            "/topic/room/" + roomCode + "/users",
                            room.getUsers().values()
                    ),
                    () -> messagingTemplate.convertAndSend(
                            "/topic/room/" + roomCode + "/users",
                            Collections.emptyList()
                    )
            );

            // Broadcast departure chat notification if user had a display name
            removedUser.ifPresent(user -> {
                if (user.getName() != null && !user.getName().trim().isEmpty()) {
                    ChatMessage systemMsg = chatService.createAndAddSystemMessage(
                            roomCode,
                            user.getName().trim() + " left the room."
                    );
                    messagingTemplate.convertAndSend(
                            "/topic/room/" + roomCode + "/chat",
                            systemMsg
                    );
                }
            });
        });
    }
}

