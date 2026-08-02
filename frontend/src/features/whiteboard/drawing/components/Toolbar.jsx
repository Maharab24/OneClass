import React from 'react';
import {
  Pencil,
  Eraser,
  Square,
  Circle as CircleIcon,
  Minus,
  Type,
  Trash2,
  Lock,
  Palette,
  Pipette
} from 'lucide-react';

const TOOLS = [
  { id: 'brush', label: 'Brush', icon: Pencil },
  { id: 'eraser', label: 'Eraser', icon: Eraser },
  { id: 'rectangle', label: 'Rectangle', icon: Square },
  { id: 'circle', label: 'Circle', icon: CircleIcon },
  { id: 'line', label: 'Line', icon: Minus },
  { id: 'text', label: 'Text', icon: Type },
];

const PRESET_COLORS = [
  { hex: '#1e293b', label: 'Dark' },
  { hex: '#4f46e5', label: 'Indigo' },
  { hex: '#ef4444', label: 'Red' },
  { hex: '#f59e0b', label: 'Amber' },
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#0284c7', label: 'Sky' },
  { hex: '#8b5cf6', label: 'Violet' },
  { hex: '#ec4899', label: 'Pink' },
];

const STROKE_WIDTHS = [2, 4, 8, 14];

export default function Toolbar({
  activeTool,
  setActiveTool,
  color,
  setColor,
  strokeWidth,
  setStrokeWidth,
  onClearCanvas,
  canEdit
}) {
  if (!canEdit) {
    return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl flex items-center gap-2 border border-sky-200 text-sky-800 shadow-lg">
        <Lock className="w-4 h-4 text-sky-600" />
        <span className="text-xs font-bold">You are in Watcher (View Only) mode. Toolbar is locked.</span>
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-3">
      {/* Primary Tool Dock */}
      <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl flex flex-col gap-1 shadow-xl border border-slate-200/90 w-44">
        <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 px-2.5 py-1">
          Tools
        </div>

        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{tool.label}</span>
            </button>
          );
        })}

        <hr className="border-slate-100 my-1" />

        {/* Clear Board */}
        <button
          onClick={onClearCanvas}
          className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all"
        >
          <Trash2 className="w-4 h-4 flex-shrink-0" />
          <span>Clear Board</span>
        </button>
      </div>

      {/* Colors & Thickness Palette with Custom Color Swatch Picker */}
      <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl flex flex-col gap-3 shadow-xl border border-slate-200/90 w-44">
        {/* Colors Section */}
        <div>
          <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Palette className="w-3 h-3 text-indigo-600" /> Color Swatch
            </span>
            {/* Custom Color Input Swatch */}
            <label className="relative cursor-pointer flex items-center justify-center" title="Pick Custom Color">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
              <Pipette className="w-3.5 h-3.5 text-indigo-600 hover:scale-110 transition-transform" />
            </label>
          </div>

          {/* Preset Swatches */}
          <div className="grid grid-cols-4 gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => setColor(c.hex)}
                className={`w-7 h-7 rounded-full border border-slate-200 transition-transform shadow-xs flex items-center justify-center ${
                  color.toLowerCase() === c.hex.toLowerCase() ? 'scale-110 ring-2 ring-indigo-600 ring-offset-1' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.label}
              />
            ))}
          </div>

          {/* Active Custom Color Indicator */}
          <div className="mt-2 flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <div
              className="w-4 h-4 rounded-full border border-slate-300 shadow-xs"
              style={{ backgroundColor: color }}
            />
            <span className="text-[11px] font-mono font-bold text-slate-600 uppercase">
              {color}
            </span>
          </div>
        </div>

        {/* Thickness Selector */}
        <div>
          <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mb-1.5">Stroke Size</div>
          <div className="flex items-center justify-between gap-1 bg-slate-100 p-1 rounded-xl">
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w}
                onClick={() => setStrokeWidth(w)}
                className={`flex-1 py-1 rounded-lg flex items-center justify-center transition-colors ${
                  strokeWidth === w ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div
                  className="rounded-full bg-current"
                  style={{ width: Math.min(w, 10), height: Math.min(w, 10) }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
