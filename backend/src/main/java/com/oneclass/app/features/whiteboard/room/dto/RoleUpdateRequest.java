package com.oneclass.app.features.whiteboard.room.dto;

import com.oneclass.app.features.whiteboard.room.model.Role;

public class RoleUpdateRequest {
    private String roomCode;
    private String requesterUserId;
    private String targetUserId;
    private Role newRole;

    public RoleUpdateRequest() {}

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public String getRequesterUserId() {
        return requesterUserId;
    }

    public void setRequesterUserId(String requesterUserId) {
        this.requesterUserId = requesterUserId;
    }

    public String getTargetUserId() {
        return targetUserId;
    }

    public void setTargetUserId(String targetUserId) {
        this.targetUserId = targetUserId;
    }

    public Role getNewRole() {
        return newRole;
    }

    public void setNewRole(Role newRole) {
        this.newRole = newRole;
    }
}
