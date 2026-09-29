import React, { useState, useRef, useEffect } from 'react';
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
  Pipette,
  Download,
  Upload,
  Hand,
  Crosshair,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  ChevronDown
} from 'lucide-react';

const TOOLS = [
  { id: 'pan', label: 'Pan Canvas', icon: Hand, shortcut: 'H' },
  { id: 'brush', label: 'Pencil / Brush', icon: Pencil, shortcut: 'B' },
  { id: 'eraser', label: 'Object Eraser', icon: Eraser, shortcut: 'E' },
  { id: 'rectangle', label: 'Rectangle', icon: Square, shortcut: 'R' },
  { id: 'circle', label: 'Circle', icon: CircleIcon, shortcut: 'C' },
  { id: 'line', label: 'Line', icon: Minus, shortcut: 'L' },
  { id: 'text', label: 'In-Place Text', icon: Type, shortcut: 'T' },
];

const PRESET_COLORS = [
  { hex: '#1e293b', label: 'Slate Dark' },
  { hex: '#4f46e5', label: 'Indigo' },
  { hex: '#ef4444', label: 'Crimson' },
  { hex: '#f59e0b', label: 'Amber' },
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#0284c7', label: 'Sky' },
  { hex: '#8b5cf6', label: 'Violet' },
  { hex: '#ec4899', label: 'Pink' },
];

const STROKE_OPTIONS = [
  { width: 2, label: 'Fine' },
  { width: 4, label: 'Regular' },
  { width: 8, label: 'Bold' },
  { width: 14, label: 'Heavy' },
];

export default function Toolbar({
  activeTool,
  setActiveTool,
  color,
  setColor,
  strokeWidth,
  setStrokeWidth,
  onClearCanvas,
  onExportCanvas,
  onImportCanvas,
  onResetView,
  onOpenShortcuts,
  scale = 1,
  onZoomIn,
  onZoomOut,
  canEdit
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);
  const colorPickerRef = useRef(null);
  const strokePickerRef = useRef(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
        setShowColorPicker(false);
      }
      if (strokePickerRef.current && !strokePickerRef.current.contains(e.target)) {
        setShowStrokePicker(false);
      }
    };
    if (showColorPicker || showStrokePicker) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showColorPicker, showStrokePicker]);

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (file && onImportCanvas) {
      onImportCanvas(file);
      e.target.value = '';
    }
  };

  if (!canEdit) {
    return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 border border-sky-200 text-sky-800 shadow-xl text-xs font-bold select-none">
        <Lock className="w-4 h-4 text-sky-600" />
        <span>Watcher Mode (View Only) — Board is locked for editing</span>
      </div>
    );
  }

  const currentStrokeLabel = STROKE_OPTIONS.find((s) => s.width === strokeWidth)?.label || `${strokeWidth}px`;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center max-w-[calc(100vw-1.5rem)] select-none">
      {/* Top Floating Horizontal Toolbar Dock */}
      <div className="bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-xl shadow-slate-900/5 border border-slate-200/90 overflow-x-auto">
        {/* Drawing & Navigation Tools */}
        <div className="flex items-center gap-1">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;

            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-105'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/60'
                }`}
                title={`${tool.label} (${tool.shortcut})`}
              >
                <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                <span className="sr-only">{tool.label}</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200/90 mx-1 flex-shrink-0" />

        {/* Style Properties: Color & Stroke */}
        <div className="flex items-center gap-1.5">
          {/* Color Swatch & Dropdown Trigger */}
          <div className="relative flex-shrink-0" ref={colorPickerRef}>
            <button
              onClick={() => {
                setShowColorPicker((prev) => !prev);
                setShowStrokePicker(false);
              }}
              className="h-9 px-2.5 rounded-xl border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2 text-xs font-semibold text-slate-700"
              title="Change Color"
            >
              <div
                className="w-4 h-4 rounded-full border border-black/10 shadow-2xs flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Floating Color Picker Popover */}
            {showColorPicker && (
              <div className="absolute top-full mt-2.5 left-0 bg-white/98 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-slate-200/90 z-30 w-56 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-600" /> Palette
                  </span>
                  {/* Native Color Pipette */}
                  <label className="relative cursor-pointer flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-bold" title="Pick Any Hex Color">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                    <Pipette className="w-3.5 h-3.5" />
                    <span>Custom</span>
                  </label>
                </div>

                {/* Swatch Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => {
                        setColor(c.hex);
                        setShowColorPicker(false);
                      }}
                      className={`w-9 h-9 rounded-full border border-slate-200 transition-transform shadow-xs flex items-center justify-center ${
                        color.toLowerCase() === c.hex.toLowerCase()
                          ? 'scale-110 ring-2 ring-indigo-600 ring-offset-2'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">HEX</span>
                  <span className="font-bold text-slate-700 uppercase">{color}</span>
                </div>
              </div>
            )}
          </div>

          {/* Stroke Width Dropdown Trigger */}
          <div className="relative flex-shrink-0" ref={strokePickerRef}>
            <button
              onClick={() => {
                setShowStrokePicker((prev) => !prev);
                setShowColorPicker(false);
              }}
              className="h-9 px-2.5 rounded-xl border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2 text-xs font-semibold text-slate-700"
              title="Change Stroke Size"
            >
              <div
                className="rounded-full bg-slate-700 flex-shrink-0"
                style={{ width: Math.min(strokeWidth + 2, 10), height: Math.min(strokeWidth + 2, 10) }}
              />
              <span>{currentStrokeLabel}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Floating Stroke Width Popover */}
            {showStrokePicker && (
              <div className="absolute top-full mt-2.5 left-0 bg-white/98 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-slate-200/90 z-30 w-44 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 px-2 py-1">
                  Stroke Size
                </div>
                {STROKE_OPTIONS.map((opt) => (
                  <button
                    key={opt.width}
                    onClick={() => {
                      setStrokeWidth(opt.width);
                      setShowStrokePicker(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-xs font-semibold transition-all ${
                      strokeWidth === opt.width
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className="rounded-full bg-slate-800"
                        style={{ width: Math.min(opt.width + 2, 12), height: Math.min(opt.width + 2, 12) }}
                      />
                      <span>{opt.label}</span>
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">{opt.width}px</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200/90 mx-1 flex-shrink-0" />

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="h-9 px-1 bg-slate-100/90 rounded-xl flex items-center gap-0.5 border border-slate-200/60 text-xs">
            {onZoomOut && (
              <button
                onClick={onZoomOut}
                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onResetView}
              className="px-2 font-mono text-[11px] font-bold text-slate-700 hover:text-indigo-600 transition-colors"
              title="Reset Zoom to 100% (0)"
            >
              {Math.round(scale * 100)}%
            </button>

            {onZoomIn && (
              <button
                onClick={onZoomIn}
                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {onResetView && (
            <button
              onClick={onResetView}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:bg-slate-100/80 active:bg-slate-200/60 transition-colors"
              title="Reset Pan & Zoom to Origin (0)"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200/90 mx-1 flex-shrink-0" />

        {/* Canvas Actions: Clear, Export, Import, Shortcuts */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {onClearCanvas && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear the entire whiteboard?')) {
                  onClearCanvas();
                }
              }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {onExportCanvas && (
            <button
              onClick={onExportCanvas}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Export Whiteboard Backup (JSON)"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {onImportCanvas && (
            <label
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
              title="Import Whiteboard File (JSON)"
            >
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileImport}
                className="hidden"
              />
              <Upload className="w-4 h-4" />
            </label>
          )}

          {onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Keyboard Shortcuts Cheatsheet (?)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

