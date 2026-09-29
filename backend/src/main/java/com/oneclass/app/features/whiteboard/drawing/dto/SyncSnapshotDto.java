package com.oneclass.app.features.whiteboard.drawing.dto;

import com.oneclass.app.features.whiteboard.drawing.model.DrawingElement;

import java.util.List;

public class SyncSnapshotDto {
    private String roomCode;
    private String targetUserId;
    private String senderUserId;
    private List<DrawingElement> elements;

    public SyncSnapshotDto() {}

    public SyncSnapshotDto(String roomCode, String targetUserId, String senderUserId, List<DrawingElement> elements) {
        this.roomCode = roomCode;
        this.targetUserId = targetUserId;
        this.senderUserId = senderUserId;
        this.elements = elements;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public String getTargetUserId() {
        return targetUserId;
    }

    public void setTargetUserId(String targetUserId) {
        this.targetUserId = targetUserId;
    }

    public String getSenderUserId() {
        return senderUserId;
    }

    public void setSenderUserId(String senderUserId) {
        this.senderUserId = senderUserId;
    }

    public List<DrawingElement> getElements() {
        return elements;
    }

    public void setElements(List<DrawingElement> elements) {
        this.elements = elements;
    }
}

