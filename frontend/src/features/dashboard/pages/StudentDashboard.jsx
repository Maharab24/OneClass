import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../common/context/AuthContext';
import axiosInstance from '../../../common/api/axiosInstance';
import { Presentation, LogOut, ArrowRight, Sparkles, BookOpen, AlertCircle, Loader2 } from 'lucide-react';

export default function StudentDashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);

  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleJoinDirect = async (e) => {
    e.preventDefault();
    if (!roomCode.trim()) return;

    setIsJoining(true);
    setJoinError(null);
    try {
      const res = await axiosInstance.post('/rooms/join', {
        roomCode: roomCode.trim().toUpperCase(),
        userName: auth?.fullName,
        requestedRole: 'CAN_WATCH',
      });
      navigate('/whiteboard', {
        state: {
          room: res.data,
          currentUser: res.data.currentUser,
        },
      });
    } catch (err) {
      const msg = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Room not found or unable to join.';
      setJoinError(msg);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateStudyBoard = async () => {
    setIsCreating(true);
    setCreateError(null);
    try {
      const res = await axiosInstance.post('/rooms/create', {
        hostName: auth?.fullName,
      });
      navigate('/whiteboard', {
        state: {
          room: res.data,
          currentUser: res.data.currentUser,
        },
      });
    } catch (err) {
      setCreateError(err.response?.data?.message || err.message || 'Failed to create study board.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20">
            1C
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">OneClass</h1>
            <span className="text-xs text-purple-400 font-medium uppercase tracking-wider">Student Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">{auth?.fullName || 'Student'}</p>
            <p className="text-xs text-slate-400">{auth?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-slate-300 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* Welcome Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600/30 via-indigo-600/20 to-blue-600/30 border border-white/10 p-8 md:p-10 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-xs font-semibold text-purple-300">
              <Sparkles className="w-3.5 h-3.5" />
              Student Learning Workspace
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">{auth?.fullName || 'Student'}</span>!
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Join your teacher's virtual classroom whiteboard session, view real-time lectures, collaborate with peers, and participate in classroom discussions.
            </p>

            {/* Quick Room Join Form */}
            <form onSubmit={handleJoinDirect} className="pt-4 flex flex-col sm:flex-row gap-3 max-w-md">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-char Room Code"
                maxLength={6}
                className="flex-1 px-4 py-3 bg-slate-800/80 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 tracking-wider uppercase font-mono text-center sm:text-left"
              />
              <button
                type="submit"
                disabled={isJoining || !roomCode.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-semibold text-sm shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <span>Join Board</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {joinError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2 max-w-md">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            {createError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2 max-w-md">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div
            onClick={handleCreateStudyBoard}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all cursor-pointer space-y-3"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Presentation className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Create Collaborative Study Board</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Launch your own collaborative whiteboard session to study, take notes, and share the room code with peers.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400">
              <span>{isCreating ? 'Creating Board...' : 'Launch Board'}</span> &rarr;
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Live Classroom Interaction</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Follow along as your teacher explains concepts in real-time. Chat and ask questions directly on the board.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
