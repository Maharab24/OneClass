import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './common/components/Header';
import RoomJoinModal from './features/whiteboard/room/components/RoomJoinModal';
import UserListSidebar from './features/whiteboard/room/components/UserListSidebar';
import Toolbar from './features/whiteboard/drawing/components/Toolbar';
import LiveCursors from './features/whiteboard/presence/components/LiveCursors';
import WhiteboardCanvas from './features/whiteboard/drawing/components/WhiteboardCanvas';
import FloatingChatWidget from './features/whiteboard/chat/components/FloatingChatWidget';
import { stompService } from './features/whiteboard/drawing/services/stompClient';

export default function App() {
  const [room, setRoom] = useState(null); // { roomCode, hostUserId, currentUser, participants, elements, messages }
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('CAN_WATCH');
  const [participants, setParticipants] = useState([]);
  const [elements, setElements] = useState([]);
  const [cursors, setCursors] = useState({});
  const [messages, setMessages] = useState([]);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Whiteboard Tool State (Default to Electric Indigo)
  const [activeTool, setActiveTool] = useState('brush');
  const [color, setColor] = useState('#4f46e5');
  const [strokeWidth, setStrokeWidth] = useState(4);

  const canEdit = userRole === 'HOST' || userRole === 'CAN_EDIT';

  // Keep references to mutable UI states for STOMP callbacks without stale closures
  const chatOpenRef = useRef(chatOpen);
  const currentUserRef = useRef(currentUser);
  const seenMessageIdsRef = useRef(new Set());

  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Handle STOMP WebSocket subscriptions once room is joined
  useEffect(() => {
    if (!room?.roomCode || !currentUser?.id) return;

    const roomCode = room.roomCode.toUpperCase();
    const currentUserId = currentUser.id;
    const currentUserName = currentUser.name;

    stompService.connect(
      () => {
        // 1. Subscribe to user list & role updates
        const unsubUsers = stompService.subscribe(`/topic/room/${roomCode}/users`, (updatedUsers) => {
          const userList = Array.isArray(updatedUsers) ? updatedUsers : Object.values(updatedUsers);
          setParticipants(userList);

          // Update current user's role if modified by host
          const self = userList.find((u) => u.id === currentUserId);
          if (self) {
            setUserRole(self.role);
          }
        });

        // 2. Subscribe to drawing events
        const unsubDraw = stompService.subscribe(`/topic/room/${roomCode}/draw`, (payload) => {
          if (payload?.element) {
            setElements((prev) => {
              if (prev.some((e) => e.id === payload.element.id)) return prev;
              return [...prev, payload.element];
            });
          }
        });

        // 3. Subscribe to clear canvas event
        const unsubClear = stompService.subscribe(`/topic/room/${roomCode}/clear`, () => {
          setElements([]);
        });

        // 4. Subscribe to element deletion event (Object Eraser)
        const unsubDelete = stompService.subscribe(`/topic/room/${roomCode}/delete-element`, (payload) => {
          if (payload?.elementId) {
            setElements((prev) => prev.filter((e) => e.id !== payload.elementId));
          }
        });

        // 5. Subscribe to live remote cursors (filtered for Editors only)
        const unsubCursors = stompService.subscribe(`/topic/room/${roomCode}/cursors`, (cursorPayload) => {
          if (cursorPayload && cursorPayload.userId !== currentUserId) {
            setCursors((prev) => ({
              ...prev,
              [cursorPayload.userId]: cursorPayload,
            }));
          }
        });

        // 6. Subscribe to live room chat messages
        const unsubChat = stompService.subscribe(`/topic/room/${roomCode}/chat`, (newMsg) => {
          if (!newMsg?.id) return;

          // Prevent processing duplicate message deliveries
          if (seenMessageIdsRef.current.has(newMsg.id)) {
            return;
          }
          seenMessageIdsRef.current.add(newMsg.id);

          setMessages((prev) => [...prev, newMsg]);

          // Increment unread count only once if chat is currently closed and not from self
          if (!chatOpenRef.current && newMsg.senderId !== currentUserRef.current?.id) {
            setUnreadChatCount((count) => count + 1);
          }
        });

        // Notify server user joined once on connect
        stompService.send('/app/room.user-joined', {
          roomCode,
          userId: currentUserId,
          userName: currentUserName,
        });

        return () => {
          unsubUsers?.();
          unsubDraw?.();
          unsubClear?.();
          unsubDelete?.();
          unsubCursors?.();
          unsubChat?.();
        };
      },
      () => {
        setError('Connection lost to real-time server.');
      }
    );

    return () => {
      stompService.disconnect();
    };
  }, [room?.roomCode, currentUser?.id]);

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

      const initialMsgs = data.messages || [];
      setMessages(initialMsgs);
      seenMessageIdsRef.current = new Set(initialMsgs.map((m) => m.id));
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

      const initialMsgs = data.messages || [];
      setMessages(initialMsgs);
      seenMessageIdsRef.current = new Set(initialMsgs.map((m) => m.id));
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

  // Live chat message sender
  const handleSendMessage = useCallback(
    (content, type = 'CHAT') => {
      if (!room || !currentUser || !content?.trim()) return;

      stompService.send('/app/room.chat', {
        roomCode: room.roomCode,
        senderId: currentUser.id,
        content: content.trim(),
        type,
      });
    },
    [room?.roomCode, currentUser?.id]
  );

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
            unreadChatCount={unreadChatCount}
            onToggleChat={() => setChatOpen((prev) => !prev)}
            isChatOpen={chatOpen}
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

            <FloatingChatWidget
              messages={messages}
              currentUserId={currentUser?.id}
              onSendMessage={handleSendMessage}
              unreadCount={unreadChatCount}
              onResetUnread={() => setUnreadChatCount(0)}
              isOpen={chatOpen}
              setIsOpen={setChatOpen}
            />
          </main>
        </>
      )}
    </div>
  );
}
