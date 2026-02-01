"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Download, Menu, X } from 'lucide-react';

const shipData = [
  {
    id: 1,
    name: "PDV >50m SB",
    type: "pdv",
    length: "over50",
    status: "underway",
    aspect: "starboard",
    image: "shipimages/pdv_stbd_over50m_underway_day.png",
    darkImage: "shipimages/pdv_stbd_over50m_underway_night.png"
  },
  {
    id: 2,
    name: "PDV >50m PS",
    type: "pdv",
    length: "over50",
    status: "underway",
    aspect: "port",
    image: "shipimages/pdv_port_over50m_underway_day.png",
    darkImage: "shipimages/pdv_port_over50m_underway_night.png"
  },
  {
    id: 3,
    name: "PDV >50m BOW",
    type: "pdv",
    length: "over50",
    status: "underway",
    aspect: "bow",
    image: "shipimages/pdv_bow_over50m_underway_day.png",
    darkImage: "shipimages/pdv_bow_over50m_underway_night.png"
  },
  {
    id: 4,
    name: "PDV >50m STERN",
    type: "pdv",
    length: "over50",
    status: "underway",
    aspect: "stern",
    image: "shipimages/pdv_stern_over50m_underway_day.png",
    darkImage: "shipimages/pdv_stern_over50m_underway_night.png"
  },
  {
    id: 5,
    name: "PDV <50m STERN",
    type: "pdv",
    length: "under50",
    status: "underway",
    aspect: "stern",
    image: "shipimages/pdv_stern_under50m_underway_day.png",
    darkImage: "shipimages/pdv_stern_under50m_underway_night.png"
  },
  {
    id: 6,
    name: "PDV <50m BOW",
    type: "pdv",
    length: "under50",
    status: "underway",
    aspect: "bow",
    image: "shipimages/pdv_bow_under50m_underway_day.png",
    darkImage: "shipimages/pdv_bow_under50m_underway_night.png"
  },
  {
    id: 7,
    name: "PDV <50m PS",
    type: "pdv",
    length: "under50",
    status: "underway",
    aspect: "port",
    image: "shipimages/pdv_port_under50m_underway_day.png",
    darkImage: "shipimages/pdv_port_under50m_underway_night.png"
  },
  {
    id: 8,
    name: "PDV <50m SB",
    type: "pdv",
    length: "under50",
    status: "underway",
    aspect: "starboard",
    image: "shipimages/pdv_stbd_under50m_underway_day.png",
    darkImage: "shipimages/pdv_stbd_under50m_underway_night.png"
  }
];

const bridgeOptions = [
  { id: 'pdvbridge', name: 'Bridge 1', image: 'shipimages/pdvbridge.png' },
  { id: 'bridge2', name: 'Bridge 2', image: '/api/placeholder/180/120' },
  { id: 'bridge3', name: 'Bridge 3', image: '/api/placeholder/180/120' },
  { id: 'bridge4', name: 'Bridge 4', image: '/api/placeholder/180/120' }
];

const MaritimeWhiteboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bridgeSelectorOpen, setBridgeSelectorOpen] = useState(false);
  const [selectedBridge, setSelectedBridge] = useState('pdvbridge');
  const [placedShips, setPlacedShips] = useState([]);
  const [userId, setUserId] = useState('');
  const [draggingShip, setDraggingShip] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const [filters, setFilters] = useState({
    type: 'all',
    length: 'all',
    status: 'all',
    aspect: 'all'
  });

  const whiteboardRef = useRef(null);

  useEffect(() => {
    const generateUserId = () => {
      const prefixes = ['Cadet', 'Student', 'User', 'Mariner'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      return `${prefix}_${randomNum}`;
    };
    setUserId(generateUserId());
  }, []);

  const filteredShips = shipData.filter(ship => {
    return (filters.type === 'all' || ship.type === filters.type) &&
           (filters.length === 'all' || ship.length === filters.length) &&
           (filters.status === 'all' || ship.status === filters.status) &&
           (filters.aspect === 'all' || ship.aspect === filters.aspect);
  });

  const handleFilterChange = (category, value) => {
    setFilters(prev => ({ ...prev, [category]: value }));
  };

  const handleDragStart = (e, ship) => {
    setDraggingShip(ship);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggingShip) {
      const rect = whiteboardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 150;
      const y = e.clientY - rect.top - 50;
      
      setPlacedShips(prev => [...prev, {
        ...draggingShip,
        x,
        y,
        uniqueId: Date.now()
      }]);
      setDraggingShip(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleShipMouseDown = (e, shipId) => {
    const ship = placedShips.find(s => s.uniqueId === shipId);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDraggingShip({ ...ship, isPlaced: true });
  };

  const handleShipMove = (e) => {
    if (draggingShip && draggingShip.isPlaced) {
      const rect = whiteboardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;
      
      setPlacedShips(prev => prev.map(ship => 
        ship.uniqueId === draggingShip.uniqueId 
          ? { ...ship, x, y }
          : ship
      ));
    }
  };

  const handleMouseUp = () => {
    setDraggingShip(null);
  };

  const handleShipDoubleClick = (shipId) => {
    setPlacedShips(prev => prev.filter(ship => ship.uniqueId !== shipId));
  };

  const clearBoard = () => {
    setPlacedShips([]);
  };

  const downloadImage = async () => {
    // Note: In a real Next.js app, you'd use a library like html2canvas
    alert('Download functionality requires html2canvas library integration');
  };

  const FilterButton = ({ category, value, label }) => (
    <button
      onClick={() => handleFilterChange(category, value)}
      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
        filters[category] === value
          ? 'bg-cyan-600 text-white'
          : isDarkMode 
            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="bg-[#002a3a] text-white px-4 py-3 shadow-lg">
        <h1 className="text-2xl font-bold">Maritime Orals Prep</h1>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Whiteboard Container */}
        <div 
          ref={whiteboardRef}
          className="absolute inset-0"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onMouseMove={handleShipMove}
          onMouseUp={handleMouseUp}
        >
          {/* Sea Background */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-300"
            style={{
              backgroundImage: isDarkMode 
                ? "url('shipimages/sea_night.png')" 
                : "url('shipimages/sea_day.png')"
            }}
          />

          {/* Bridge Overlay */}
          <div 
            className="absolute bottom-0 left-0 w-full h-full bg-no-repeat bg-center bg-bottom pointer-events-none transition-all duration-300"
            style={{
              backgroundImage: isDarkMode 
                ? `url('shipimages/${selectedBridge}night.png')`
                : `url('shipimages/${selectedBridge}.png')`,
              maxWidth: '1920px',
              maxHeight: '851px',
              zIndex: 12
            }}
          />

          {/* Placed Ships */}
          {placedShips.map(ship => (
            <img
              key={ship.uniqueId}
              src={isDarkMode ? ship.darkImage : ship.image}
              alt={ship.name}
              className="absolute w-[300px] h-[100px] cursor-move select-none transition-transform hover:scale-105"
              style={{
                left: `${ship.x}px`,
                top: `${ship.y}px`,
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
                zIndex: 10
              }}
              onMouseDown={(e) => handleShipMouseDown(e, ship.uniqueId)}
              onDoubleClick={() => handleShipDoubleClick(ship.uniqueId)}
            />
          ))}

          {/* User Identifier */}
          <div className={`absolute top-5 left-80 px-4 py-2 font-bold opacity-10 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            User: <span>{userId}</span>
            <p className="text-sm">Made with oralsprep.co.uk</p>
          </div>

          {/* Dark Mode Toggle */}
          <div className={`absolute top-5 left-5 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-colors ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Switch
              id="dark-mode"
              checked={isDarkMode}
              onCheckedChange={setIsDarkMode}
            />
            <Label htmlFor="dark-mode" className="cursor-pointer">Dark Mode</Label>
          </div>

          {/* Download Button */}
          <Button
            onClick={downloadImage}
            className="absolute top-5 left-52 shadow-lg"
            variant="secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Save Image
          </Button>

          {/* Bridge Selector */}
          {bridgeSelectorOpen && (
            <div className={`absolute top-20 left-5 p-4 rounded-lg shadow-xl z-50 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h3 className="text-lg font-bold mb-3">Select Bridge View</h3>
              <div className="grid grid-cols-2 gap-3">
                {bridgeOptions.map(bridge => (
                  <div
                    key={bridge.id}
                    onClick={() => {
                      setSelectedBridge(bridge.id);
                      setBridgeSelectorOpen(false);
                    }}
                    className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedBridge === bridge.id 
                        ? 'border-cyan-600' 
                        : 'border-transparent hover:border-gray-400'
                    }`}
                  >
                    <img src={bridge.image} alt={bridge.name} className="w-full" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-3 z-[13]">
            <Button onClick={() => setBridgeSelectorOpen(!bridgeSelectorOpen)}>
              Change Bridge View
            </Button>
            <Button onClick={clearBoard} variant="destructive">
              Clear Board
            </Button>
          </div>

          {/* Side Menu */}
          <div className={`absolute top-3 right-3 rounded-lg shadow-xl transition-all duration-300 z-50 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } ${menuOpen ? 'w-80 max-h-[80vh]' : 'w-12 h-12'} overflow-hidden`}>
            <Button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-12 h-12 min-w-12 min-h-12 rounded-lg"
              variant="default"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>

            {menuOpen && (
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
                <h3 className="text-xl font-bold mb-4">Ship Library</h3>

                {/* Filters */}
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block font-bold mb-2">Ship Type:</label>
                    <div className="flex flex-wrap gap-2">
                      <FilterButton category="type" value="all" label="All" />
                      <FilterButton category="type" value="pdv" label="PDV" />
                      <FilterButton category="type" value="tanker" label="Tanker" />
                      <FilterButton category="type" value="passenger" label="Passenger" />
                      <FilterButton category="type" value="fishing" label="Fishing" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-2">Length:</label>
                    <div className="flex flex-wrap gap-2">
                      <FilterButton category="length" value="all" label="All" />
                      <FilterButton category="length" value="unknown" label="Unknown" />
                      <FilterButton category="length" value="under50" label="Under 50m" />
                      <FilterButton category="length" value="over50" label="Over 50m" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-2">Status:</label>
                    <div className="flex flex-wrap gap-2">
                      <FilterButton category="status" value="all" label="All" />
                      <FilterButton category="status" value="underway" label="Underway" />
                      <FilterButton category="status" value="anchored" label="Anchored" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-2">Aspect:</label>
                    <div className="flex flex-wrap gap-2">
                      <FilterButton category="aspect" value="all" label="All" />
                      <FilterButton category="aspect" value="port" label="Port" />
                      <FilterButton category="aspect" value="starboard" label="Starboard" />
                      <FilterButton category="aspect" value="bow" label="Bow" />
                      <FilterButton category="aspect" value="stern" label="Stern" />
                    </div>
                  </div>
                </div>

                {/* Ship Gallery */}
                <div className="grid grid-cols-2 gap-3">
                  {filteredShips.map(ship => (
                    <div
                      key={ship.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ship)}
                      className={`p-2 border-2 border-transparent rounded-lg cursor-grab hover:border-cyan-600 transition-colors text-center ${
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      <img 
                        src={isDarkMode ? ship.darkImage : ship.image} 
                        alt={ship.name}
                        className="w-full h-auto"
                      />
                      <p className="text-xs mt-2">{ship.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaritimeWhiteboard;