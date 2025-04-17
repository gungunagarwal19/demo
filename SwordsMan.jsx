import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Canvas from "../components/Canvas.jsx";
import Sidebar from "../components/Sidebar.jsx";
import MoodboardPanel from "../components/MoodboardPanel";
import GestureDetector from "../components/GestureDetector";
import VoiceCommands from "../components/VoiceCommands";
import TextCommands from "../components/TextCommands";
import { getColorPalette } from "../components/colorApi.js";
import "../App.css";

function SwordsMan() {
  // State management
  const [selectedElement, setSelectedElement] = useState(null);
  const [gestureActive, setGestureActive] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [textCommandActive, setTextCommandActive] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("minimal");
  const [elements, setElements] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [selectedShape, setSelectedShape] = useState("rectangle");
  const [selectedColor, _setSelectedColor] = useState("#2196F3");
  const [colorPalette, setColorPalette] = useState([]);
  const [cameraOn, setCameraOn] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [baseColors] = useState([
    "#FF5252",
    "#4CAF50",
    "#2196F3",
    "#FFC107",
    "#9C27B0",
    "#FF9800",
    "#607D8B",
    "#E91E63",
  ]);

  // Load initial color palette
  useEffect(() => {
    const loadInitialPalette = async () => {
      const palette = await getColorPalette();
      setColorPalette(palette);
    };
    loadInitialPalette();
  }, []);

  const setSelectedColor = async (color) => {
    _setSelectedColor(color);

    // Get new color palette based on selected color
    const newPalette = await getColorPalette(color);
    setColorPalette(newPalette);

    if (selectedElement) {
      const updated = { ...selectedElement, fill: color };
      handleElementChange(updated);
      setSelectedElement(updated);
    }
  };

  const handleAddElement = (input, options = {}) => {
    // Handle string-based element type
    if (typeof input === "string") {
      const elementType = input;

      if (elementType === "rectangle") {
        const newElement = {
          id: nextId,
          type: "rectangle",
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          fill: selectedColor,
          isDragging: false,
        };
        setElements((prev) => [...prev, newElement]);
        setSelectedElement(newElement);
        setNextId(nextId + 1);
      } else if (elementType === "circle") {
        const newElement = {
          id: nextId,
          type: "circle",
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          fill: selectedColor,
          isDragging: false,
        };
        setElements((prev) => [...prev, newElement]);
        setSelectedElement(newElement);
        setNextId(nextId + 1);
      } else if (elementType === "text") {
        // Add text element
        const defaultWidth =
          options.textType === "heading"
            ? 300
            : options.textType === "subheading"
            ? 250
            : 200;
        const defaultHeight =
          options.textType === "heading"
            ? 60
            : options.textType === "subheading"
            ? 50
            : 40;

        const newElement = {
          id: nextId,
          type: "text",
          x: 100,
          y: 100,
          width: defaultWidth,
          height: defaultHeight,
          fontSize: options.fontSize || 16,
          textType: options.textType || "text",
          fontFamily: options.fontFamily || "Arial",
          text:
            options.textType === "heading"
              ? "Heading"
              : options.textType === "subheading"
              ? "Subheading"
              : "Text",
          fill: selectedColor,
          isDragging: false,
        };
        setElements((prev) => [...prev, newElement]);
        setSelectedElement(newElement);
        setNextId(nextId + 1);
      } else if (elementType === "fontStyle") {
        // Apply font style to selected element
        if (selectedElement && selectedElement.type === "text") {
          handleElementChange({
            ...selectedElement,
            fontStyle: options.style,
          });
        }
      } else if (
        elementType === "heading" ||
        elementType === "subheading" ||
        elementType === "paragraph"
      ) {
        // Text elements from second code
        const textDefaults = {
          heading: { fontSize: 32, fontFamily: "Arial Black", text: "Heading" },
          subheading: { fontSize: 24, fontFamily: "Arial", text: "Subheading" },
          paragraph: {
            fontSize: 18,
            fontFamily: "Georgia",
            text: "Paragraph text",
          },
        };

        const newElement = {
          id: nextId,
          type: "text",
          textType: elementType,
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100,
          width:
            elementType === "heading"
              ? 300
              : elementType === "subheading"
              ? 250
              : 200,
          height:
            elementType === "heading"
              ? 60
              : elementType === "subheading"
              ? 50
              : 40,
          fill: selectedColor,
          isDragging: false,
          ...textDefaults[elementType],
        };

        setElements((prev) => [...prev, newElement]);
        setSelectedElement(newElement);
        setNextId(nextId + 1);
      } else {
        // Original handleAddElement logic for other element types
        const newElement = {
          id: nextId,
          type: elementType,
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100,
          width: 100,
          height: 100,
          fill: selectedColor,
          isDragging: false,
        };

        setElements((prev) => [...prev, newElement]);
        setSelectedElement(newElement);
        setNextId(nextId + 1);
      }

      setSelectedShape(elementType);
      return;
    }

    // Handle object-based element type
    const elementType = input.type;

    if (elementType === "image") {
      const newElement = {
        id: nextId,
        type: "image",
        url: input.url,
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
        width: 200,
        height: 150,
        isDragging: false,
        alt: input.alt || "Moodboard image",
      };

      setElements((prev) => [...prev, newElement]);
      setSelectedElement(newElement);
      setNextId(nextId + 1);
      return;
    }

    const color = input.color || selectedColor;

    const newElement = {
      id: nextId,
      type: elementType,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      width: 100,
      height: 100,
      fill: color,
      isDragging: false,
    };

    setElements((prev) => [...prev, newElement]);
    setSelectedElement(newElement);
    setNextId(nextId + 1);
    setSelectedShape(elementType);
  };

  const handleAddCustomShape = (shapeData) => {
    const newElement = {
      id: nextId,
      type: "custom",
      shapeType: shapeData.type,
      points: shapeData.points,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      fill: shapeData.color || selectedColor,
      isDragging: false,
    };

    setElements((prev) => [...prev, newElement]);
    setSelectedElement(newElement);
    setNextId(nextId + 1);
  };

  const handleElementChange = (updatedElement) => {
    setElements((prev) =>
      prev.map((el) => (el.id === updatedElement.id ? updatedElement : el))
    );

    // Update selected element if it's the one being modified
    if (selectedElement && selectedElement.id === updatedElement.id) {
      setSelectedElement(updatedElement);
    }
  };

  const handleDeleteElement = (id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));

    // Clear selection if the deleted element was selected
    if (selectedElement && selectedElement.id === id) {
      setSelectedElement(null);
    }
  };

  const handleGestureDetected = (gesture, data) => {
    console.log("Gesture detected:", gesture, data);

    if (gesture === "cursor_move" && data) {
      setCursorPosition(data);
    }

    if (gesture === "pinch_start") {
      console.log("Pinch start detected");
    }

    if (gesture === "pinch_end") {
      console.log("Pinch end detected");
    }
  };

  const handleCommand = (command) => {
    console.log("Command received:", command);

    // Handle object-style commands
    if (typeof command === "object" && command.action) {
      const { action, data } = command;
      switch (action) {
        case "add_custom_shape":
          handleAddCustomShape(data);
          break;
        case "delete_element":
          if (selectedElement) {
            handleDeleteElement(selectedElement.id);
          }
          break;
        case "change_color":
          if (data?.color) {
            setSelectedColor(data.color);
          }
          break;
        case "generate_moodboard":
          // Implement moodboard generation
          console.log("Generate moodboard command received");
          break;
        default:
          console.log("Unknown command action:", action);
      }
      return;
    }

    // Handle string-style commands (from VoiceCommands)
    if (typeof command === "string") {
      const lowerCmd = command.toLowerCase();
      if (lowerCmd.includes("add rectangle")) {
        setSelectedShape("rectangle");
        handleAddElement("rectangle");
      } else if (lowerCmd.includes("add circle")) {
        setSelectedShape("circle");
        handleAddElement("circle");
      } else if (lowerCmd.includes("add text")) {
        handleAddElement("text");
      } else if (lowerCmd.includes("delete") && selectedElement) {
        handleDeleteElement(selectedElement.id);
      } else if (lowerCmd.includes("change color")) {
        const colorMap = {
          red: "#FF5252",
          blue: "#2196F3",
          green: "#4CAF50",
          yellow: "#FFC107",
          purple: "#9C27B0",
          pink: "#E91E63",
          orange: "#FF9800",
          gray: "#607D8B",
        };

        const found = Object.entries(colorMap).find(([name]) =>
          lowerCmd.includes(name)
        );

        if (found) {
          const newColor = found[1];
          setSelectedColor(newColor);
        }
      }
    }
  };

  const handleImageSelect = (imageData) => {
    handleAddElement({
      type: "image",
      url: imageData.url,
      alt: imageData.alt,
    });
  };

  return (
    <div className="p-5 flex h-screen bg-gray-100 overflow-x-hidden mr-5">
      <aside className="flex flex-col w-60 bg-white shadow-md ml-0 mt-0">
        <div className="p-1 border-b h-62 bg-gray-200 flex items-center justify-center">
          <div className="w-full h-full border border-gray-400 rounded bg-white flex items-center justify-center text-sm text-gray-500 overflow-hidden">
            <GestureDetector
              className="w-full h-full object-cover"
              cameraOn={cameraOn}
              selectedElement={selectedElement}
              onResizeElement={handleElementChange}
              onGestureDetected={handleGestureDetected}
            />
          </div>
        </div>

        <Sidebar
          className="flex-1 overflow-y-auto"
          onAddElement={handleAddElement}
          onToggleGesture={() => setGestureActive((prev) => !prev)}
          onToggleVoice={() => setVoiceActive((prev) => !prev)}
          onToggleTextCommand={() => setTextCommandActive((prev) => !prev)}
          gestureActive={gestureActive}
          voiceActive={voiceActive}
          textCommandActive={textCommandActive}
          selectedShape={selectedShape}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          colorPalette={colorPalette}
          baseColors={baseColors}
        />
      </aside>

      <main className="flex flex-col flex-1">
        <header className="pl-10 bg-gradient-to-r from-blue-500 to-purple-600 p-4 shadow-sm">
          <h1 className="text-2xl font-bold text-white">DesignFlow XR</h1>
          <p className="text-sm text-gray-200">
            Gesture-powered design workspace
          </p>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 relative">
            <Canvas
              elements={elements}
              selectedElement={selectedElement}
              setSelectedElement={setSelectedElement}
              onElementChange={handleElementChange}
              onDeleteElement={handleDeleteElement}
              cursorPosition={cursorPosition}
              onAddElement={handleAddElement}
            />

            {gestureActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded"
              >
                <GestureDetector
                  onGestureDetected={handleGestureDetected}
                  cameraOn={true}
                  selectedElement={selectedElement}
                  onResizeElement={handleElementChange}
                />
              </motion.div>
            )}

            {voiceActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded"
              >
                <VoiceCommands onCommand={handleCommand} />
              </motion.div>
            )}

            {textCommandActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded"
              >
                <TextCommands onCommand={handleCommand} />
              </motion.div>
            )}
          </div>

          <MoodboardPanel
            theme={currentTheme}
            onThemeChange={setCurrentTheme}
            onImageSelect={handleImageSelect}
          />
        </div>
      </main>
    </div>
  );
}

export default SwordsMan;
