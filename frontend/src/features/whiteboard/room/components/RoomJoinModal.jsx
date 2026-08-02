import React, { useState } from 'react';
import { Sparkles, LogIn, PlusCircle, User, Hash, AlertCircle, ArrowRight } from 'lucide-react';

export default function RoomJoinModal({ onCreateRoom, onJoinRoom, error, loading }) {
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'join'
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (activeTab === 'create') {
      onCreateRoom(name.trim());
    } else {
      if (!roomCode.trim()) return;
      onJoinRoom(roomCode.trim().toUpperCase(), name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Welcome to OneClass Whiteboard</h2>
          <p className="text-xs text-slate-500 mt-1">Real-time collaborative classroom studio</p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-5 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'create'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" /> Create Room
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'join'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-4 h-4 text-indigo-600" /> Join Room
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" /> Your Display Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Connor"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          {activeTab === 'join' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-600" /> Room Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. X9K2M4"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 uppercase tracking-widest font-mono text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
              />
              <p className="text-[11px] text-sky-600 mt-1 flex items-center gap-1 font-medium">
                * Note: Joining users enter in View-Only Watcher mode by default.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || (activeTab === 'join' && !roomCode.trim())}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span>Connecting...</span>
            ) : (
              <>
                <span>{activeTab === 'create' ? 'Launch New Room' : 'Join Board'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
