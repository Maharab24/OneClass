package com.oneclass.app.features.whiteboard.drawing.dto;

public class SyncRequestDto {
    private String roomCode;
    private String requesterUserId;
    private String requesterName;

    public SyncRequestDto() {}

    public SyncRequestDto(String roomCode, String requesterUserId, String requesterName) {
        this.roomCode = roomCode;
        this.requesterUserId = requesterUserId;
        this.requesterName = requesterName;
    }

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

    public String getRequesterName() {
        return requesterName;
    }

    public void setRequesterName(String requesterName) {
        this.requesterName = requesterName;
    }
}

