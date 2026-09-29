import React from 'react';
import { X, Command, Move, Pencil, Eraser, Square, Circle, Minus, Type, HelpCircle, RotateCcw } from 'lucide-react';

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const categories = [
    {
      title: 'Canvas Navigation & Pan',
      items: [
        { label: 'Pan canvas', keys: ['Space', 'Drag'] },
        { label: 'Pan with mouse', keys: ['Middle Click', 'Drag'] },
        { label: 'Pan horizontally & vertically', keys: ['Trackpad', 'Scroll'] },
        { label: 'Zoom in / out', keys: ['Ctrl / ⌘', 'Scroll'] },
        { label: 'Reset view to origin', keys: ['0'] },
      ],
    },
    {
      title: 'Drawing & Creation Tools',
      items: [
        { label: 'Hand / Pan tool', keys: ['H'], icon: Move },
        { label: 'Brush / Pencil', keys: ['B'], icon: Pencil },
        { label: 'Object Eraser', keys: ['E'], icon: Eraser },
        { label: 'Rectangle', keys: ['R'], icon: Square },
        { label: 'Circle', keys: ['C'], icon: Circle },
        { label: 'Line', keys: ['L'], icon: Minus },
        { label: 'Text tool', keys: ['T'], icon: Type },
      ],
    },
    {
      title: 'Modern In-Place Text Entry',
      items: [
        { label: 'Start typing on canvas', keys: ['Click'] },
        { label: 'Edit existing text', keys: ['Double-Click'] },
        { label: 'Commit & place text', keys: ['Enter'] },
        { label: 'Insert line break', keys: ['Shift', 'Enter'] },
        { label: 'Cancel / Finish editing', keys: ['Esc'] },
      ],
    },
    {
      title: 'General Shortcuts',
      items: [
        { label: 'Toggle this shortcuts cheatsheet', keys: ['?'] },
        { label: 'Dismiss dialog / Cancel current tool', keys: ['Esc'] },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
              <Command className="w-4 h-4" />
            </div>
            <div>
              <h2 id="shortcuts-title" className="text-base font-bold text-slate-900 leading-tight">
                Whiteboard Keyboard Shortcuts
              </h2>
              <p className="text-xs text-slate-500">Standard controls for fast and fluid whiteboarding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts Categories */}
        <div className="p-6 overflow-y-auto space-y-6">
          {categories.map((category) => (
            <div key={category.title}>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                {category.title}
              </h3>
              <div className="bg-slate-50/80 rounded-2xl p-2.5 space-y-1.5 border border-slate-100">
                {category.items.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5 px-3 rounded-xl hover:bg-white transition-colors"
                    >
                      <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                        {Icon && <Icon className="w-3.5 h-3.5 text-indigo-600" />}
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.keys.map((k, kIdx) => (
                          <React.Fragment key={kIdx}>
                            <kbd className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono text-[11px] font-bold shadow-xs">
                              {k}
                            </kbd>
                            {kIdx < item.keys.length - 1 && (
                              <span className="text-slate-400 text-xs">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-bold shadow-2xs">Space</kbd> anytime to pan.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
