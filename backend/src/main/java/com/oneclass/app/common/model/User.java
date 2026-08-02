package com.oneclass.app.common.model;

import com.oneclass.app.features.whiteboard.room.model.Role;

public class User {
    private String id;
    private String name;
    private Role role;
    private String color;

    public User() {}

    public User(String id, String name, Role role, String color) {
        this.id = id;
        this.name = name;
        this.role = role;
        this.color = color;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }
}
