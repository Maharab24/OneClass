import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  ChevronRight,
  Sparkles,
  Crown,
  Edit3,
  Eye,
  Info
} from 'lucide-react';

const QUICK_REACTIONS = ['👍', '❤️', '👏', '💡', '🙋‍♂️', '🔥', '🎉'];

export default function FloatingChatWidget({
  messages = [],
  currentUserId,
  onSendMessage,
  unreadCount = 0,
  onResetUnread,
  isOpen,
  setIsOpen
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened and reset unread count
  useEffect(() => {
    if (isOpen) {
      onResetUnread?.();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, onResetUnread]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    onSendMessage(text, 'CHAT');
    setInputText('');
  };

  const handleQuickReaction = (emoji) => {
    onSendMessage(emoji, 'REACTION');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderRoleBadge = (role) => {
    switch (role) {
      case 'HOST':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Crown className="w-2.5 h-2.5 text-amber-500" /> Host
          </span>
        );
      case 'CAN_EDIT':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Edit3 className="w-2.5 h-2.5 text-emerald-500" /> Editor
          </span>
        );
      case 'CAN_WATCH':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Eye className="w-2.5 h-2.5 text-sky-500" /> Watcher
          </span>
        );
    }
  };

  return (
    <>
      {/* 1. Vertically Centered Collapsed Floating Trigger Tab */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 bg-gradient-to-b from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white pl-2.5 pr-2 py-3.5 rounded-l-2xl shadow-xl hover:-translate-x-1 transition-all duration-200 cursor-pointer group border-y border-l border-indigo-400/30"
          title="Open Live Chat"
          aria-label="Open Live Chat"
        >
          {/* Animated unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-2 -left-2 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-rose-500 text-[10px] font-extrabold text-white shadow-md">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}

          <div className="relative">
            <MessageSquare className="w-5 h-5 transition-transform group-hover:scale-110" />
          </div>

          <span
            className="text-[11px] font-extrabold tracking-wider uppercase text-indigo-100 select-none"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            Chat
          </span>
        </button>
      )}

      {/* 2. Expanded Floating Chat Window */}
      {isOpen && (
        <div
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 w-80 sm:w-92 md:w-96 h-[540px] max-h-[82vh] bg-white rounded-l-2xl shadow-2xl border-y border-l border-slate-200/90 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 ease-out"
          style={{ boxShadow: '-8px 0 25px -5px rgba(0, 0, 0, 0.12), -4px 0 10px -6px rgba(0, 0, 0, 0.08)' }}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-indigo-300" />
              </div>
              <div>
                <h2 className="font-bold text-xs text-white tracking-tight flex items-center gap-1.5">
                  Live Classroom Chat
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                </h2>
                <p className="text-[10px] text-slate-300 font-medium">
                  {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1 text-xs"
              title="Minimize chat"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-2.5">
                  <MessageSquare className="w-6 h-6 text-indigo-400" />
                </div>
                <p className="text-xs font-semibold text-slate-700 mb-1">
                  No messages yet
                </p>
                <p className="text-[11px] text-slate-400 max-w-[200px]">
                  Say hello or ask questions! Everyone in this room can participate.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isSelf = msg.senderId === currentUserId;
                const isSystem = msg.type === 'SYSTEM';
                const isReaction = msg.type === 'REACTION';

                // Render system messages
                if (isSystem) {
                  return (
                    <div key={msg.id || Math.random()} className="flex justify-center my-2 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-3 py-1 rounded-full bg-indigo-50/80 border border-indigo-100/90 text-indigo-900 text-[11px] font-medium flex items-center gap-1.5 shadow-2xs">
                        <Info className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                        <span>{msg.content}</span>
                      </div>
                    </div>
                  );
                }

                // Self Message
                if (isSelf) {
                  return (
                    <div
                      key={msg.id || Math.random()}
                      className="flex flex-col items-end gap-1 animate-in fade-in slide-in-from-bottom-1 duration-150"
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mr-1">
                        <span className="font-semibold text-slate-600">You</span>
                        <span>•</span>
                        <span>{formatTime(msg.timestamp)}</span>
                      </div>
                      <div
                        className={`max-w-[85%] px-3.5 py-2 rounded-2xl rounded-tr-xs text-xs break-words shadow-sm ${
                          isReaction
                            ? 'bg-transparent text-3xl py-1 px-1 shadow-none'
                            : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-normal leading-relaxed'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                // Others' Message
                return (
                  <div
                    key={msg.id || Math.random()}
                    className="flex flex-col items-start gap-1 animate-in fade-in slide-in-from-bottom-1 duration-150"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] ml-1">
                      {/* Sender Avatar Dot */}
                      <div
                        className="w-2.5 h-2.5 rounded-full ring-1 ring-white shadow-2xs flex-shrink-0"
                        style={{ backgroundColor: msg.senderColor || '#6366f1' }}
                      />
                      <span className="font-bold text-slate-800 truncate max-w-[110px]">
                        {msg.senderName}
                      </span>
                      {renderRoleBadge(msg.senderRole)}
                      <span className="text-slate-400 text-[9px]">•</span>
                      <span className="text-slate-400 text-[9px]">{formatTime(msg.timestamp)}</span>
                    </div>

                    <div
                      className={`max-w-[85%] px-3.5 py-2 rounded-2xl rounded-tl-xs text-xs break-words shadow-2xs border ${
                        isReaction
                          ? 'bg-transparent text-3xl py-1 px-1 shadow-none border-none'
                          : 'bg-white text-slate-800 border-slate-200/80 font-normal leading-relaxed'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reaction Bar */}
          <div className="px-3 py-1.5 bg-slate-100/90 border-t border-slate-200/70 flex items-center justify-between gap-1 overflow-x-auto">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0">
              React:
            </span>
            <div className="flex items-center gap-1">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleQuickReaction(emoji)}
                  className="hover:scale-125 active:scale-95 transition-transform p-1 text-sm rounded hover:bg-white/80 cursor-pointer"
                  title={`React ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={handleSend}
            className="p-2.5 bg-white border-t border-slate-200/90 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or chat..."
              maxLength={500}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

