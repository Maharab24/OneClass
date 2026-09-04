package com.oneclass.app.features.whiteboard.room.repository;

import com.oneclass.app.features.whiteboard.room.model.Room;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class RoomRepository {
    private final Map<String, Room> roomMap = new ConcurrentHashMap<>();

    public Room save(Room room) {
        if (room != null && room.getRoomCode() != null) {
            roomMap.put(room.getRoomCode().toUpperCase(), room);
        }
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

    public Collection<Room> findAll() {
        return roomMap.values();
    }

    public void deleteByRoomCode(String roomCode) {
        if (roomCode != null) {
            roomMap.remove(roomCode.toUpperCase());
        }
    }
}
