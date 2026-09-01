package com.oneclass.app.features.whiteboard.chat.dto;

import com.oneclass.app.features.whiteboard.chat.model.MessageType;

public class SendChatMessageDto {
    private String roomCode;
    private String senderId;
    private String content;
    private MessageType type;

    public SendChatMessageDto() {}

    public SendChatMessageDto(String roomCode, String senderId, String content, MessageType type) {
        this.roomCode = roomCode;
        this.senderId = senderId;
        this.content = content;
        this.type = type;
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
}

