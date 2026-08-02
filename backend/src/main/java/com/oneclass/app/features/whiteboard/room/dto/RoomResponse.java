package com.oneclass.app.features.whiteboard.room.dto;

import com.oneclass.app.common.model.User;
import com.oneclass.app.features.whiteboard.drawing.model.DrawingElement;

import java.util.Collection;
import java.util.List;

public class RoomResponse {
    private String roomCode;
    private String hostUserId;
    private User currentUser;
    private Collection<User> participants;
    private List<DrawingElement> elements;

    public RoomResponse() {}

    public RoomResponse(String roomCode, String hostUserId, User currentUser, Collection<User> participants, List<DrawingElement> elements) {
        this.roomCode = roomCode;
        this.hostUserId = hostUserId;
        this.currentUser = currentUser;
        this.participants = participants;
        this.elements = elements;
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
}
