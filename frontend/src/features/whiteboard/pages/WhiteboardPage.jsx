import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../common/context/AuthContext';
import axiosInstance from '../../../common/api/axiosInstance';
import Header from '../../../common/components/Header';
import UserListSidebar from '../room/components/UserListSidebar';
import Toolbar from '../drawing/components/Toolbar';
import LiveCursors from '../presence/components/LiveCursors';
import WhiteboardCanvas from '../drawing/components/WhiteboardCanvas';
import FloatingChatWidget from '../chat/components/FloatingChatWidget';
import { stompService } from '../drawing/services/stompClient';
import { AlertCircle } from 'lucide-react';

export default function WhiteboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth } = useAuth();

  // Initialize directly from navigation state if available (instant launch from dashboard)
  const [room, setRoom] = useState(() => location.state?.room || null);
  const [currentUser, setCurrentUser] = useState(() => location.state?.currentUser || null);
  const [userRole, setUserRole] = useState(() => location.state?.currentUser?.role || 'CAN_WATCH');
  const [participants, setParticipants] = useState(() => location.state?.room?.participants || []);
  const [elements, setElements] = useState(() => location.state?.room?.elements || []);
  const [cursors, setCursors] = useState({});
  const [messages, setMessages] = useState(() => location.state?.room?.messages || []);

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
  const seenMessageIdsRef = useRef(
    new Set((location.state?.room?.messages || []).map((m) => m.id))
  );

  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const handleExit = useCallback(() => {
    if (auth?.role === 'TEACHER') {
      navigate('/teacher/dashboard');
    } else if (auth?.role === 'STUDENT') {
      navigate('/student/dashboard');
    } else {
      navigate('/');
    }
  }, [auth?.role, navigate]);

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
  }, [room?.roomCode, currentUser?.id, currentUser?.name]);

  // Join room using authenticated account name synced with database
  const handleJoinRoom = useCallback(
    async (codeToJoin) => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.post('/rooms/join', {
          roomCode: codeToJoin.trim().toUpperCase(),
          userName: auth?.fullName,
          requestedRole: 'CAN_WATCH',
        });

        const data = res.data;
        setRoom(data);
        setCurrentUser(data.currentUser);
        setUserRole(data.currentUser.role);
        setParticipants(data.participants || []);
        setElements(data.elements || []);

        const initialMsgs = data.messages || [];
        setMessages(initialMsgs);
        seenMessageIdsRef.current = new Set(initialMsgs.map((m) => m.id));
      } catch (err) {
        const errMsg =
          typeof err.response?.data === 'string'
            ? err.response.data
            : err.response?.data?.message || 'Failed to join room.';
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    },
    [auth?.fullName]
  );

  // Auto-join or redirect to dashboard if room is not yet initialized
  useEffect(() => {
    if (room) return;

    const queryParams = new URLSearchParams(location.search);
    const code =
      location.state?.autoJoinCode ||
      location.state?.roomCode ||
      queryParams.get('room');

    if (code) {
      handleJoinRoom(code);
    } else {
      // Direct access without room or code -> user is not in a room, redirect to dashboard
      handleExit();
    }
  }, [room, location.state, location.search, handleJoinRoom, handleExit]);

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
    [canEdit, room, currentUser]
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
    [canEdit, room, currentUser]
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
    [canEdit, room, currentUser]
  );

  // Dispatch clear canvas event
  const handleClearCanvas = useCallback(() => {
    if (!canEdit || !room || !currentUser) return;

    setElements([]);

    stompService.send('/app/room.clear', {
      roomCode: room.roomCode,
      userId: currentUser.id,
    });
  }, [canEdit, room, currentUser]);

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
    [room, currentUser]
  );

  // Render Loading Screen while auto-joining
  if (!room && loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-300 font-medium tracking-wide">Connecting to Whiteboard Room...</p>
      </div>
    );
  }

  // Render Error Screen if unable to join
  if (!room && error) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 font-sans">
        <div className="max-w-md w-full bg-slate-800 border border-rose-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Whiteboard Session Error</h2>
          <p className="text-sm text-slate-300 leading-relaxed">{error}</p>
          <button
            onClick={handleExit}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return null;
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-100 text-slate-900 overflow-hidden relative font-sans">
      <Header
        roomCode={room.roomCode}
        userRole={userRole}
        participantsCount={participants.length}
        onToggleParticipants={() => setSidebarOpen((prev) => !prev)}
        unreadChatCount={unreadChatCount}
        onToggleChat={() => setChatOpen((prev) => !prev)}
        isChatOpen={chatOpen}
        onExit={handleExit}
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
    </div>
  );
}
