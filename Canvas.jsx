import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Circle, Line, Transformer, Text, Image } from 'react-konva';
import useImage from 'use-image';

const Canvas = ({
  elements,
  selectedElement,
  setSelectedElement,
  onElementChange,
  onDeleteElement,
  cursorPosition,
  onAddElement // Add this prop
}) => {
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const [editingText, setEditingText] = useState(null);
  const textareaRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth * 0.6, height: window.innerHeight - 80 });
  const [isGesturePinching, setIsGesturePinching] = useState(false);
  const lastCursorPositionRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const throttledUpdateTimeRef = useRef(0);
  const THROTTLE_TIME = 100; // ms

  // Add drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    // Handle both dragged files and dragged images
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const stageBox = stageRef.current.container().getBoundingClientRect();
        const dropX = e.clientX - stageBox.left;
        const dropY = e.clientY - stageBox.top;

        onAddElement({
          type: 'image',
          url: event.target.result,
          x: dropX,
          y: dropY,
          width: 200,
          height: 150,
          alt: file.name
        });
      };
      reader.readAsDataURL(file);
    } else if (e.dataTransfer.getData('text/uri-list')) {
      // Handle dragged image URLs
      const imageUrl = e.dataTransfer.getData('text/uri-list');
      const stageBox = stageRef.current.container().getBoundingClientRect();
      const dropX = e.clientX - stageBox.left;
      const dropY = e.clientY - stageBox.top;

      onAddElement({
        type: 'image',
        url: imageUrl,
        x: dropX,
        y: dropY,
        width: 200,
        height: 150,
        alt: 'Dragged image'
      });
    }
  }, [onAddElement, stageRef]);

  // Memoized element change handler with improved throttling
  const handleElementChange = useCallback((updatedElement) => {
    // Use more aggressive throttling with leading edge only
    const now = performance.now();
    if (now - throttledUpdateTimeRef.current < THROTTLE_TIME) {
      // Skip updates that are too close together
      return;
    }

    throttledUpdateTimeRef.current = now;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      onElementChange(updatedElement);
    });
  }, [onElementChange]);

  // Update transformer when selected element changes
  useEffect(() => {
    if (!transformerRef.current || !selectedElement || !stageRef.current) return;

    const selectedNode = stageRef.current.findOne(`#${selectedElement.id}`);
    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedElement]);

  // Handle keyboard events (like delete)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedElement) {
        onDeleteElement(selectedElement.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, onDeleteElement]);

  // Handle window resize with more aggressive debounce
  useEffect(() => {
    let resizeTimeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (stageRef.current) {
          const width = window.innerWidth * 0.6;
          const height = window.innerHeight - 0;
          setStageSize({ width, height });
        }
      }, 200); // More aggressive debounce (200ms)
    };

    handleResize(); // Initial setup
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Handle text editing (from first file)
  useEffect(() => {
    if (editingText !== null) {
      const textNode = stageRef.current.findOne(`#${editingText}`);
      if (!textNode) {
        setEditingText(null);
        return;
      }

      // Create and position textarea over the text node
      const textPosition = textNode.absolutePosition();
      const stageContainer = stageRef.current.container();
      const areaPosition = {
        x: textPosition.x,
        y: textPosition.y,
      };

      // Create textarea if it doesn't exist
      if (!textareaRef.current) {
        const textarea = document.createElement('textarea');
        textarea.style.position = 'absolute';
        textarea.style.top = `${areaPosition.y}px`;
        textarea.style.left = `${areaPosition.x}px`;
        textarea.style.width = `${textNode.width() * textNode.scaleX()}px`;
        textarea.style.height = `${textNode.height() * textNode.scaleY()}px`;
        textarea.style.fontSize = `${textNode.fontSize() * textNode.scaleY()}px`;
        textarea.style.border = '1px solid #999';
        textarea.style.padding = '5px';
        textarea.style.margin = '0px';
        textarea.style.overflow = 'hidden';
        textarea.style.background = '#fff';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.lineHeight = textNode.lineHeight() || 'normal';
        textarea.style.fontFamily = textNode.fontFamily() || 'Arial, sans-serif';
        textarea.style.transformOrigin = 'left top';
        textarea.style.textAlign = textNode.align() || 'left';
        textarea.style.color = textNode.fill() || '#000000';

        // Clear placeholder text if it's still there
        const elementId = parseInt(textNode.id());
        const element = elements.find(el => el.id === elementId);
        const isPlaceholder = element && (
          element.text === 'Double-click to edit heading' ||
          element.text === 'Double-click to edit subheading' ||
          element.text === 'Double-click to edit text'
        );

        textarea.value = isPlaceholder ? '' : textNode.text();

        // Apply font styles
        const fontStyle = textNode.fontStyle();
        if (fontStyle === 'italic') {
          textarea.style.fontStyle = 'italic';
        } else {
          textarea.style.fontStyle = 'normal';
        }

        textarea.style.fontWeight = textNode.fontStyle() === 'bold' ? 'bold' : 'normal';
        textarea.style.textDecoration = textNode.textDecoration() || 'none';

        const rotation = textNode.rotation();
        let transform = '';
        if (rotation) {
          transform += `rotateZ(${rotation}deg)`;
        }
        textarea.style.transform = transform;

        // Add the textarea to the DOM
        stageContainer.appendChild(textarea);
        textareaRef.current = textarea;

        // Focus on the textarea and select all text
        textarea.focus();

        // Handle text editing complete on Enter key
        textarea.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            finishEditing(textarea, textNode);
          }
        });

        // Handle text editing complete on blur
        textarea.addEventListener('blur', () => {
          finishEditing(textarea, textNode);
        });
      }
    } else if (textareaRef.current) {
      // Remove textarea when not editing
      textareaRef.current.parentNode.removeChild(textareaRef.current);
      textareaRef.current = null;
    }
  }, [editingText, elements]);

  // Virtual cursor effect from hand gesture with better throttling (from second file)
  useEffect(() => {
    if (!cursorPosition || !stageRef.current) return;

    const now = performance.now();
    if (now - lastUpdateTimeRef.current < 50) { // Reduced to 20fps from 60fps for better performance
      return;
    }
    lastUpdateTimeRef.current = now;

    // Store the cursor position for gesture comparison
    lastCursorPositionRef.current = cursorPosition;
  }, [cursorPosition]);

  // Custom function to handle pinch gesture from GestureDetector (from second file)
  useEffect(() => {
    // Custom event listener for gesture events from parent
    const handleGestureEvent = (event) => {
      const { detail } = event;
      if (!detail) return;

      switch (detail.type) {
        case 'pinch_start':
          setIsGesturePinching(true);
          break;
        case 'pinch_end':
          setIsGesturePinching(false);
          break;
        default:
          break;
      }
    };

    // Element resize event handler
    const handleElementResize = (event) => {
      const { detail } = event;
      if (!detail || !detail.element) return;

      // This event comes from GestureDetector
      handleElementChange(detail.element);
    };

    window.addEventListener('gesture_detected', handleGestureEvent);
    window.addEventListener('element_resize', handleElementResize);

    return () => {
      window.removeEventListener('gesture_detected', handleGestureEvent);
      window.removeEventListener('element_resize', handleElementResize);
    };
  }, [handleElementChange]);

  // Cleanup animation frames on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Helper function to finish text editing (from first file)
  const finishEditing = (textarea, textNode) => {
    const elementId = parseInt(textNode.id());
    const element = elements.find(el => el.id === elementId);

    if (element) {
      // Don't allow empty text
      const newText = textarea.value.trim() || "Text";

      handleElementChange({
        ...element,
        text: newText,
        // Update width based on content if needed
        width: Math.max(element.width, textarea.scrollWidth),
        height: Math.max(element.height, textarea.scrollHeight)
      });
    }

    setEditingText(null);
  };

  // Memoized handlers to prevent recreations
  const handleSelectElement = useCallback((e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedElement(null);
      return;
    }

    const elementId = parseInt(e.target.id());
    const element = elements.find(el => el.id === elementId);

    // If it's a text element and double-click, enter edit mode
    if (element && element.type === 'text' && e.evt.detail === 2) {
      setEditingText(elementId.toString());
    }

    setSelectedElement(element);
  }, [elements, setSelectedElement]);

  const handleDragStart = useCallback((e) => {
    const elementId = parseInt(e.target.id());
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    // Don't start drag if we're editing text
    if (editingText === elementId.toString()) {
      return;
    }

    // Set selected element when starting to drag
    setSelectedElement(element);

    // Set dragging state
    handleElementChange({
      ...element,
      isDragging: true
    });
  }, [elements, editingText, handleElementChange, setSelectedElement]);

  const handleDragEnd = useCallback((e) => {
    const elementId = parseInt(e.target.id());
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    // Update element position after drag
    const updatedElement = {
      ...element,
      isDragging: false,
      x: e.target.x(),
      y: e.target.y()
    };

    // Apply the changes
    handleElementChange(updatedElement);
  }, [elements, handleElementChange]);

  const handleTransformEnd = useCallback((e) => {
    const elementId = parseInt(e.target.id());
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const node = e.target;

    if (element.type === 'text') {
      // For text elements
      handleElementChange({
        ...element,
        x: node.x(),
        y: node.y(),
        width: Math.max(node.width() * node.scaleX(), 50), // Minimum width for text
        height: Math.max(node.height() * node.scaleY(), 20), // Minimum height for text
        fontSize: element.fontSize * node.scaleY(),
      });

      // Reset scale after updating width and height
      node.scaleX(1);
      node.scaleY(1);
    } else if (element.type === 'custom') {
      // For custom shapes, we need to apply the scale to each point
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      handleElementChange({
        ...element,
        x: node.x(),
        y: node.y(),
        scaleX,
        scaleY,
      });
    } else if (element.type === 'image') {
      // For image elements
      handleElementChange({
        ...element,
        x: node.x(),
        y: node.y(),
        width: node.width() * node.scaleX(),
        height: node.height() * node.scaleY(),
      });

      // Reset scale after updating width and height
      node.scaleX(1);
      node.scaleY(1);
    } else {
      // For standard shapes like rectangles and circles
      handleElementChange({
        ...element,
        x: node.x(),
        y: node.y(),
        width: Math.max(20, node.width() * node.scaleX()),
        height: Math.max(20, node.height() * node.scaleY()),
      });

      // Reset scale after updating width and height
      node.scaleX(1);
      node.scaleY(1);
    }
  }, [elements, handleElementChange]);

  // Convert points array to flat array for konva Line - memoized
  const pointsToFlatArray = useCallback((points, x, y, scaleX = 1, scaleY = 1) => {
    if (!points || !Array.isArray(points)) return [];

    return points.flatMap(point => [
      (point.x * scaleX) + x,
      (point.y * scaleY) + y
    ]);
  }, []);

  // Component for rendering images (from first file)
  const CanvasImage = useCallback(({ element }) => {
    const [image] = useImage(element.url);
    return (
      <Image
        id={element.id.toString()}
        x={element.x}
        y={element.y}
        image={image}
        width={element.width}
        height={element.height}
        draggable={true}  // Ensure draggable is true
        perfectDrawEnabled={false}
        onDragStart={(e) => {
          // Prevent default browser drag behavior
          e.evt.preventDefault();
          handleDragStart(e);
        }}
        onDragMove={(e) => {
          // Update position during drag
          e.evt.preventDefault();
          const node = e.target;
          handleElementChange({
            ...element,
            x: node.x(),
            y: node.y(),
          });
        }}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        shadowColor="rgba(0,0,0,0.2)"
        shadowBlur={selectedElement && selectedElement.id === element.id ? 10 : 0}
        shadowOffsetX={selectedElement && selectedElement.id === element.id ? 3 : 0}
        shadowOffsetY={selectedElement && selectedElement.id === element.id ? 3 : 0}
      />
    );
  }, [handleDragStart, handleDragEnd, handleTransformEnd, selectedElement, handleElementChange]);

  // Simple cursor component for better performance (from second file)
  const VirtualCursor = useCallback(() => {
    if (!cursorPosition || !cursorPosition.x || !cursorPosition.y) return null;

    return (
      <Circle
        x={cursorPosition.x}
        y={cursorPosition.y}
        radius={10}
        fill="rgba(255, 0, 0, 0.5)"
        stroke="red"
        strokeWidth={2}
        perfectDrawEnabled={false}
        listening={false}
      />
    );
  }, [cursorPosition]);

  // Memoize elements to avoid unnecessary re-renders (improved version combining both files)
  const renderedElements = useMemo(() => {
    return elements.map(element => {
      if (element.type === 'rectangle') {
        return (
          <Rect
            key={element.id}
            id={element.id.toString()}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            fill={element.fill}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
            cornerRadius={5}
            perfectDrawEnabled={false} // Performance optimization
            shadowColor="rgba(0,0,0,0.2)"
            shadowBlur={selectedElement && selectedElement.id === element.id ? 10 : 0}
            shadowOffsetX={selectedElement && selectedElement.id === element.id ? 3 : 0}
            shadowOffsetY={selectedElement && selectedElement.id === element.id ? 3 : 0}
          />
        );
      } else if (element.type === 'circle') {
        return (
          <Circle
            key={element.id}
            id={element.id.toString()}
            x={element.x}
            y={element.y}
            radius={element.width / 2}
            fill={element.fill}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
            perfectDrawEnabled={false} // Performance optimization
            shadowColor="rgba(0,0,0,0.2)"
            shadowBlur={selectedElement && selectedElement.id === element.id ? 10 : 0}
            shadowOffsetX={selectedElement && selectedElement.id === element.id ? 3 : 0}
            shadowOffsetY={selectedElement && selectedElement.id === element.id ? 3 : 0}
          />
        );
      } else if (element.type === 'text') {
        return (
          <Text
            key={element.id}
            id={element.id.toString()}
            x={element.x}
            y={element.y}
            text={element.text}
            fontSize={element.fontSize || 16}
            fill={element.fill || '#000000'}
            width={element.width}
            height={element.height}
            draggable
            padding={5}
            perfectDrawEnabled={false} // Performance optimization
            // Apply font styles
            fontStyle={element.fontStyle === 'Italic' ? 'italic' : ''}
            fontWeight={element.fontStyle === 'Bold' ? 'bold' : 'normal'}
            textDecoration={element.fontStyle === 'Underline' ? 'underline' : ''}
            fontFamily={
              element.fontStyle === 'Serif' ? 'Georgia, serif' :
              element.fontStyle === 'Sans-serif' ? 'Arial, sans-serif' :
              element.fontStyle === 'Monospace' ? 'Courier New, monospace' :
              'Arial, sans-serif'
            }
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
            shadowColor="rgba(0,0,0,0.2)"
            shadowBlur={selectedElement && selectedElement.id === element.id ? 10 : 0}
            shadowOffsetX={selectedElement && selectedElement.id === element.id ? 3 : 0}
            shadowOffsetY={selectedElement && selectedElement.id === element.id ? 3 : 0}
          />
        );
      } else if (element.type === 'custom' && element.points) {
        // Render custom shape using Line component
        const scaleX = element.scaleX || 1;
        const scaleY = element.scaleY || 1;

        return (
          <Line
            key={element.id}
            id={element.id.toString()}
            points={pointsToFlatArray(element.points, 0, 0)}
            x={element.x}
            y={element.y}
            fill={element.fill}
            closed={true}
            draggable
            scaleX={scaleX}
            scaleY={scaleY}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
            perfectDrawEnabled={false} // Performance optimization
            shadowColor="rgba(0,0,0,0.2)"
            shadowBlur={selectedElement && selectedElement.id === element.id ? 10 : 0}
            shadowOffsetX={selectedElement && selectedElement.id === element.id ? 3 : 0}
            shadowOffsetY={selectedElement && selectedElement.id === element.id ? 3 : 0}
          />
        );
      } else if (element.type === 'image') {
        return <CanvasImage key={element.id} element={element} />;
      }
      return null;
    });
  }, [elements, selectedElement, handleDragStart, handleDragEnd, handleTransformEnd, pointsToFlatArray, CanvasImage]);

  return (
    <div
      className="w-full h-full bg-white"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onClick={handleSelectElement}
        onTap={handleSelectElement}
      >
        <Layer>
          {renderedElements}

          {/* Display virtual cursor for hand tracking if available */}
          {cursorPosition && <VirtualCursor />}

          {selectedElement && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Limit resize to a minimum size
                if (newBox.width < 20 || newBox.height < 20) {
                  return oldBox;
                }
                return newBox;
              }}
              anchorStroke="#0096FF"
              anchorFill="#FFFFFF"
              anchorSize={8}
              borderStroke="#0096FF"
              borderDash={[4, 4]}
              rotateEnabled={true}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              perfectDrawEnabled={false} // Performance optimization
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;
