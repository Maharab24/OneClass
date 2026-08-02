package com.oneclass.app.features.whiteboard.drawing.dto;

import com.oneclass.app.features.whiteboard.drawing.model.DrawingElement;

public class DrawElementDto {
    private String roomCode;
    private String userId;
    private DrawingElement element;

    public DrawElementDto() {}

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

    public DrawingElement getElement() {
        return element;
    }

    public void setElement(DrawingElement element) {
        this.element = element;
    }
}
