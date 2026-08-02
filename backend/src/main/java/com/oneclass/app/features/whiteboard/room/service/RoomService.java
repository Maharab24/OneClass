package com.oneclass.app.features.whiteboard.room.service;

import com.oneclass.app.common.model.User;
import com.oneclass.app.features.whiteboard.room.model.Role;
import com.oneclass.app.features.whiteboard.room.model.Room;
import com.oneclass.app.features.whiteboard.room.repository.RoomRepository;
import com.oneclass.app.features.whiteboard.room.dto.CreateRoomRequest;
import com.oneclass.app.features.whiteboard.room.dto.JoinRoomRequest;
import com.oneclass.app.features.whiteboard.room.dto.RoleUpdateRequest;
import com.oneclass.app.features.whiteboard.room.dto.RoomResponse;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Optional;
import java.util.UUID;

@Service
public class RoomService {
    private final RoomRepository roomRepository;
    private static final String CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom random = new SecureRandom();
    private static final String[] USER_COLORS = {
            "#ef4444", "#3b82f6", "#10b981", "#f59e0b",
            "#8b5cf6", "#ec4899", "#14b8a6", "#6366f1"
    };

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public RoomResponse createRoom(CreateRoomRequest request) {
        String roomCode = generateUniqueRoomCode();
        String userId = UUID.randomUUID().toString();
        String color = getRandomColor();

        User hostUser = new User(userId, request.getHostName(), Role.HOST, color);
        Room room = new Room(roomCode, userId);
        room.addUser(hostUser);

        roomRepository.save(room);

        return new RoomResponse(roomCode, userId, hostUser, room.getUsers().values(), room.getElements());
    }

    public RoomResponse joinRoom(JoinRoomRequest request) {
        String roomCode = request.getRoomCode().toUpperCase();
        Optional<Room> optionalRoom = roomRepository.findByRoomCode(roomCode);

        if (optionalRoom.isEmpty()) {
            throw new IllegalArgumentException("Room not found with code: " + roomCode);
        }

        Room room = optionalRoom.get();
        String userId = UUID.randomUUID().toString();
        String color = getRandomColor();
        
        Role initialRole = request.getRequestedRole() != null ? request.getRequestedRole() : Role.CAN_WATCH;
        User newUser = new User(userId, request.getUserName(), initialRole, color);

        room.addUser(newUser);
        roomRepository.save(room);

        return new RoomResponse(roomCode, room.getHostUserId(), newUser, room.getUsers().values(), room.getElements());
    }

    public Room updateRole(RoleUpdateRequest request) {
        Optional<Room> optionalRoom = roomRepository.findByRoomCode(request.getRoomCode());
        if (optionalRoom.isEmpty()) {
            throw new IllegalArgumentException("Room not found");
        }

        Room room = optionalRoom.get();
        
        if (!room.getHostUserId().equals(request.getRequesterUserId())) {
            throw new IllegalStateException("Only the room host can modify participant roles.");
        }

        User targetUser = room.getUsers().get(request.getTargetUserId());
        if (targetUser == null) {
            throw new IllegalArgumentException("Target user not found in room.");
        }

        if (targetUser.getRole() == Role.HOST) {
            return room;
        }

        targetUser.setRole(request.getNewRole());
        roomRepository.save(room);
        return room;
    }

    public Optional<Room> getRoomByCode(String roomCode) {
        return roomRepository.findByRoomCode(roomCode);
    }

    public void removeUserFromRoom(String roomCode, String userId) {
        roomRepository.findByRoomCode(roomCode).ifPresent(room -> {
            room.removeUser(userId);
            if (room.getUsers().isEmpty()) {
                roomRepository.deleteByRoomCode(roomCode);
            } else {
                roomRepository.save(room);
            }
        });
    }

    private String generateUniqueRoomCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
            }
            code = sb.toString();
        } while (roomRepository.existsByRoomCode(code));
        return code;
    }

    private String getRandomColor() {
        return USER_COLORS[random.nextInt(USER_COLORS.length)];
    }
}
