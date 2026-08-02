import React from 'react';
import { MousePointer2 } from 'lucide-react';

export default function LiveCursors({ cursors, currentUserId }) {
  if (!cursors || Object.keys(cursors).length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {Object.values(cursors).map((cursor) => {
        if (!cursor || cursor.userId === currentUserId) return null;

        return (
          <div
            key={cursor.userId}
            className="absolute transition-all duration-75 ease-out flex items-center gap-1.5"
            style={{
              transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`,
            }}
          >
            {/* Custom SVG pointer cursor */}
            <MousePointer2
              className="w-5 h-5 drop-shadow-md"
              style={{
                color: cursor.color || '#3b82f6',
                fill: cursor.color || '#3b82f6',
              }}
            />

            {/* Label badge with user name */}
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-lg whitespace-nowrap"
              style={{
                backgroundColor: cursor.color || '#3b82f6',
              }}
            >
              {cursor.userName || 'Editor'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
