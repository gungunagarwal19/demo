import { useState } from 'react';
 import { motion } from 'framer-motion';
 
 const Sidebar = ({
   onAddElement,
   onToggleGesture,
   onToggleVoice,
   onToggleTextCommand,
   gestureActive,
   voiceActive,
   textCommandActive,
   selectedShape,
   selectedColor,
   setSelectedColor,
   colorPalette,
   baseColors
 }) => {
   const [activeTab, setActiveTab] = useState('shapes');
   const [showColorPicker, setShowColorPicker] = useState(false);
   const [customColor, setCustomColor] = useState('#000000');
   const fontStyles = ['Normal', 'Bold', 'Italic', 'Underline', 'Serif', 'Sans-serif', 'Monospace'];
   const textColors = ['#000000', '#FF5252', '#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#FF9800'];
 
   const handleShapeClick = (shape) => {
     onAddElement({ type: shape, color: selectedColor });
   };
 
   const handleCustomColorSelect = () => {
     setSelectedColor(customColor);
     setShowColorPicker(false);
   };
 
   const handleAddTextElement = (type, options) => {
     // Provide clearer placeholder text that users will want to replace
     const defaultText = options.textType === 'heading' ? 'Click to edit heading' : 
                       options.textType === 'subheading' ? 'Click to edit subheading' : 
                       'Click to edit text';
     
     onAddElement('text', {
       ...options,
       text: defaultText,
       width: options.textType === 'heading' ? 300 : 
              options.textType === 'subheading' ? 250 : 200,
       height: options.textType === 'heading' ? 50 : 
               options.textType === 'subheading' ? 40 : 30,
       fill: selectedColor || '#000000'
     });
   };
 
   return (
     <aside className="w-60 bg-gray-800 text-white flex flex-col h-[60%]">
       <div className="p-4 border-b border-gray-700">
         <h2 className="text-xl font-bold">Tools</h2>
       </div>
       
       <div className="flex border-b border-gray-700">
         <button 
           className={`flex-1 p-2 text-sm ${activeTab === 'shapes' ? 'bg-gray-700' : ''}`}
           onClick={() => setActiveTab('shapes')}
         >
           Shapes
         </button>
         <button 
           className={`flex-1 p-2 text-sm ${activeTab === 'fonts' ? 'bg-gray-700' : ''}`}
           onClick={() => setActiveTab('fonts')}
         >
           Fonts
         </button>
         <button 
           className={`flex-1 p-2 text-sm ${activeTab === 'controls' ? 'bg-gray-700' : ''}`}
           onClick={() => setActiveTab('controls')}
         >
           Controls
         </button>
       </div>
       
       <div className="flex-1 overflow-y-auto p-4">
         {activeTab === 'shapes' && (
           <div className="space-y-6">
             {/* Basic Shapes Section */}
             <div>
               <h3 className="text-sm uppercase text-gray-400 mb-2">Basic Shapes</h3>
               <div className="grid grid-cols-2 gap-3">
                 <motion.button
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   className="p-3 bg-gray-700 rounded flex flex-col items-center"
                   onClick={() => handleShapeClick('rectangle')}
                 >
                   <div className="w-8 h-8 rounded mb-1" style={{ backgroundColor: selectedColor || '#2196F3' }} />
                   <span className="text-xs">Rectangle</span>
                 </motion.button>
 
                 <motion.button
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   className="p-3 bg-gray-700 rounded flex flex-col items-center"
                   onClick={() => handleShapeClick('circle')}
                 >
                   <div className="w-8 h-8 rounded-full mb-1" style={{ backgroundColor: selectedColor || '#4CAF50' }} />
                   <span className="text-xs">Circle</span>
                 </motion.button>
               </div>
             </div>
 
             {/* Color Palette Section */}
             <div>
               <h3 className="text-sm uppercase text-gray-400 mb-2">Color Palette</h3>
               
               {/* Color Grid */}
               <div className="grid grid-cols-4 gap-2 mb-4">
                 {colorPalette && colorPalette.length > 0 ? (
                   colorPalette.slice(0, 16).map((color, index) => (
                     <div key={`palette-${index}`} className="flex flex-col items-center">
                       <button
                         className={`w-8 h-8 rounded-full border-2 ${selectedColor === color ? 'border-white' : 'border-gray-600'}`}
                         style={{ backgroundColor: color }}
                         onClick={() => setSelectedColor(color)}
                       />
                       <span className="text-xs mt-1 text-gray-300">{index + 1}</span>
                     </div>
                   ))
                 ) : (
                   ['#FF5252', '#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#FF9800', '#607D8B', '#E91E63'].map(color => (
                     <button
                       key={color}
                       className={`w-8 h-8 rounded-full border ${selectedColor === color ? 'border-white' : 'border-gray-600'}`}
                       style={{ backgroundColor: color }}
                       onClick={() => setSelectedColor(color)}
                     />
                   ))
                 )}
               </div>
 
               {/* CUSTOM Color Option */}
               <div className="mt-4">
                 <button
                   className={`w-full p-2 rounded flex items-center justify-between 
                     ${selectedColor === customColor ? 'bg-blue-600' : 'bg-gray-700'}`}
                   onClick={() => setShowColorPicker(!showColorPicker)}
                 >
                   <span className="font-medium">CUSTOM</span>
                   <div className="w-6 h-6 rounded border border-gray-400" 
                        style={{ backgroundColor: customColor }} />
                 </button>
 
                 {showColorPicker && (
                   <div className="mt-2 p-3 bg-gray-700 rounded-lg">
                     <input
                       type="color"
                       value={customColor}
                       onChange={(e) => setCustomColor(e.target.value)}
                       className="w-full h-10 mb-3 cursor-pointer"
                     />
                     <div className="flex justify-between items-center mb-2">
                       <span className="text-sm">Selected:</span>
                       <span className="text-sm font-mono">{customColor.toUpperCase()}</span>
                     </div>
                     <button
                       className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
                       onClick={handleCustomColorSelect}
                     >
                       APPLY COLOR
                     </button>
                   </div>
                 )}
               </div>
             </div>
           </div>
         )}
 
         {activeTab === 'fonts' && (
           <div className="space-y-4">
             <h3 className="text-sm uppercase text-gray-400">Text Elements</h3>
             <div className="space-y-2">
               <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 className="w-full p-3 bg-gray-700 rounded flex items-center"
                 onClick={() => handleAddTextElement('text', { fontSize: 24, textType: 'heading' })}
               >
                 <span className="text-lg font-bold">Add Heading</span>
               </motion.button>
 
               <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 className="w-full p-3 bg-gray-700 rounded flex items-center"
                 onClick={() => handleAddTextElement('text', { fontSize: 18, textType: 'subheading' })}
               >
                 <span className="text-base font-semibold">Add Subheading</span>
               </motion.button>
 
               <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 className="w-full p-3 bg-gray-700 rounded flex items-center"
                 onClick={() => handleAddTextElement('text', { fontSize: 14, textType: 'text' })}
               >
                 <span className="text-sm">Add Text Box</span>
               </motion.button>
             </div>
 
             <div className="mt-4">
               <h3 className="text-sm uppercase text-gray-400 mb-2">Text Help</h3>
               <div className="bg-gray-700 p-2 rounded text-xs">
                 Click any text element to edit its content. Drag to move and resize.
               </div>
             </div>
 
             <h3 className="text-sm uppercase text-gray-400 mt-6">Font Styles</h3>
             <div className="space-y-2">
               {fontStyles.map(style => (
                 <motion.button
                   key={style}
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   className="w-full p-2 bg-gray-700 rounded flex items-center"
                   onClick={() => onAddElement('fontStyle', { style })}
                 >
                   <span 
                     className={`
                       ${style === 'Bold' ? 'font-bold' : ''}
                       ${style === 'Italic' ? 'italic' : ''}
                       ${style === 'Underline' ? 'underline' : ''}
                       ${style === 'Serif' ? 'font-serif' : ''}
                       ${style === 'Sans-serif' ? 'font-sans' : ''}
                       ${style === 'Monospace' ? 'font-mono' : ''}
                     `}
                   >
                     {style}
                   </span>
                 </motion.button>
               ))}
             </div>
             
             <h3 className="text-sm uppercase text-gray-400 mt-6">Text Colors</h3>
             <div className="grid grid-cols-4 gap-2 mt-2">
               {textColors.map(color => (
                 <button
                   key={color}
                   className={`w-8 h-8 rounded-full border ${selectedColor === color ? 'border-white' : 'border-gray-600'}`}
                   style={{ backgroundColor: color }}
                   onClick={() => onAddElement('textColor', { color })}
                 />
               ))}
             </div>
           </div>
         )}
         
         {activeTab === 'controls' && (
           <div className="space-y-4">
             <h3 className="text-sm uppercase text-gray-400">Input Methods</h3>
             <div className="space-y-2">
               <button 
                 className={`w-full p-3 rounded flex items-center justify-between ${gestureActive ? 'bg-blue-600' : 'bg-gray-700'}`}
                 onClick={onToggleGesture}
               >
                 <span>Gesture Control</span>
                 <span className={`px-2 py-1 text-xs rounded ${gestureActive ? 'bg-blue-800' : 'bg-gray-800'}`}>
                   {gestureActive ? 'ON' : 'OFF'}
                 </span>
               </button>
               
               <button 
                 className={`w-full p-3 rounded flex items-center justify-between ${voiceActive ? 'bg-blue-600' : 'bg-gray-700'}`}
                 onClick={onToggleVoice}
               >
                 <span>Voice Commands</span>
                 <span className={`px-2 py-1 text-xs rounded ${voiceActive ? 'bg-blue-800' : 'bg-gray-800'}`}>
                   {voiceActive ? 'ON' : 'OFF'}
                 </span>
               </button>
               
               <button 
                 className={`w-full p-3 rounded flex items-center justify-between ${textCommandActive ? 'bg-blue-600' : 'bg-gray-700'}`}
                 onClick={onToggleTextCommand}
               >
                 <span>Text Commands</span>
                 <span className={`px-2 py-1 text-xs rounded ${textCommandActive ? 'bg-blue-800' : 'bg-gray-800'}`}>
                   {textCommandActive ? 'ON' : 'OFF'}
                 </span>
               </button>
             </div>
             
             <h3 className="text-sm uppercase text-gray-400 mt-6">Help</h3>
             <button className="w-full p-3 bg-gray-700 rounded text-left">
               Gesture Guide
             </button>
             <button className="w-full p-3 bg-gray-700 rounded text-left">
               Voice Commands
             </button>
             <button className="w-full p-3 bg-gray-700 rounded text-left">
               Text Commands
             </button>
           </div>
         )}
       </div>
       
       <div className="p-4 border-t border-gray-700">
         <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium">
           Export Design
         </button>
       </div>
     </aside>
   );
 };
 
 export default Sidebar;