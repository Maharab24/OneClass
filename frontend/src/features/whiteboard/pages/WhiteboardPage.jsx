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
import AudioCallControl from '../call/components/AudioCallControl';
import FloatingVideoWindow from '../call/components/FloatingVideoWindow';
import KeyboardShortcutsModal from '../drawing/components/KeyboardShortcutsModal';
import { liveKitVideoService } from '../call/services/liveKitVideoService';
import { stompService } from '../drawing/services/stompClient';
import { whiteboardStorage } from '../drawing/services/whiteboardStorage';
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
  const [videoActive, setVideoActive] = useState(() => location.state?.room?.videoActive || false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState(null);
  const [videoError, setVideoError] = useState('');

  // Viewport / Pan & Zoom State
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Whiteboard Tool State (Default to Electric Indigo)
  const [activeTool, setActiveTool] = useState('brush');
  const [color, setColor] = useState('#4f46e5');
  const [strokeWidth, setStrokeWidth] = useState(4);

  const canEdit = userRole === 'HOST' || userRole === 'CAN_EDIT';

  // Keep references to mutable UI states for STOMP callbacks without stale closures
  const chatOpenRef = useRef(chatOpen);
  const currentUserRef = useRef(currentUser);
  const elementsRef = useRef(elements);
  const seenMessageIdsRef = useRef(
    new Set((location.state?.room?.messages || []).map((m) => m.id))
  );
  const videoStartedRef = useRef(false);
  const videoDismissedRef = useRef(false);
  const stompReadyRef = useRef(false);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Hydrate canvas elements from local browser IndexedDB
  useEffect(() => {
    if (!room?.roomCode) return;
    const roomCode = room.roomCode.toUpperCase();

    whiteboardStorage.loadElements(roomCode).then((localElements) => {
      if (localElements && localElements.length > 0) {
        setElements(localElements);
      } else if (room.elements && room.elements.length > 0) {
        setElements(room.elements);
        whiteboardStorage.saveElementsImmediate(roomCode, room.elements);
      }
    });
  }, [room?.roomCode]);

  const handleExit = useCallback(() => {
    if (location.state?.returnTo) {
      navigate(location.state.returnTo);
      return;
    }
    if (auth?.role === 'TEACHER') {
      navigate('/teacher/dashboard');
    } else if (auth?.role === 'STUDENT') {
      navigate('/student/dashboard');
    } else {
      navigate('/');
    }
  }, [auth?.role, navigate, location.state?.returnTo]);

  // Viewport Navigation Handlers
  const handleResetView = useCallback(() => {
    setStagePos({ x: 0, y: 0 });
    setScale(1);
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * 1.15, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev / 1.15, 0.2));
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput =
        ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) ||
        document.activeElement?.isContentEditable;
      if (isInput) return;

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }

      if (e.key === '0') {
        e.preventDefault();
        handleResetView();
        return;
      }

      if (e.key === 'Escape') {
        setShowShortcuts(false);
        return;
      }

      if (!canEdit) return;

      const key = e.key.toLowerCase();
      if (key === 'b' || key === 'p') {
        setActiveTool('brush');
      } else if (key === 'e') {
        setActiveTool('eraser');
      } else if (key === 'h') {
        setActiveTool('pan');
      } else if (key === 'r') {
        setActiveTool('rectangle');
      } else if (key === 'c' || key === 'o') {
        setActiveTool('circle');
      } else if (key === 'l') {
        setActiveTool('line');
      } else if (key === 't') {
        setActiveTool('text');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canEdit, handleResetView]);

  // Handle STOMP WebSocket subscriptions once room is joined
  useEffect(() => {
    if (!room?.roomCode || !currentUser?.id) return;

    const roomCode = room.roomCode.toUpperCase();
    const currentUserId = currentUser.id;
    const currentUserName = currentUser.name;

    stompService.connect(
      () => {
        stompReadyRef.current = true;
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

        // 2. Subscribe to drawing events (upsert)
        const unsubDraw = stompService.subscribe(`/topic/room/${roomCode}/draw`, (payload) => {
          if (payload?.element) {
            setElements((prev) => {
              const index = prev.findIndex((e) => e.id === payload.element.id);
              let next;
              if (index >= 0) {
                next = [...prev];
                next[index] = payload.element;
              } else {
                next = [...prev, payload.element];
              }
              whiteboardStorage.saveElements(roomCode, next);
              return next;
            });
          }
        });

        // 3. Subscribe to clear canvas event
        const unsubClear = stompService.subscribe(`/topic/room/${roomCode}/clear`, () => {
          setElements([]);
          whiteboardStorage.clearCanvas(roomCode);
        });

        // 4. Subscribe to element deletion event (Object Eraser)
        const unsubDelete = stompService.subscribe(`/topic/room/${roomCode}/delete-element`, (payload) => {
          if (payload?.elementId) {
            setElements((prev) => {
              const next = prev.filter((e) => e.id !== payload.elementId);
              whiteboardStorage.saveElements(roomCode, next);
              return next;
            });
          }
        });

        // 5. Handle late-joiner sync request (Host or Editor responds with local canvas elements)
        const unsubSyncReq = stompService.subscribe(`/topic/room/${roomCode}/sync-request`, (req) => {
          if (req?.requesterUserId && req.requesterUserId !== currentUserId) {
            const isEditor = currentUserRef.current?.role === 'HOST' || currentUserRef.current?.role === 'CAN_EDIT';
            if (isEditor && elementsRef.current && elementsRef.current.length > 0) {
              stompService.send('/app/room.sync-snapshot', {
                roomCode,
                targetUserId: req.requesterUserId,
                senderUserId: currentUserId,
                elements: elementsRef.current,
              });
            }
          }
        });

        // 6. Handle sync snapshot delivery for this client
        const unsubSyncSnap = stompService.subscribe(`/topic/room/${roomCode}/sync-snapshot`, (snapshot) => {
          if (snapshot?.targetUserId === currentUserId && Array.isArray(snapshot.elements)) {
            setElements(snapshot.elements);
            whiteboardStorage.saveElementsImmediate(roomCode, snapshot.elements);
          }
        });

        // 7. Subscribe to live remote cursors (filtered for Editors only)
        const unsubCursors = stompService.subscribe(`/topic/room/${roomCode}/cursors`, (cursorPayload) => {
          if (cursorPayload && cursorPayload.userId !== currentUserId) {
            setCursors((prev) => ({
              ...prev,
              [cursorPayload.userId]: cursorPayload,
            }));
          }
        });

        // 8. Subscribe to live room chat messages
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

        const unsubVideoStatus = stompService.subscribe(`/topic/room/${roomCode}/video-status`, (payload) => {
          const active = Boolean(payload?.active);
          setVideoActive(active);
          if (active) {
            videoDismissedRef.current = false;
          } else if (userRole !== 'HOST') {
            videoDismissedRef.current = false;
            setVideoOpen(false);
          }
        });

        // Notify server user joined once on connect
        stompService.send('/app/room.user-joined', {
          roomCode,
          userId: currentUserId,
          userName: currentUserName,
        });

        // Request peer state snapshot if our local browser storage has no cached elements
        whiteboardStorage.loadElements(roomCode).then((cached) => {
          if (!cached || cached.length === 0) {
            stompService.send('/app/room.sync-request', {
              roomCode,
              requesterUserId: currentUserId,
              requesterName: currentUserName,
            });
          }
        });

        if (userRole === 'HOST' && videoStartedRef.current) {
          stompService.send('/app/room.video-status', {
            roomCode,
            active: true,
          });
        }

        return () => {
          unsubUsers?.();
          unsubDraw?.();
          unsubClear?.();
          unsubDelete?.();
          unsubSyncReq?.();
          unsubSyncSnap?.();
          unsubCursors?.();
          unsubChat?.();
          unsubVideoStatus?.();
        };
      },
      () => {
        setError('Connection lost to real-time server.');
      }
    );

    return () => {
      stompReadyRef.current = false;
      stompService.disconnect();
    };
  }, [room?.roomCode, currentUser?.id, currentUser?.name, userRole]);

  useEffect(() => () => {
    videoStartedRef.current = false;
    videoDismissedRef.current = false;
    liveKitVideoService.leave();
  }, []);

  // Host starts or focuses video broadcast
  const startVideo = useCallback(async () => {
    if (!room?.roomCode || videoLoading) return;
    if (videoOpen) return;

    setVideoLoading(true);
    setVideoError('');
    try {
      const { data } = await axiosInstance.post(`/rooms/${room.roomCode}/video-call/join`);
      const joinedRoom = await liveKitVideoService.join({
        serverUrl: data.serverUrl,
        token: data.token,
        isHost: true,
        onVideoTrackSubscribed: (track) => setRemoteVideoTrack(track),
        onVideoTrackUnsubscribed: () => setRemoteVideoTrack(null),
        onDisconnect: () => {
          videoStartedRef.current = false;
          setVideoOpen(false);
        },
      });

      if (!joinedRoom) return;

      videoStartedRef.current = true;
      setVideoOpen(true);
      setVideoActive(true);
      if (stompReadyRef.current) {
        stompService.send('/app/room.video-status', {
          roomCode: room.roomCode,
          active: true,
        });
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setVideoError('This whiteboard room is no longer active. Rejoin with a new room code.');
      } else {
        const detail = err.response?.data?.message || err.message;
        setVideoError(detail ? `Could not start the video broadcast: ${detail}` : 'Could not start the video broadcast.');
      }
    } finally {
      setVideoLoading(false);
    }
  }, [room?.roomCode, videoLoading, videoOpen]);

  const closeVideo = useCallback(async () => {
    videoDismissedRef.current = true;
    videoStartedRef.current = false;
    await liveKitVideoService.leave();
    setRemoteVideoTrack(null);
    setVideoOpen(false);
    if (userRole === 'HOST' && room?.roomCode) {
      setVideoActive(false);
      if (stompReadyRef.current) {
        stompService.send('/app/room.video-status', {
          roomCode: room.roomCode,
          active: false,
        });
      }
    }
  }, [room?.roomCode, userRole]);

  // Viewer join for students / non-hosts
  const joinVideoAsViewer = useCallback(async () => {
    if (!room?.roomCode || videoStartedRef.current) return;
    try {
      const { data } = await axiosInstance.post(`/rooms/${room.roomCode}/video-call/join`);
      const joinedRoom = await liveKitVideoService.join({
        serverUrl: data.serverUrl,
        token: data.token,
        isHost: false,
        onVideoTrackSubscribed: (track) => setRemoteVideoTrack(track),
        onVideoTrackUnsubscribed: () => setRemoteVideoTrack(null),
        onDisconnect: () => {
          videoStartedRef.current = false;
          setVideoOpen(false);
        },
      });

      if (!joinedRoom) return;

      videoStartedRef.current = true;
      setVideoOpen(true);
    } catch (err) {
      console.warn('Could not connect to host video broadcast:', err);
    }
  }, [room?.roomCode]);

  const handleWatchVideo = useCallback(() => {
    videoDismissedRef.current = false;
    joinVideoAsViewer();
  }, [joinVideoAsViewer]);

  // Automatically connect viewers when host begins broadcasting
  useEffect(() => {
    if (userRole === 'HOST' || !room?.roomCode || !currentUser?.id) return;

    if (videoActive && !videoDismissedRef.current && !videoStartedRef.current) {
      joinVideoAsViewer();
    } else if (!videoActive && videoStartedRef.current) {
      videoStartedRef.current = false;
      liveKitVideoService.leave();
      setRemoteVideoTrack(null);
      setVideoOpen(false);
    }
  }, [videoActive, userRole, room?.roomCode, currentUser?.id, joinVideoAsViewer]);

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

        const normalizedCode = codeToJoin.trim().toUpperCase();
        const localCached = await whiteboardStorage.loadElements(normalizedCode);
        if (localCached && localCached.length > 0) {
          setElements(localCached);
        } else {
          setElements(data.elements || []);
          if (data.elements && data.elements.length > 0) {
            whiteboardStorage.saveElementsImmediate(normalizedCode, data.elements);
          }
        }

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
      handleExit();
    }
  }, [room, location.state, location.search, handleJoinRoom, handleExit]);

  // Dispatch new or updated drawing element locally, persist to IndexedDB, and relay via WebSocket
  const handleAddElement = useCallback(
    (newElement) => {
      if (!canEdit || !room || !currentUser) return;

      setElements((prev) => {
        const index = prev.findIndex((e) => e.id === newElement.id);
        let next;
        if (index >= 0) {
          next = [...prev];
          next[index] = newElement;
        } else {
          next = [...prev, newElement];
        }
        whiteboardStorage.saveElements(room.roomCode, next);
        return next;
      });

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

      setElements((prev) => {
        const next = prev.filter((e) => e.id !== elementId);
        whiteboardStorage.saveElements(room.roomCode, next);
        return next;
      });

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
    whiteboardStorage.clearCanvas(room.roomCode);

    stompService.send('/app/room.clear', {
      roomCode: room.roomCode,
      userId: currentUser.id,
    });
  }, [canEdit, room, currentUser]);

  // Export canvas as local JSON file
  const handleExportCanvas = useCallback(() => {
    if (!room?.roomCode) return;
    whiteboardStorage.exportCanvasAsJson(room.roomCode, elementsRef.current);
  }, [room?.roomCode]);

  // Import canvas from local JSON file
  const handleImportCanvas = useCallback(
    async (file) => {
      if (!canEdit || !room?.roomCode) return;
      try {
        const importedElements = await whiteboardStorage.importCanvasFromJson(file);
        setElements(importedElements);
        whiteboardStorage.saveElementsImmediate(room.roomCode, importedElements);
        if (stompReadyRef.current) {
          stompService.send('/app/room.sync-snapshot', {
            roomCode: room.roomCode,
            targetUserId: currentUser?.id,
            senderUserId: currentUser?.id,
            elements: importedElements,
          });
        }
      } catch (err) {
        alert(err.message || 'Failed to import canvas file.');
      }
    },
    [canEdit, room?.roomCode, currentUser?.id]
  );

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
        <AudioCallControl
          roomCode={room.roomCode}
          isHost={userRole === 'HOST'}
          videoOpen={videoOpen}
          videoLoading={videoLoading}
          onToggleVideo={startVideo}
          videoActive={videoActive}
          onWatchVideo={handleWatchVideo}
        />

        {videoOpen && (
          <FloatingVideoWindow
            isHost={userRole === 'HOST'}
            hostName={participants.find((participant) => participant.role === 'HOST')?.name}
            onClose={closeVideo}
            remoteVideoTrack={remoteVideoTrack}
          />
        )}

        {videoError && (
          <p role="alert" className="absolute bottom-4 left-6 z-40 max-w-xs rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 shadow-lg">
            {videoError}
          </p>
        )}

        <Toolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          color={color}
          setColor={setColor}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
          onClearCanvas={handleClearCanvas}
          onExportCanvas={handleExportCanvas}
          onImportCanvas={canEdit ? handleImportCanvas : undefined}
          onResetView={handleResetView}
          onOpenShortcuts={() => setShowShortcuts(true)}
          scale={scale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          canEdit={canEdit}
        />

        <LiveCursors
          cursors={cursors}
          currentUserId={currentUser?.id}
          stagePos={stagePos}
          scale={scale}
        />

        <WhiteboardCanvas
          elements={elements}
          onAddElement={handleAddElement}
          onDeleteElement={handleDeleteElement}
          onCursorMove={handleCursorMove}
          activeTool={activeTool}
          color={color}
          strokeWidth={strokeWidth}
          canEdit={canEdit}
          stagePos={stagePos}
          setStagePos={setStagePos}
          scale={scale}
          setScale={setScale}
        />

        {/* Bottom Floating Keyboard Hints Bar */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-slate-200/90 flex items-center gap-3 text-xs font-semibold text-slate-600 select-none hidden sm:flex">
          <div className="flex items-center gap-1.5" title="Hold space and drag to pan">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px] text-slate-700 shadow-2xs">Space</kbd>
            <span>+ Drag Pan</span>
          </div>
          <div className="w-px h-3 bg-slate-200" />
          <div className="flex items-center gap-1.5" title="Swipe trackpad or scroll mouse wheel to pan">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px] text-slate-700 shadow-2xs">Scroll</kbd>
            <span>Pan</span>
          </div>
          <div className="w-px h-3 bg-slate-200" />
          <button
            onClick={handleResetView}
            className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-pointer"
            title="Reset pan & zoom to center (0)"
          >
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px] text-slate-700 shadow-2xs">0</kbd>
            <span>Reset View</span>
          </button>
          <div className="w-px h-3 bg-slate-200" />
          <button
            onClick={() => setShowShortcuts(true)}
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold transition-colors cursor-pointer"
            title="View all keyboard shortcuts (?)"
          >
            <kbd className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 font-mono text-[10px] text-indigo-600 shadow-2xs">?</kbd>
            <span>All Shortcuts</span>
          </button>
        </div>

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

        <KeyboardShortcutsModal
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />
      </main>
    </div>
  );
}

