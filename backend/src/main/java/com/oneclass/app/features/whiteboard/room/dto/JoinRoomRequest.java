package com.oneclass.app.features.whiteboard.room.dto;

import com.oneclass.app.features.whiteboard.room.model.Role;

public class JoinRoomRequest {
    private String roomCode;
    private String userName;
    private Role requestedRole;

    public JoinRoomRequest() {}

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public Role getRequestedRole() {
        return requestedRole;
    }

    public void setRequestedRole(Role requestedRole) {
        this.requestedRole = requestedRole;
    }
}
