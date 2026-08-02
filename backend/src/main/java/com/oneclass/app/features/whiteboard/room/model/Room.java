package com.oneclass.app.features.whiteboard.room.model;

import com.oneclass.app.common.model.User;
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
    private long createdAt;

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

    public void setUsers(Map<String, User> users) {
        this.users = users;
    }

    public List<DrawingElement> getElements() {
        return elements;
    }

    public void setElements(List<DrawingElement> elements) {
        this.elements = elements;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }

    public void addUser(User user) {
        this.users.put(user.getId(), user);
    }

    public void removeUser(String userId) {
        this.users.remove(userId);
    }

    public void addElement(DrawingElement element) {
        this.elements.add(element);
    }

    public void clearElements() {
        this.elements.clear();
    }
}
