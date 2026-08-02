package com.oneclass.app.features.whiteboard.room.dto;

public class CreateRoomRequest {
    private String hostName;

    public CreateRoomRequest() {}

    public CreateRoomRequest(String hostName) {
        this.hostName = hostName;
    }

    public String getHostName() {
        return hostName;
    }

    public void setHostName(String hostName) {
        this.hostName = hostName;
    }
}
