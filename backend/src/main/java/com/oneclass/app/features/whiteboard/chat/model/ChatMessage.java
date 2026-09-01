package com.oneclass.app.features.whiteboard.chat.model;

import com.oneclass.app.features.whiteboard.room.model.Role;

public class ChatMessage {
    private String id;
    private String roomCode;
    private String senderId;
    private String senderName;
    private Role senderRole;
    private String senderColor;
    private String content;
    private MessageType type;
    private long timestamp;

    public ChatMessage() {
        this.timestamp = System.currentTimeMillis();
    }

    public ChatMessage(String id, String roomCode, String senderId, String senderName, Role senderRole, String senderColor, String content, MessageType type) {
        this.id = id;
        this.roomCode = roomCode;
        this.senderId = senderId;
        this.senderName = senderName;
        this.senderRole = senderRole;
        this.senderColor = senderColor;
        this.content = content;
        this.type = type != null ? type : MessageType.CHAT;
        this.timestamp = System.currentTimeMillis();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public Role getSenderRole() {
        return senderRole;
    }

    public void setSenderRole(Role senderRole) {
        this.senderRole = senderRole;
    }

    public String getSenderColor() {
        return senderColor;
    }

    public void setSenderColor(String senderColor) {
        this.senderColor = senderColor;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public MessageType getType() {
        return type;
    }

    public void setType(MessageType type) {
        this.type = type;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}

