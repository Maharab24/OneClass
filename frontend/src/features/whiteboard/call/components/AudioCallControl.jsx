import { useEffect, useState } from 'react';
import { LoaderCircle, Mic, MicOff, Phone, PhoneOff, UsersRound, Video } from 'lucide-react';
import axiosInstance from '../../../../common/api/axiosInstance';
import { liveKitCallService } from '../services/liveKitCallService';

export default function AudioCallControl({
  roomCode,
  isHost = false,
  videoOpen = false,
  videoLoading = false,
  onToggleVideo,
  videoActive = false,
  onWatchVideo,
}) {
  const [status, setStatus] = useState('idle');
  const [muted, setMuted] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);
  const [error, setError] = useState('');

  // Video call implicitly includes audio tracks.
  // Video is considered running if host has video window open, or if room has active video broadcast.
  const isVideoRunning = isHost ? videoOpen : (videoActive || videoOpen);

  useEffect(() => () => {
    liveKitCallService.leave();
  }, []);

  // When a video call starts / is running, automatically leave any standalone audio call
  // to prevent dual-call audio echo, mic conflicts, or leftover state.
  useEffect(() => {
    if (isVideoRunning && (status === 'joined' || status === 'joining')) {
      liveKitCallService.leave();
      setParticipantCount(0);
      setMuted(true);
      setStatus('idle');
    }
  }, [isVideoRunning, status]);

  const joinCall = async () => {
    if (!roomCode || status === 'joining' || isVideoRunning) return;

    setStatus('joining');
    setError('');
    try {
      const { data } = await axiosInstance.post(`/rooms/${roomCode}/audio-call/join`);
      await liveKitCallService.join({
        serverUrl: data.serverUrl,
        token: data.token,
        onParticipantCountChange: setParticipantCount,
      });
      setMuted(true);
      setStatus('joined');
    } catch (err) {
      await liveKitCallService.leave();
      setStatus('idle');
      setError(err.response?.data?.message || 'Could not join the audio call.');
    }
  };

  const toggleMute = async () => {
    const nextMuted = !muted;
    try {
      await liveKitCallService.setMuted(nextMuted);
      setMuted(nextMuted);
    } catch {
      setError('Could not update microphone state.');
    }
  };

  const leaveCall = async () => {
    setStatus('leaving');
    try {
      await liveKitCallService.leave();
      setParticipantCount(0);
      setMuted(true);
      setError('');
    } finally {
      setStatus('idle');
    }
  };

  const joining = status === 'joining';
  const joined = status === 'joined';

  // Determine what buttons to render
  const showHostVideoButton = isHost;
  const showWatchVideoButton = !isHost && videoActive && !videoOpen;
  const showAudioCallControls = !isVideoRunning;

  const hasControls = showHostVideoButton || showWatchVideoButton || showAudioCallControls;

  if (!hasControls && !error) {
    return null;
  }

  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2 select-none">
      {hasControls && (
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-lg shadow-slate-900/10 backdrop-blur">
          {/* Host Video Call Control */}
          {showHostVideoButton && (
            <button
              type="button"
              onClick={onToggleVideo}
              disabled={videoLoading}
              className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all shadow-sm ${
                videoOpen
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              } disabled:cursor-not-allowed disabled:opacity-70`}
              aria-label={videoOpen ? 'Host Video is Live' : 'Start Video Call'}
              title={videoOpen ? 'Host Video is Live (Audio & Video Included)' : 'Start Video Call'}
            >
              {videoLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : videoOpen ? (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
              ) : (
                <Video className="h-4 w-4" />
              )}
              <span>{videoOpen ? 'Video Live' : videoLoading ? 'Starting' : 'Video call'}</span>
            </button>
          )}

          {/* Student Watch Video Control (if Host is broadcasting and Student closed the floating window) */}
          {showWatchVideoButton && (
            <button
              type="button"
              onClick={onWatchVideo}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              aria-label="Watch Host Video"
              title="Watch Host Video Broadcast (Audio & Video Included)"
            >
              <Video className="h-4 w-4" />
              <span>Watch Video</span>
            </button>
          )}

          {/* Divider between Video and Audio call button (only shown when both buttons exist) */}
          {showAudioCallControls && (showHostVideoButton || showWatchVideoButton) && (
            <div className="h-4 w-px bg-slate-200 mx-0.5" />
          )}

          {/* Standalone Audio Call Controls (only rendered when NO video call is active) */}
          {showAudioCallControls && (
            joined ? (
              <>
                <span
                  className="hidden sm:inline-flex items-center gap-1 px-2 text-xs font-semibold text-slate-600"
                  title="People in audio call"
                >
                  <UsersRound className="h-3.5 w-3.5 text-indigo-600" />
                  {participantCount}
                </span>
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                    muted
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
                  aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
                  title={muted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={leaveCall}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700 transition-colors hover:bg-rose-200"
                  aria-label="Leave audio call"
                  title="Leave audio call"
                >
                  <PhoneOff className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={joinCall}
                disabled={joining || status === 'leaving'}
                className="flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                aria-label="Join audio call"
              >
                {joining ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                <span>{joining ? 'Joining' : 'Audio call'}</span>
              </button>
            )
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="max-w-64 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 shadow-sm">
          {error}
        </p>
      )}
    </div>
  );
}

