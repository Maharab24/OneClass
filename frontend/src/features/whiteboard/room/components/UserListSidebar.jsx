import React from 'react';
import { X, Users, Crown, Edit3, Eye, ShieldCheck, UserCheck } from 'lucide-react';

export default function UserListSidebar({ isOpen, onClose, participants, currentUserId, isHost, onRoleChange }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-slate-200 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-slate-900 text-sm">Room Participants</h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
            {participants.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {participants.map((user) => {
          const isSelf = user.id === currentUserId;
          const userIsHost = user.role === 'HOST';
          const canEdit = user.role === 'CAN_EDIT';

          return (
            <div
              key={user.id}
              className="p-3 rounded-xl flex items-center justify-between gap-3 border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-all shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* User color avatar */}
                <div
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                  style={{ backgroundColor: user.color || '#3b82f6' }}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-slate-800 truncate">
                      {user.name}
                    </span>
                    {isSelf && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-bold">
                        You
                      </span>
                    )}
                  </div>

                  {/* Role subtitle */}
                  <div className="flex items-center gap-1 mt-0.5 text-[11px]">
                    {userIsHost ? (
                      <span className="text-amber-700 font-bold flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-500" /> Host
                      </span>
                    ) : canEdit ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Edit3 className="w-3 h-3 text-emerald-500" /> Editor
                      </span>
                    ) : (
                      <span className="text-sky-700 font-semibold flex items-center gap-1">
                        <Eye className="w-3 h-3 text-sky-500" /> Watcher
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Host Permission Controls */}
              {isHost && !userIsHost && !isSelf && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {canEdit ? (
                    <button
                      onClick={() => onRoleChange(user.id, 'CAN_WATCH')}
                      className="px-2 py-1 rounded-md bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-[11px] font-bold transition-colors flex items-center gap-1"
                      title="Make View Only"
                    >
                      <Eye className="w-3 h-3" /> Make Watcher
                    </button>
                  ) : (
                    <button
                      onClick={() => onRoleChange(user.id, 'CAN_EDIT')}
                      className="px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-bold transition-colors flex items-center gap-1"
                      title="Grant Edit Permissions"
                    >
                      <UserCheck className="w-3 h-3" /> Make Editor
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 text-xs text-slate-500 bg-slate-50">
        <p className="flex items-center gap-1.5 text-[11px] font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Hosts can dynamically change participant roles in real-time.</span>
        </p>
      </div>
    </div>
  );
}
