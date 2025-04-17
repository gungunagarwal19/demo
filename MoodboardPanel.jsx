import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ColorThief from 'colorthief';

const UNSPLASH_ACCESS_KEY = 'vOuI192okiXew86U_BevSN75lvus4U3L2xR5ZtClIY8';

const MoodboardPanel = ({ theme, onThemeChange, onImageSelect, selectedCanvasElement }) => {
  const [colorPalette, setColorPalette] = useState([]);
  const [defaultColorPalette, setDefaultColorPalette] = useState([]);
  const [images, setImages] = useState([]);
  const [fonts, setFonts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const colorThief = useRef(new ColorThief());

  useEffect(() => {
    setIsLoading(true);
    
    let themeColors = [];
    let themeFonts = [];
    
    if (theme === 'minimal') {
      themeColors = ['#FFFFFF', '#F5F5F5', '#E0E0E0', '#BDBDBD', '#212121'];
      themeFonts = ['Inter', 'Roboto', 'Montserrat'];
    } else if (theme === 'bold') {
      themeColors = ['#F44336', '#2196F3', '#FFC107', '#000000', '#FFFFFF'];
      themeFonts = ['Bebas Neue', 'Oswald', 'Montserrat'];
    } else if (theme === 'natural') {
      themeColors = ['#8BC34A', '#795548', '#CDDC39', '#3E2723', '#F1F8E9'];
      themeFonts = ['Playfair Display', 'Merriweather', 'Lora'];
    }

    setColorPalette(themeColors);
    setDefaultColorPalette(themeColors);
    setFonts(themeFonts);

    fetchImages('design');
  }, [theme]);

  const rgbToHex = (r, g, b) => {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  };

  const extractColorsFromImage = (imageElement) => {
    try {
      const colorPalette = colorThief.current.getPalette(imageElement, 5);
      return colorPalette.map(color => rgbToHex(color[0], color[1], color[2]));
    } catch (error) {
      console.error('Error extracting colors:', error);
      return null;
    }
  };

  const handleImageLoad = (event, imageId) => {
    const imageElement = event.target;
    
    if (imageElement.complete && imageElement.naturalHeight !== 0) {
      if (imageElement.crossOrigin !== 'Anonymous') {
        imageElement.crossOrigin = 'Anonymous';
        imageElement.src = imageElement.src;
        return;
      }
      
      const extractedColors = extractColorsFromImage(imageElement);
      
      if (extractedColors && extractedColors.length) {
        if (selectedImage && selectedImage.id === imageId) {
          setColorPalette(extractedColors);
        }
      }
    }
  };

  const fetchImages = async (query) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=8&client_id=${UNSPLASH_ACCESS_KEY}`
      );
      const data = await response.json();
      const imageData = data.results.map((img) => ({
        url: img.urls.small,
        id: img.id,
        alt: img.alt_description || 'Moodboard image'
      }));
      setImages(imageData);
    } catch (error) {
      console.error('Error fetching Unsplash images:', error);
      const mockImages = [
        'https://source.unsplash.com/random/150x150/?design',
        'https://source.unsplash.com/random/150x150/?art',
        'https://source.unsplash.com/random/150x150/?pattern',
        'https://source.unsplash.com/random/150x150/?texture',
      ].map((url, index) => ({
        url,
        id: `mock-${index}`,
        alt: `Mock image ${index + 1}`
      }));
      setImages(mockImages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchQuery(searchInput);
      fetchImages(searchInput);
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    
    const imgElement = document.getElementById(`image-${image.id}`);
    
    if (imgElement && imgElement.complete) {
      const extractedColors = extractColorsFromImage(imgElement);
      
      if (extractedColors && extractedColors.length) {
        setColorPalette(extractedColors);
      }
    }
    
    if (onImageSelect) {
      onImageSelect({
        type: 'image',
        url: image.url,
        alt: image.alt
      });
    }
  };

  const handleRefreshImages = () => {
    const query = searchQuery || theme;
    fetchImages(query);
  };

  const handleColorSelect = (color) => {
    if (selectedCanvasElement) {
      // Apply color to the selected canvas element based on its type
      const updatedElement = { ...selectedCanvasElement };
      
      if (selectedCanvasElement.type === 'text') {
        updatedElement.fill = color;
      } else if (selectedCanvasElement.type === 'rectangle' || 
                 selectedCanvasElement.type === 'circle' ||
                 selectedCanvasElement.type === 'custom') {
        updatedElement.fill = color;
      } else if (selectedCanvasElement.type === 'image') {
        // For images, we might want to apply a tint or overlay
        updatedElement.tint = color;
      }
      
      // Create and dispatch a custom event for better communication
      const event = new CustomEvent('moodboard_action', {
        detail: {
          type: 'update-element',
          element: updatedElement
        }
      });
      window.dispatchEvent(event);
      
      // Also call the original onImageSelect function for backwards compatibility
      if (onImageSelect) {
        onImageSelect({
          type: 'update-element',
          element: updatedElement
        });
      }
    } else {
      // Create a new rectangle element with the selected color
      const newElement = {
        type: 'rectangle',
        id: Date.now(),
        x: 100,
        y: 100,
        width: 150,
        height: 150,
        fill: color,
      };
      
      // Create and dispatch a custom event
      const event = new CustomEvent('moodboard_action', {
        detail: {
          type: 'add-element',
          element: newElement
        }
      });
      window.dispatchEvent(event);
      
      // Also call the original onImageSelect function for backwards compatibility
      if (onImageSelect) {
        onImageSelect({
          type: 'add-element',
          element: newElement
        });
      }
    }
  };

  const handleFontSelect = (font) => {
    // Create a new text element with the selected font
    const newElement = {
      type: 'text',
      id: Date.now(),
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      text: 'Double-click to edit text',
      fontSize: 16,
      fill: '#000000',
      fontStyle: font.includes('Serif') ? 'Serif' : 
                font.includes('Sans') ? 'Sans-serif' : 
                font.includes('Mono') ? 'Monospace' : 'Sans-serif'
    };
    
    if (onImageSelect) {
      onImageSelect({
        type: 'element',
        element: newElement
      });
    }
  };

  const resetColorPalette = () => {
    setColorPalette(defaultColorPalette);
    setSelectedImage(null);
  };

  return (
    <motion.div
      initial={{ width: "100%", translateX: 0 }}
      animate={{ 
        width: isPanelOpen ? "100%" : "50px",
        translateX: isPanelOpen ? 0 : 0,
      }}
      className="bg-white border-l border-gray-200 h-full overflow-hidden flex"
    >
      <motion.button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="h-full w-10 bg-gray-100 flex items-center justify-center z-10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: isPanelOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
        >
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </motion.button>

      {isPanelOpen && (
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3">Theme</h2>
            <select
              value={theme}
              onChange={(e) => onThemeChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="minimal">Minimal</option>
              <option value="bold">Bold</option>
              <option value="natural">Natural</option>
            </select>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold">Color Palette</h2>
              {selectedImage && (
                <button 
                  onClick={resetColorPalette}
                  className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                >
                  Reset
                </button>
              )}
            </div>
            {selectedImage && <p className="text-xs mb-2 text-gray-500">Colors from selected image</p>}
            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="flex space-x-2">
                {colorPalette.map((color, index) => (
                  <div
                    key={index}
                    className="h-8 w-8 rounded-full border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                    title={color}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2">Moodboard</h2>
            <form onSubmit={handleSearch} className="mb-2 flex space-x-2">
              <input
                type="text"
                placeholder="Search images..."
                className="flex-1 p-2 border border-gray-300 rounded"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button
                type="submit"
                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Go
              </button>
            </form>

            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {images.map((img) => (
                  <div 
                    key={img.id} 
                    className={`aspect-square bg-gray-100 rounded overflow-hidden cursor-pointer hover:opacity-80 ${
                      selectedImage && selectedImage.id === img.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleImageClick(img)}
                  >
                    <img 
                      id={`image-${img.id}`}
                      src={img.url} 
                      alt={img.alt} 
                      className="w-full h-full object-cover" 
                      crossOrigin="Anonymous"
                      onLoad={(e) => handleImageLoad(e, img.id)}
                    />
                  </div>
                ))}
              </div>
            )}
            
            <button 
              onClick={handleRefreshImages}
              className="mt-2 w-full p-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            >
              Refresh Images
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3">Font Suggestions</h2>
            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {fonts.map((font, index) => (
                  <div
                    key={index}
                    className="p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50 hover:shadow-sm transition-all"
                    onClick={() => handleFontSelect(font)}
                  >
                    <span style={{ fontFamily: font }}>{font}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MoodboardPanel;
