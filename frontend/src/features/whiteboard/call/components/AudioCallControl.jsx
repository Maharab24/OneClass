import { useEffect, useState } from 'react';
import { LoaderCircle, Mic, MicOff, Phone, PhoneOff, UsersRound } from 'lucide-react';
import axiosInstance from '../../../../common/api/axiosInstance';
import { liveKitCallService } from '../services/liveKitCallService';

export default function AudioCallControl({ roomCode }) {
  const [status, setStatus] = useState('idle');
  const [muted, setMuted] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => () => {
    liveKitCallService.leave();
  }, []);

  const joinCall = async () => {
    if (!roomCode || status === 'joining') return;

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

  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-lg shadow-slate-900/10 backdrop-blur">
        {joined ? (
          <>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 text-xs font-semibold text-slate-600" title="People in audio call">
              <UsersRound className="h-3.5 w-3.5 text-indigo-600" />
              {participantCount}
            </span>
            <button
              type="button"
              onClick={toggleMute}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${muted ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
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
            {joining ? 'Joining' : 'Audio call'}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="max-w-64 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 shadow-sm">
          {error}
        </p>
      )}
    </div>
  );
}
