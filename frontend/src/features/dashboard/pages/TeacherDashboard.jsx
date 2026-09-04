import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../common/context/AuthContext';
import { Presentation, LogOut, Users, BookOpen, Sparkles } from 'lucide-react';

export default function TeacherDashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleStartClassroom = () => {
    navigate('/whiteboard');
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
          <div className="relative z-10 max-w-2xl space-y-4">
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
            <div className="pt-2 flex flex-wrap gap-4">
              <button
                onClick={handleStartClassroom}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-500/25 transition-all transform hover:scale-[1.02] flex items-center gap-2.5"
              >
                <Presentation className="w-5 h-5" />
                <span>Launch Interactive Whiteboard</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Collaborative Whiteboard */}
          <div
            onClick={handleStartClassroom}
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
              <span>Open Classroom</span> &rarr;
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
