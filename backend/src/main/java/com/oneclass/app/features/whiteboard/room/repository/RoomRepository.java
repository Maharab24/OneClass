package com.oneclass.app.features.whiteboard.room.repository;

import com.oneclass.app.features.whiteboard.room.model.Room;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class RoomRepository {
    private final Map<String, Room> roomMap = new ConcurrentHashMap<>();

    public Room save(Room room) {
        roomMap.put(room.getRoomCode(), room);
        return room;
    }

    public Optional<Room> findByRoomCode(String roomCode) {
        if (roomCode == null) return Optional.empty();
        return Optional.ofNullable(roomMap.get(roomCode.toUpperCase()));
    }

    public boolean existsByRoomCode(String roomCode) {
        if (roomCode == null) return false;
        return roomMap.containsKey(roomCode.toUpperCase());
    }

    public void deleteByRoomCode(String roomCode) {
        if (roomCode != null) {
            roomMap.remove(roomCode.toUpperCase());
        }
    }
}
