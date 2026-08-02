package com.oneclass.app.features.whiteboard.room.model;

public enum Role {
    HOST,
    CAN_EDIT,
    CAN_WATCH;

    public boolean canEdit() {
        return this == HOST || this == CAN_EDIT;
    }
}
