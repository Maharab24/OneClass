import React, { useState } from 'react';
import { Copy, Check, Users, Eye, Edit3, Sparkles, LogOut } from 'lucide-react';

export default function Header({ roomCode, userRole, participantsCount, onToggleParticipants, onExit }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleBadge = () => {
    switch (userRole) {
      case 'HOST':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Host
          </span>
        );
      case 'CAN_EDIT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
            <Edit3 className="w-3.5 h-3.5 text-emerald-500" /> Editor
          </span>
        );
      case 'CAN_WATCH':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 shadow-sm">
            <Eye className="w-3.5 h-3.5 text-sky-500" /> View Only
          </span>
        );
    }
  };

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between relative z-20 shadow-xs">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
            OneClass Whiteboard
          </h1>
          <span className="text-[10px] uppercase tracking-wider text-indigo-600 font-bold block -mt-0.5">
            Realtime Canvas Studio
          </span>
        </div>
      </div>

      {/* Room Info & Status */}
      <div className="flex items-center gap-3">
        {roomCode && (
          <button
            onClick={handleCopyCode}
            className="light-button px-3.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold hover:border-slate-300"
            title="Click to copy Room Code"
          >
            <span className="text-slate-500">Room:</span>
            <span className="font-mono font-bold tracking-wider text-indigo-600 text-sm">
              {roomCode}
            </span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        )}

        {getRoleBadge()}

        {/* Participants Button */}
        <button
          onClick={onToggleParticipants}
          className="light-button px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold"
        >
          <Users className="w-4 h-4 text-indigo-600" />
          <span>People</span>
          <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold text-[11px] border border-indigo-100">
            {participantsCount || 1}
          </span>
        </button>

        {/* Exit / Return Button */}
        {onExit && (
          <button
            onClick={onExit}
            className="light-button px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            title="Return to Dashboard or Home"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Leave</span>
          </button>
        )}
      </div>
    </header>
  );
}
