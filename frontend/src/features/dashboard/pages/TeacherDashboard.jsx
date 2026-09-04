import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../common/context/AuthContext';
import axiosInstance from '../../../common/api/axiosInstance';
import { Presentation, LogOut, Users, BookOpen, Sparkles, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function TeacherDashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCreateWhiteboard = async () => {
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
      setCreateError(err.response?.data?.message || err.message || 'Failed to create whiteboard room.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsJoining(true);
    setJoinError(null);
    try {
      const res = await axiosInstance.post('/rooms/join', {
        roomCode: joinCode.trim().toUpperCase(),
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

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            1C
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">OneClass</h1>
            <span className="text-xs text-blue-400 font-medium uppercase tracking-wider">Teacher Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">{auth?.fullName || 'Educator'}</p>
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
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600/30 via-indigo-600/20 to-purple-600/30 border border-white/10 p-8 md:p-10 shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-xs font-semibold text-blue-300">
              <Sparkles className="w-3.5 h-3.5" />
              Interactive Collaborative Suite
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">{auth?.fullName || 'Teacher'}</span>!
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Launch real-time collaborative whiteboards, invite students with dynamic room codes, manage editing permissions, and communicate through live room chat.
            </p>

            {createError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2 max-w-md">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {/* Actions: Direct Create & Direct Join */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={handleCreateWhiteboard}
                disabled={isCreating}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Classroom...</span>
                  </>
                ) : (
                  <>
                    <Presentation className="w-5 h-5" />
                    <span>Launch New Whiteboard</span>
                  </>
                )}
              </button>

              {/* Quick Join via Code Form */}
              <form onSubmit={handleJoinByCode} className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-char Code"
                  maxLength={6}
                  className="w-44 px-3.5 py-3 bg-slate-800/80 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 tracking-wider uppercase font-mono text-center text-sm"
                />
                <button
                  type="submit"
                  disabled={isJoining || !joinCode.trim()}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isJoining ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Join</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {joinError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2 max-w-md">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{joinError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Collaborative Whiteboard */}
          <div
            onClick={handleCreateWhiteboard}
            className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all cursor-pointer space-y-4 shadow-lg"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Presentation className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Interactive Whiteboard</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Draw freehand, add geometric shapes, straight lines, sticky text notes, and use the smart object eraser.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 group-hover:text-blue-300">
              <span>{isCreating ? 'Creating Room...' : 'Start Session'}</span> &rarr;
            </div>
          </div>

          {/* Card 2: Student Management */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Role &amp; Permission Control</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Maintain administrative control as Room Host. Grant editing privileges or lock participant canvases in watch-only mode.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400">
              <span>Host Managed</span>
            </div>
          </div>

          {/* Card 3: Real-Time Chat & Cursors */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Live Collaboration &amp; Chat</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Real-time remote cursor presence labeled with names and instant collaborative floating chat widget.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <span>Instant Sync</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
