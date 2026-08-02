import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text } from 'react-konva';

export default function WhiteboardCanvas({
  elements,
  onAddElement,
  onDeleteElement,
  onCursorMove,
  activeTool,
  color,
  strokeWidth,
  canEdit
}) {
  const stageRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasingObjects, setIsErasingObjects] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentElement, setCurrentElement] = useState(null);
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

  // Handle pointer down (Start drawing element or dynamic object erasing)
  const handlePointerDown = (e) => {
    if (!canEdit) return;

    if (activeTool === 'eraser') {
      setIsErasingObjects(true);
      return;
    }

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    setIsDrawing(true);
    setStartPos({ x: point.x, y: point.y });
    const elementId = `elem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (activeTool === 'text') {
      const textVal = prompt('Enter text for canvas:', 'BoardCraft');
      if (textVal) {
        const newTextElem = {
          id: elementId,
          type: 'text',
          color,
          strokeWidth,
          x: point.x,
          y: point.y,
          text: textVal,
        };
        onAddElement(newTextElem);
      }
      setIsDrawing(false);
      return;
    }

    const newElem = {
      id: elementId,
      type: activeTool,
      color,
      strokeWidth,
      x: point.x,
      y: point.y,
      points: [point.x, point.y],
      width: 5,
      height: 5,
      radius: 10,
    };

    setCurrentElement(newElem);
  };

  // Handle mouse/touch movement on canvas
  const handlePointerMove = (e) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    // Broadcast cursor position if user is Editor
    if (canEdit && onCursorMove) {
      onCursorMove(point.x, point.y);
    }

    if (!isDrawing || !canEdit || !currentElement || !startPos || activeTool === 'eraser') return;

    if (activeTool === 'brush') {
      setCurrentElement((prev) => ({
        ...prev,
        points: [...prev.points, point.x, point.y],
      }));
    } else if (activeTool === 'rectangle') {
      const width = point.x - startPos.x;
      const height = point.y - startPos.y;
      setCurrentElement((prev) => ({
        ...prev,
        width,
        height,
      }));
    } else if (activeTool === 'circle') {
      const dx = point.x - startPos.x;
      const dy = point.y - startPos.y;
      const radius = Math.max(Math.sqrt(dx * dx + dy * dy), 5);
      setCurrentElement((prev) => ({
        ...prev,
        radius,
      }));
    } else if (activeTool === 'line') {
      setCurrentElement((prev) => ({
        ...prev,
        points: [startPos.x, startPos.y, point.x, point.y],
      }));
    }
  };

  // Handle pointer up (Finish drawing or object erasing)
  const handlePointerUp = () => {
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
      onMouseDown: (e) => {
        if (activeTool === 'eraser') {
          e.cancelBubble = true;
          setIsErasingObjects(true);
          handleElementClick(elem.id);
        }
      },
      onPointerOver: (e) => handleElementPointerOver(elem.id, e),
      onMouseEnter: (e) => handleElementPointerOver(elem.id, e),
      hitStrokeWidth: hitWidth,
    };

    switch (elem.type) {
      case 'brush':
        return (
          <Line
            {...shapeProps}
            points={elem.points || []}
            stroke={elem.color}
            strokeWidth={elem.strokeWidth || 4}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
        );

      case 'line':
        return (
          <Line
            {...shapeProps}
            points={elem.points || []}
            stroke={elem.color}
            strokeWidth={elem.strokeWidth || 4}
            lineCap="round"
          />
        );

      case 'rectangle':
        return (
          <Rect
            {...shapeProps}
            x={elem.width < 0 ? elem.x + elem.width : elem.x}
            y={elem.height < 0 ? elem.y + elem.height : elem.y}
            width={Math.abs(elem.width || 0)}
            height={Math.abs(elem.height || 0)}
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
            {...shapeProps}
            x={elem.x}
            y={elem.y}
            text={elem.text || ''}
            fontSize={Math.max(elem.strokeWidth * 4, 18)}
            fill={elem.color}
            fontFamily="sans-serif"
            fontStyle="bold"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`w-full h-full bg-grid-dots relative overflow-hidden select-none ${
        activeTool === 'eraser' ? 'cursor-pointer' : 'cursor-crosshair'
      }`}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
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
    </div>
  );
}
