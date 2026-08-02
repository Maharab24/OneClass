package com.oneclass.app.features.whiteboard.drawing.dto;

public class ClearCanvasDto {
    private String roomCode;
    private String userId;

    public ClearCanvasDto() {}

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}
