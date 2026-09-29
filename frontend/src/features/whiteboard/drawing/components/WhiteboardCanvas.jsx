import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text } from 'react-konva';

export default function WhiteboardCanvas({
  elements,
  onAddElement,
  onDeleteElement,
  onCursorMove,
  activeTool,
  color,
  strokeWidth,
  canEdit,
  stagePos,
  setStagePos,
  scale = 1,
  setScale,
}) {
  const stageRef = useRef(null);
  const textareaRef = useRef(null);
  const textCreatedTimeRef = useRef(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasingObjects, setIsErasingObjects] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentElement, setCurrentElement] = useState(null);
  const [textEditing, setTextEditing] = useState(null);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Handle window resize dynamically
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for Spacebar keydown / keyup for panning
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      if (isInput) return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Commit text from in-place textarea
  const commitTextEntry = useCallback(() => {
    if (!textEditing) return;

    const trimmed = (textEditing.text || '').trim();
    if (trimmed.length > 0) {
      const textElem = {
        id: textEditing.id,
        type: 'text',
        color: textEditing.color,
        strokeWidth: textEditing.strokeWidth,
        x: textEditing.worldX,
        y: textEditing.worldY,
        text: trimmed,
      };
      onAddElement(textElem);
    } else if (!textEditing.isNew) {
      // Discard/remove if an existing element was cleared completely
      onDeleteElement(textEditing.id);
    }

    setTextEditing(null);
  }, [textEditing, onAddElement, onDeleteElement]);

  // Auto-focus and auto-resize textarea when text editing starts or changes
  useEffect(() => {
    if (textEditing && textareaRef.current) {
      textCreatedTimeRef.current = Date.now();
      const el = textareaRef.current;
      el.style.height = 'auto';
      el.style.height = `${Math.max(el.scrollHeight, 38)}px`;

      // Delay focus slightly so the browser finishes dispatching the canvas tap/click event
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [textEditing?.id]);

  // Convert screen coordinates to world canvas coordinates
  const screenToWorld = useCallback(
    (screenX, screenY) => {
      return {
        x: (screenX - stagePos.x) / scale,
        y: (screenY - stagePos.y) / scale,
      };
    },
    [stagePos.x, stagePos.y, scale]
  );

  // Wheel event for trackpad pan or pinch/ctrl zoom
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Zoom centered on pointer position
        const zoomFactor = 1.06;
        const oldScale = scale;
        const newScale = e.deltaY < 0 ? oldScale * zoomFactor : oldScale / zoomFactor;
        const clampedScale = Math.min(Math.max(newScale, 0.2), 4);

        const pointer = {
          x: e.clientX,
          y: e.clientY,
        };

        const mousePointTo = {
          x: (pointer.x - stagePos.x) / oldScale,
          y: (pointer.y - stagePos.y) / oldScale,
        };

        const newPos = {
          x: pointer.x - mousePointTo.x * clampedScale,
          y: pointer.y - mousePointTo.y * clampedScale,
        };

        setScale(clampedScale);
        setStagePos(newPos);
      } else {
        // Pan canvas with trackpad swipe or mouse wheel
        setStagePos((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    },
    [scale, stagePos, setScale, setStagePos]
  );

  // Handle pointer down (Pan, Start drawing, Erasing, or In-Place Text Entry)
  const handlePointerDown = (e) => {
    // If text editing is active and user clicks elsewhere on canvas:
    if (textEditing) {
      // Ignore clicks that fire within 400ms of text creation (synthetic mouse events from tap)
      if (Date.now() - textCreatedTimeRef.current < 400) {
        return;
      }
      commitTextEntry();
      return;
    }

    const isMiddleClick = e.evt && (e.evt.button === 1 || e.evt.buttons === 4);
    const shouldPan = isSpacePressed || activeTool === 'pan' || isMiddleClick;

    if (shouldPan) {
      setIsPanning(true);
      const clientX = e.evt.clientX || (e.evt.touches && e.evt.touches[0]?.clientX) || 0;
      const clientY = e.evt.clientY || (e.evt.touches && e.evt.touches[0]?.clientY) || 0;
      setPanStart({
        x: clientX - stagePos.x,
        y: clientY - stagePos.y,
      });
      return;
    }

    if (!canEdit) return;

    if (activeTool === 'eraser') {
      setIsErasingObjects(true);
      return;
    }

    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const world = screenToWorld(pointer.x, pointer.y);

    // Modern In-Place Text Entry Trigger
    if (activeTool === 'text') {
      const elementId = `elem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      textCreatedTimeRef.current = Date.now();
      setTextEditing({
        id: elementId,
        worldX: world.x,
        worldY: world.y,
        text: '',
        color,
        strokeWidth,
        isNew: true,
      });
      return;
    }

    setIsDrawing(true);
    setStartPos({ x: world.x, y: world.y });
    const elementId = `elem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newElem = {
      id: elementId,
      type: activeTool,
      color,
      strokeWidth,
      x: world.x,
      y: world.y,
      points: [world.x, world.y],
      width: 5,
      height: 5,
      radius: 10,
    };

    setCurrentElement(newElem);
  };

  // Handle mouse/touch movement on canvas
  const handlePointerMove = (e) => {
    // If currently panning, update stage position
    if (isPanning) {
      const clientX = e.evt.clientX || (e.evt.touches && e.evt.touches[0]?.clientX) || 0;
      const clientY = e.evt.clientY || (e.evt.touches && e.evt.touches[0]?.clientY) || 0;
      const newX = clientX - panStart.x;
      const newY = clientY - panStart.y;
      setStagePos({ x: newX, y: newY });
      return;
    }

    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const world = screenToWorld(pointer.x, pointer.y);

    // Broadcast cursor position in WORLD coordinates so remote clients see exact placement
    if (canEdit && onCursorMove) {
      onCursorMove(world.x, world.y);
    }

    if (!isDrawing || !canEdit || !currentElement || !startPos || activeTool === 'eraser') return;

    if (activeTool === 'brush') {
      setCurrentElement((prev) => ({
        ...prev,
        points: [...prev.points, world.x, world.y],
      }));
    } else if (activeTool === 'rectangle') {
      const width = world.x - startPos.x;
      const height = world.y - startPos.y;
      setCurrentElement((prev) => ({
        ...prev,
        width,
        height,
      }));
    } else if (activeTool === 'circle') {
      const dx = world.x - startPos.x;
      const dy = world.y - startPos.y;
      const radius = Math.max(Math.sqrt(dx * dx + dy * dy), 5);
      setCurrentElement((prev) => ({
        ...prev,
        radius,
      }));
    } else if (activeTool === 'line') {
      setCurrentElement((prev) => ({
        ...prev,
        points: [startPos.x, startPos.y, world.x, world.y],
      }));
    }
  };

  // Handle pointer up (Finish drawing, pan, or object erasing)
  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    setIsErasingObjects(false);

    if (!isDrawing || !canEdit || activeTool === 'eraser') return;
    setIsDrawing(false);

    if (currentElement) {
      onAddElement(currentElement);
      setCurrentElement(null);
      setStartPos(null);
    }
  };

  // Click handler for Object Eraser mode
  const handleElementClick = (elemId) => {
    if (canEdit && activeTool === 'eraser' && onDeleteElement) {
      onDeleteElement(elemId);
    }
  };

  // Edit existing text in-place
  const startEditingElement = useCallback(
    (elem) => {
      if (!canEdit || elem.type !== 'text') return;
      textCreatedTimeRef.current = Date.now();
      setTextEditing({
        id: elem.id,
        worldX: elem.x,
        worldY: elem.y,
        text: elem.text || '',
        color: elem.color || color,
        strokeWidth: elem.strokeWidth || strokeWidth,
        isNew: false,
      });
    },
    [canEdit, color, strokeWidth]
  );

  // Dynamic hover/drag eraser handler
  const handleElementPointerOver = (elemId, evt) => {
    if (canEdit && activeTool === 'eraser' && onDeleteElement) {
      const isMouseDown = isErasingObjects || (evt && evt.evt && (evt.evt.buttons === 1 || evt.evt.which === 1));
      if (isMouseDown) {
        onDeleteElement(elemId);
      }
    }
  };

  // Render individual Konva element
  const renderElement = (elem) => {
    if (!elem) return null;

    // Hide Konva text element while it is currently being edited in the in-place HTML overlay
    if (textEditing && textEditing.id === elem.id) {
      return null;
    }

    const hitWidth = Math.max((elem.strokeWidth || 4) + 16, 20);

    const shapeProps = {
      key: elem.id,
      onClick: (e) => {
        if (activeTool === 'eraser') {
          e.cancelBubble = true;
          handleElementClick(elem.id);
        }
      },
      onTap: (e) => {
        if (activeTool === 'eraser') {
          e.cancelBubble = true;
          handleElementClick(elem.id);
        }
      },
      onPointerOver: (e) => handleElementPointerOver(elem.id, e),
    };

    switch (elem.type) {
      case 'brush':
        return (
          <Line
            {...shapeProps}
            points={elem.points}
            stroke={elem.color}
            strokeWidth={elem.strokeWidth || 4}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            hitStrokeWidth={hitWidth}
          />
        );

      case 'line':
        return (
          <Line
            {...shapeProps}
            points={elem.points}
            stroke={elem.color}
            strokeWidth={elem.strokeWidth || 4}
            lineCap="round"
            lineJoin="round"
            hitStrokeWidth={hitWidth}
          />
        );

      case 'rectangle':
        return (
          <Rect
            {...shapeProps}
            x={elem.width < 0 ? elem.x + elem.width : elem.x}
            y={elem.height < 0 ? elem.y + elem.height : elem.y}
            width={Math.abs(elem.width)}
            height={Math.abs(elem.height)}
            stroke={elem.color}
            strokeWidth={elem.strokeWidth || 4}
            cornerRadius={4}
          />
        );

      case 'circle':
        return (
          <Circle
            {...shapeProps}
            x={elem.x}
            y={elem.y}
            radius={Math.max(elem.radius || 10, 2)}
            stroke={elem.color}
            strokeWidth={elem.strokeWidth || 4}
          />
        );

      case 'text':
        return (
          <Text
            key={elem.id}
            {...shapeProps}
            x={elem.x}
            y={elem.y}
            text={elem.text || ''}
            fontSize={Math.max((elem.strokeWidth || 4) * 4, 18)}
            fill={elem.color || '#1e293b'}
            fontFamily="sans-serif"
            fontStyle="bold"
            onDblClick={(e) => {
              e.cancelBubble = true;
              startEditingElement(elem);
            }}
            onDblTap={(e) => {
              e.cancelBubble = true;
              startEditingElement(elem);
            }}
            onClick={(e) => {
              if (activeTool === 'eraser') {
                e.cancelBubble = true;
                handleElementClick(elem.id);
              } else if (activeTool === 'text') {
                e.cancelBubble = true;
                startEditingElement(elem);
              }
            }}
            onTap={(e) => {
              if (activeTool === 'eraser') {
                e.cancelBubble = true;
                handleElementClick(elem.id);
              } else if (activeTool === 'text') {
                e.cancelBubble = true;
                startEditingElement(elem);
              }
            }}
          />
        );

      default:
        return null;
    }
  };

  // Determine active cursor style
  let cursorClass = 'cursor-crosshair';
  if (isSpacePressed || activeTool === 'pan') {
    cursorClass = isPanning ? 'cursor-grabbing' : 'cursor-grab';
  } else if (activeTool === 'eraser') {
    cursorClass = 'cursor-pointer';
  } else if (activeTool === 'text') {
    cursorClass = 'cursor-text';
  }

  return (
    <div
      onWheel={handleWheel}
      className={`w-full h-full bg-grid-dots relative overflow-hidden select-none ${cursorClass}`}
      style={{
        backgroundPosition: `${stagePos.x}px ${stagePos.y}px`,
        backgroundSize: `${24 * scale}px ${24 * scale}px`,
      }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        <Layer>
          {/* Render synced background elements */}
          {elements.map((elem) => renderElement(elem))}

          {/* Render active currently drawing element */}
          {currentElement && renderElement(currentElement)}
        </Layer>
      </Stage>

      {/* Modern In-Place Text Entry Overlay */}
      {textEditing && (
        <div
          className="absolute z-30 pointer-events-auto"
          style={{
            left: `${textEditing.worldX * scale + stagePos.x}px`,
            top: `${textEditing.worldY * scale + stagePos.y}px`,
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="relative group">
            <textarea
              ref={textareaRef}
              autoFocus
              rows={1}
              value={textEditing.text}
              placeholder="Type something..."
              onChange={(e) => {
                const val = e.target.value;
                setTextEditing((prev) => (prev ? { ...prev, text: val } : null));
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.max(e.target.scrollHeight, 38)}px`;
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  commitTextEntry();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  commitTextEntry();
                }
              }}
              onBlur={() => {
                // If blur happens right after creation (< 400ms), ignore it and refocus
                if (Date.now() - textCreatedTimeRef.current < 400) {
                  setTimeout(() => {
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                    }
                  }, 20);
                  return;
                }
                commitTextEntry();
              }}
              className="resize-none bg-white/95 backdrop-blur-md rounded-xl px-3 py-2 shadow-2xl border-2 border-indigo-600 focus:outline-hidden font-bold leading-tight min-w-[160px] max-w-[500px]"
              style={{
                color: textEditing.color,
                fontSize: `${Math.max(textEditing.strokeWidth * 4 * scale, 18 * scale)}px`,
                fontFamily: 'sans-serif',
              }}
            />
            {/* Inline Hint Pill */}
            <div className="absolute top-full left-0 mt-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-[10px] font-medium shadow-xl whitespace-nowrap flex items-center gap-1.5 pointer-events-none">
              <span>Press <kbd className="px-1 py-0.2 rounded bg-slate-800 border border-slate-700 font-mono text-[9px]">Enter</kbd> to place</span>
              <span>•</span>
              <span><kbd className="px-1 py-0.2 rounded bg-slate-800 border border-slate-700 font-mono text-[9px]">Shift+Enter</kbd> newline</span>
              <span>•</span>
              <span><kbd className="px-1 py-0.2 rounded bg-slate-800 border border-slate-700 font-mono text-[9px]">Esc</kbd> to finish</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

