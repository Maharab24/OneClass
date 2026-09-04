package com.oneclass.app.features.whiteboard.room.model;

import com.oneclass.app.common.model.User;
import com.oneclass.app.features.whiteboard.chat.model.ChatMessage;
import com.oneclass.app.features.whiteboard.drawing.model.DrawingElement;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class Room {
    private String roomCode;
    private String hostUserId;
    private Map<String, User> users = new ConcurrentHashMap<>();
    private List<DrawingElement> elements = Collections.synchronizedList(new ArrayList<>());
    private List<ChatMessage> messages = Collections.synchronizedList(new ArrayList<>());
    private static final int MAX_MESSAGES = 100;
    private long createdAt;
    private Long emptySince;

    public Room() {}

    public Room(String roomCode, String hostUserId) {
        this.roomCode = roomCode;
        this.hostUserId = hostUserId;
        this.createdAt = System.currentTimeMillis();
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

    public Map<String, User> getUsers() {
        return users;
    }

    public List<DrawingElement> getElements() {
        return elements;
    }

    public List<ChatMessage> getMessages() {
        return messages;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }

    public Long getEmptySince() {
        return emptySince;
    }

    public void setEmptySince(Long emptySince) {
        this.emptySince = emptySince;
    }

    public void addUser(User user) {
        this.users.put(user.getId(), user);
        this.emptySince = null;
    }

    public void removeUser(String userId) {
        this.users.remove(userId);
        if (this.users.isEmpty()) {
            this.emptySince = System.currentTimeMillis();
        }
    }

    public void addElement(DrawingElement element) {
        this.elements.add(element);
    }

    public void clearElements() {
        this.elements.clear();
    }

    public void addMessage(ChatMessage message) {
        synchronized (this.messages) {
            if (this.messages.size() >= MAX_MESSAGES) {
                this.messages.remove(0);
            }
            this.messages.add(message);
        }
    }
}
