package com.oneclass.app.features.whiteboard.room.dto;

import com.oneclass.app.common.model.User;
import com.oneclass.app.features.whiteboard.chat.model.ChatMessage;
import com.oneclass.app.features.whiteboard.drawing.model.DrawingElement;

import java.util.Collection;
import java.util.List;

public class RoomResponse {
    private String roomCode;
    private String hostUserId;
    private User currentUser;
    private Collection<User> participants;
    private List<DrawingElement> elements;
    private List<ChatMessage> messages;
    private boolean videoActive;

    public RoomResponse() {}

    public RoomResponse(String roomCode, String hostUserId, User currentUser, Collection<User> participants, List<DrawingElement> elements, List<ChatMessage> messages) {
        this(roomCode, hostUserId, currentUser, participants, elements, messages, false);
    }

    public RoomResponse(String roomCode, String hostUserId, User currentUser, Collection<User> participants, List<DrawingElement> elements, List<ChatMessage> messages, boolean videoActive) {
        this.roomCode = roomCode;
        this.hostUserId = hostUserId;
        this.currentUser = currentUser;
        this.participants = participants;
        this.elements = elements;
        this.messages = messages;
        this.videoActive = videoActive;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public String getHostUserId() {
        return hostUserId;
    }

    public void setHostUserId(String hostUserId) {
        this.hostUserId = hostUserId;
    }

    public User getCurrentUser() {
        return currentUser;
    }

    public void setCurrentUser(User currentUser) {
        this.currentUser = currentUser;
    }

    public Collection<User> getParticipants() {
        return participants;
    }

    public void setParticipants(Collection<User> participants) {
        this.participants = participants;
    }

    public List<DrawingElement> getElements() {
        return elements;
    }

    public void setElements(List<DrawingElement> elements) {
        this.elements = elements;
    }

    public List<ChatMessage> getMessages() {
        return messages;
    }

    public void setMessages(List<ChatMessage> messages) {
        this.messages = messages;
    }

    public boolean isVideoActive() {
        return videoActive;
    }

    public void setVideoActive(boolean videoActive) {
        this.videoActive = videoActive;
    }
}
