import React, { useState, useEffect, useCallback } from 'react';
import Header from './common/components/Header';
import RoomJoinModal from './features/whiteboard/room/components/RoomJoinModal';
import UserListSidebar from './features/whiteboard/room/components/UserListSidebar';
import Toolbar from './features/whiteboard/drawing/components/Toolbar';
import LiveCursors from './features/whiteboard/presence/components/LiveCursors';
import WhiteboardCanvas from './features/whiteboard/drawing/components/WhiteboardCanvas';
import { stompService } from './features/whiteboard/drawing/services/stompClient';

export default function App() {
  const [room, setRoom] = useState(null); // { roomCode, hostUserId, currentUser, participants, elements }
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('CAN_WATCH');
  const [participants, setParticipants] = useState([]);
  const [elements, setElements] = useState([]);
  const [cursors, setCursors] = useState({});

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Whiteboard Tool State (Default to Electric Indigo)
  const [activeTool, setActiveTool] = useState('brush');
  const [color, setColor] = useState('#4f46e5');
  const [strokeWidth, setStrokeWidth] = useState(4);

  const canEdit = userRole === 'HOST' || userRole === 'CAN_EDIT';

  // Handle STOMP WebSocket subscriptions once room is joined
  useEffect(() => {
    if (!room || !currentUser) return;

    const roomCode = room.roomCode.toUpperCase();

    stompService.connect(
      () => {
        // Subscribe to user list & role updates
        stompService.subscribe(`/topic/room/${roomCode}/users`, (updatedUsers) => {
          const userList = Array.isArray(updatedUsers) ? updatedUsers : Object.values(updatedUsers);
          setParticipants(userList);

          // Update current user's role if modified by host
          const self = userList.find((u) => u.id === currentUser.id);
          if (self && self.role !== userRole) {
            setUserRole(self.role);
          }
        });

        // Subscribe to drawing events
        stompService.subscribe(`/topic/room/${roomCode}/draw`, (payload) => {
          if (payload && payload.element) {
            setElements((prev) => {
              // Avoid duplicate elements if already drawn locally
              if (prev.some((e) => e.id === payload.element.id)) {
                return prev;
              }
              return [...prev, payload.element];
            });
          }
        });

        // Subscribe to clear canvas event
        stompService.subscribe(`/topic/room/${roomCode}/clear`, () => {
          setElements([]);
        });

        // Subscribe to element deletion event (Object Eraser)
        stompService.subscribe(`/topic/room/${roomCode}/delete-element`, (payload) => {
          if (payload && payload.elementId) {
            setElements((prev) => prev.filter((e) => e.id !== payload.elementId));
          }
        });

        // Subscribe to live remote cursors (filtered for Editors only)
        stompService.subscribe(`/topic/room/${roomCode}/cursors`, (cursorPayload) => {
          if (cursorPayload && cursorPayload.userId !== currentUser.id) {
            setCursors((prev) => ({
              ...prev,
              [cursorPayload.userId]: cursorPayload,
            }));
          }
        });

        // Notify server user joined
        stompService.send('/app/room.user-joined', { roomCode });
      },
      (err) => {
        setError('Connection lost to real-time server.');
      }
    );

    return () => {
      stompService.disconnect();
    };
  }, [room?.roomCode, currentUser?.id, userRole]);

  // Handle Room Creation
  const handleCreateRoom = async (hostName) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName }),
      });

      if (!res.ok) throw new Error('Failed to create room.');

      const data = await res.json();
      setRoom(data);
      setCurrentUser(data.currentUser);
      setUserRole(data.currentUser.role);
      setParticipants(data.participants || []);
      setElements(data.elements || []);
    } catch (err) {
      setError(err.message || 'Error creating room.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Room Joining
  const handleJoinRoom = async (roomCode, userName) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          userName,
          requestedRole: 'CAN_WATCH', // Default Watcher per requirement
        }),
      });

      if (!res.ok) {
        const errMsg = await res.text();
        throw new Error(errMsg || 'Failed to join room.');
      }

      const data = await res.json();
      setRoom(data);
      setCurrentUser(data.currentUser);
      setUserRole(data.currentUser.role);
      setParticipants(data.participants || []);
      setElements(data.elements || []);
    } catch (err) {
      setError(err.message || 'Error joining room.');
    } finally {
      setLoading(false);
    }
  };

  // Dispatch new drawing element locally and to WebSocket STOMP
  const handleAddElement = useCallback(
    (newElement) => {
      if (!canEdit || !room || !currentUser) return;

      setElements((prev) => [...prev, newElement]);

      stompService.send('/app/room.draw', {
        roomCode: room.roomCode,
        userId: currentUser.id,
        element: newElement,
      });
    },
    [canEdit, room?.roomCode, currentUser?.id]
  );

  // Dispatch object element deletion (Object Eraser)
  const handleDeleteElement = useCallback(
    (elementId) => {
      if (!canEdit || !room || !currentUser) return;

      setElements((prev) => prev.filter((e) => e.id !== elementId));

      stompService.send('/app/room.delete-element', {
        roomCode: room.roomCode,
        userId: currentUser.id,
        elementId,
      });
    },
    [canEdit, room?.roomCode, currentUser?.id]
  );

  // Dispatch live cursor move (throttled)
  const handleCursorMove = useCallback(
    (x, y) => {
      if (!canEdit || !room || !currentUser) return;

      stompService.send('/app/room.cursor', {
        roomCode: room.roomCode,
        userId: currentUser.id,
        userName: currentUser.name,
        color: currentUser.color,
        x,
        y,
      });
    },
    [canEdit, room?.roomCode, currentUser]
  );

  // Dispatch clear canvas event
  const handleClearCanvas = useCallback(() => {
    if (!canEdit || !room || !currentUser) return;

    setElements([]);

    stompService.send('/app/room.clear', {
      roomCode: room.roomCode,
      userId: currentUser.id,
    });
  }, [canEdit, room?.roomCode, currentUser?.id]);

  // Host role change handler
  const handleRoleChange = (targetUserId, newRole) => {
    if (!room || currentUser.role !== 'HOST') return;

    stompService.send('/app/room.role-change', {
      roomCode: room.roomCode,
      requesterUserId: currentUser.id,
      targetUserId,
      newRole,
    });
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-100 text-slate-900 overflow-hidden relative font-sans">
      {/* Modal for Room Entry */}
      {!room && (
        <RoomJoinModal
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          error={error}
          loading={loading}
        />
      )}

      {/* Main App Layout */}
      {room && (
        <>
          <Header
            roomCode={room.roomCode}
            userRole={userRole}
            participantsCount={participants.length}
            onToggleParticipants={() => setSidebarOpen((prev) => !prev)}
          />

          <main className="flex-1 relative overflow-hidden">
            <Toolbar
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              color={color}
              setColor={setColor}
              strokeWidth={strokeWidth}
              setStrokeWidth={setStrokeWidth}
              onClearCanvas={handleClearCanvas}
              canEdit={canEdit}
            />

            <LiveCursors cursors={cursors} currentUserId={currentUser?.id} />

            <WhiteboardCanvas
              elements={elements}
              onAddElement={handleAddElement}
              onDeleteElement={handleDeleteElement}
              onCursorMove={handleCursorMove}
              activeTool={activeTool}
              color={color}
              strokeWidth={strokeWidth}
              canEdit={canEdit}
            />

            <UserListSidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              participants={participants}
              currentUserId={currentUser?.id}
              isHost={userRole === 'HOST'}
              onRoleChange={handleRoleChange}
            />
          </main>
        </>
      )}
    </div>
  );
}
