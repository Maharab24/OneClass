import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Minus,
  Maximize2,
  GripHorizontal,
  User,
  Radio,
  X,
} from 'lucide-react';
import { liveKitVideoService } from '../services/liveKitVideoService';

export default function FloatingVideoWindow({
  isHost,
  hostName,
  onClose,
  remoteVideoTrack,
}) {
  const [minimized, setMinimized] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);

  // Position state (starting in bottom-left corner with standard size)
  // Window width: 320, height: 230
  const [position, setPosition] = useState(() => ({
    x: 24,
    y: Math.max(60, window.innerHeight - 270),
  }));

  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const videoRef = useRef(null);

  // Keep window in bounds on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.max(12, Math.min(prev.x, Math.max(12, window.innerWidth - 336))),
        y: Math.max(60, Math.min(prev.y, Math.max(60, window.innerHeight - 270))),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Attach video track
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isHost) {
      if (cameraEnabled) {
        liveKitVideoService.attachLocalVideo(videoEl);
      }
    } else if (remoteVideoTrack) {
      remoteVideoTrack.attach(videoEl);
      return () => {
        remoteVideoTrack.detach(videoEl);
      };
    }
  }, [isHost, cameraEnabled, remoteVideoTrack]);

  // Drag handlers
  const handleMouseDown = useCallback((e) => {
    // Only drag when clicking the header
    if (e.target.closest('button')) return;

    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };

    const handleMouseMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const newX = Math.max(8, Math.min(moveEvent.clientX - dragOffsetRef.current.x, Math.max(8, window.innerWidth - 336)));
      const newY = Math.max(50, Math.min(moveEvent.clientY - dragOffsetRef.current.y, Math.max(50, window.innerHeight - (minimized ? 60 : 270))));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [position.x, position.y, minimized]);

  const toggleCamera = async () => {
    if (!isHost) return;
    const nextState = !cameraEnabled;
    try {
      await liveKitVideoService.setCameraEnabled(nextState, videoRef.current);
      setCameraEnabled(nextState);
    } catch (err) {
      console.error('Failed to toggle camera:', err);
    }
  };

  const toggleMic = async () => {
    if (!isHost) return;
    const nextState = !micEnabled;
    try {
      await liveKitVideoService.setMicrophoneEnabled(nextState);
      setMicEnabled(nextState);
    } catch (err) {
      console.error('Failed to toggle microphone:', err);
    }
  };

  const handleRestore = () => {
    setPosition((prev) => ({
      ...prev,
      y: Math.min(prev.y, Math.max(60, window.innerHeight - 270)),
    }));
    setMinimized(false);
  };

  if (minimized) {
    return (
      <div
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        onMouseDown={handleMouseDown}
        className="fixed z-40 flex cursor-move items-center gap-2 rounded-full border border-indigo-500/30 bg-slate-900/95 px-3.5 py-2 text-white shadow-2xl backdrop-blur select-none transition-shadow hover:shadow-indigo-500/20"
      >
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-xs font-semibold tracking-wide text-slate-200">
          {isHost ? 'Your Video (Live)' : `${hostName || 'Host'} (Live)`}
        </span>
        <button
          type="button"
          onClick={handleRestore}
          className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          title="Restore Video Window"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        {isHost && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-900/40 text-rose-300 hover:bg-rose-700 hover:text-white"
            title="End Video Call"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-40 w-80 rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl backdrop-blur select-none overflow-hidden transition-shadow hover:shadow-indigo-500/10 flex flex-col font-sans"
    >
      {/* Header bar (Draggable) */}
      <div
        onMouseDown={handleMouseDown}
        className="flex cursor-move items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700/50"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-3.5 w-3.5 text-slate-400" />
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {isHost ? 'Host Video' : `${hostName || 'Host'}'s Video`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            title="Minimize Window"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-rose-600/30 hover:text-rose-300 transition-colors"
            title={isHost ? 'End Video Call' : 'Close Video Window'}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Video preview or avatar surface */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Video stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isHost} // Mute local host preview to prevent feedback loop
          className={`h-full w-full object-cover ${isHost ? '-scale-x-100' : ''}`}
        />

        {/* Fallback avatar when camera is off */}
        {((isHost && !cameraEnabled) || (!isHost && !remoteVideoTrack)) && (
          <div className="absolute inset-0 z-10 bg-slate-950 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <User className="h-7 w-7" />
            </div>
            <p className="text-xs font-medium text-slate-400">
              {isHost ? 'Your camera is turned off' : `${hostName || 'Host'} video is currently paused`}
            </p>
          </div>
        )}

        {/* Live indicator badge overlay */}
        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-rose-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow backdrop-blur">
          <Radio className="h-3 w-3 animate-pulse" />
          <span>LIVE</span>
        </div>
      </div>

      {/* Host media controls */}
      {isHost ? (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleCamera}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                cameraEnabled
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                  : 'bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30'
              }`}
              title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={toggleMic}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                micEnabled
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30'
              }`}
              title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition-colors shadow-sm"
            title="End Video Broadcast"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            <span>End Call</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400">
          <span>Watching {hostName || 'Host'}&apos;s stream</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Connected
          </span>
        </div>
      )}
    </div>
  );
}

