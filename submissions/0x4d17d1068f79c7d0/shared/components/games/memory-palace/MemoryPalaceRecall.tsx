"use client";

import React from "react";
import { CulturalTheme } from "../../../config/culturalThemes";

interface MemoryItem {
  id: string;
  name: string;
  emoji: string;
  color: string;
  room: string;
  coordinates: { x: number; y: number };
  culturalContext?: string;
}

interface Room {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  culturalContext?: string;
}

interface MemoryPalaceRecallProps {
  theme: CulturalTheme;
  rooms: Room[];
  items: MemoryItem[];
  userGuesses: string[];
  currentGuess: number;
  timeLeft: number;
  onItemGuess: (itemId: string) => void;
  onCompleteSubmission: (userGuesses: string[]) => void; // New prop for batch submission
  onPlaceItem: (
    itemId: string,
    roomId: string,
    position: { x: number; y: number }
  ) => void;
}

export function MemoryPalaceRecall({
  theme,
  rooms,
  items,
  userGuesses,
  currentGuess,
  timeLeft,
  onItemGuess,
  onCompleteSubmission,
  onPlaceItem,
}: MemoryPalaceRecallProps) {
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null);
  const [placedItems, setPlacedItems] = React.useState<
    Record<string, { roomId: string; position: { x: number; y: number } }>
  >({});
  const [showResults, setShowResults] = React.useState(false);

  // Get items that haven't been placed yet
  const unplacedItems = items.filter((item) => !placedItems[item.id]);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeColor = () => {
    if (timeLeft > 30) return "text-green-600";
    if (timeLeft > 10) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = () => {
    if (timeLeft > 30) return "bg-green-500";
    if (timeLeft > 10) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getItemStatus = (item: MemoryItem, index: number) => {
    if (index < userGuesses.length) {
      const isCorrect = userGuesses[index] === item.id;
      return isCorrect ? "correct" : "incorrect";
    }
    if (index === currentGuess) return "current";
    return "pending";
  };

  // Handle room click to place selected item
  const handleRoomClick = (
    roomId: string,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!selectedItem) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const position = {
      x: Math.max(10, Math.min(90, x)),
      y: Math.max(15, Math.min(85, y)),
    };

    setPlacedItems((prev) => ({
      ...prev,
      [selectedItem]: { roomId, position },
    }));

    setSelectedItem(null);
  };

  // Handle item selection from the item bank
  const handleItemSelect = (itemId: string) => {
    setSelectedItem(selectedItem === itemId ? null : itemId);
  };

  // Check if all items are placed and submit
  const handleSubmit = () => {
    if (Object.keys(placedItems).length === items.length) {
      // Create user guesses in the correct order based on item sequence
      // For memory palace, we need to check if items are placed in correct rooms
      const userGuesses: string[] = [];

      items.forEach((item, index) => {
        const placement = placedItems[item.id];
        if (placement) {
          // Check if item is placed in the correct room
          const isInCorrectRoom = placement.roomId === item.room;
          // For scoring, we pass the item name if correctly placed, empty string if not
          userGuesses.push(isInCorrectRoom ? item.name : "");
        } else {
          userGuesses.push("");
        }
      });

      // Submit all guesses at once using the new handler
      onCompleteSubmission(userGuesses);
      setShowResults(true);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header with Timer and Progress */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
            style={{ backgroundColor: theme.colors.primary }}
          >
            🎯
          </div>
          <div>
            <h2
              className="text-2xl font-bold"
              style={{ color: theme.colors.primary }}
            >
              Memory Palace Recall
            </h2>
            <p className="text-gray-600">Place items where you remember them</p>
          </div>
        </div>

        {/* Timer and Progress */}
        <div className="flex items-center justify-center gap-8 mb-6">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getTimeColor()}`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-600">Time Left</div>
          </div>

          <div className="text-center">
            <div
              className="text-3xl font-bold"
              style={{ color: theme.colors.primary }}
            >
              {Object.keys(placedItems).length}/{items.length}
            </div>
            <div className="text-sm text-gray-600">Items Placed</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-3 mb-4">
          <div
            className={`h-3 rounded-full transition-all duration-1000 ${getProgressColor()}`}
            style={{ width: `${(timeLeft / 60) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Item Bank */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-gray-800 mb-3 text-center">
          🎒 Items to Place
        </h3>
        <div className="flex flex-wrap gap-3 justify-center">
          {unplacedItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemSelect(item.id)}
              className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                selectedItem === item.id
                  ? "border-blue-500 bg-blue-50 shadow-lg"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300"
              }`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: item.color }}
              >
                {item.emoji}
              </div>
              <span className="text-sm font-medium">{item.name}</span>
            </button>
          ))}
        </div>

        {selectedItem && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <div className="text-sm text-blue-700">
              💡 <strong>Selected:</strong>{" "}
              {items.find((i) => i.id === selectedItem)?.name}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Click on a room in the palace below to place this item
            </div>
          </div>
        )}

        {unplacedItems.length === 0 && !showResults && (
          <div className="text-center">
            <div className="text-green-600 font-medium mb-3">
              ✅ All items placed!
            </div>
            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-lg hover:bg-green-700 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center gap-2">
                <span>🏛️</span>
                Submit Memory Palace
              </div>
            </button>
          </div>
        )}

        {showResults && (
          <div className="text-center">
            <div className="text-blue-600 font-medium mb-2">
              📊 Processing results...
            </div>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}
      </div>

      {/* Palace Visualization */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg border-2 border-amber-200 p-3 sm:p-4 lg:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-amber-800 mb-3 sm:mb-4 text-center">
          🏛️{" "}
          {selectedItem
            ? "Click on a room to place the item"
            : "Your Memory Palace"}
        </h3>

        <div className="palace-container">
          {/* Palace background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, ${theme.colors.primary}22 0, ${theme.colors.primary}22 1px, transparent 1px, transparent 20px)`,
              }}
            ></div>
          </div>

          {/* Rooms */}
          {rooms.map((room, roomIndex) => (
            <div
              key={room.id}
              className={`palace-room ${
                selectedItem
                  ? "cursor-pointer hover:bg-blue-50 hover:border-blue-400 bg-white/90"
                  : "bg-white/80 border-gray-300"
              }`}
              style={{
                left: `${room.position.x}%`,
                top: `${room.position.y}%`,
                width: `${room.size.width}%`,
                height: `${room.size.height}%`,
                borderColor: selectedItem ? theme.colors.primary : room.color,
              }}
              onClick={(e) => selectedItem && handleRoomClick(room.id, e)}
            >
              {/* Room label */}
              <div className="palace-room-label">
                <span>
                  {roomIndex + 1}. {room.name}
                </span>
              </div>

              {/* Placed items in this room */}
              {Object.entries(placedItems)
                .filter(([itemId, placement]) => placement.roomId === room.id)
                .map(([itemId, placement]) => {
                  const item = items.find((i) => i.id === itemId);
                  if (!item) return null;

                  return (
                    <div
                      key={itemId}
                      className="palace-item"
                      style={{
                        left: `${placement.position.x}%`,
                        top: `${placement.position.y}%`,
                      }}
                    >
                      <div
                        className="palace-item-icon"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.emoji}
                      </div>
                      <div className="palace-item-name">{item.name}</div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      {/* Placed Items Summary */}
      {Object.keys(placedItems).length > 0 && (
        <div className="bg-white rounded-lg border p-3 sm:p-4">
          <h3 className="font-semibold text-gray-800 mb-3 text-center text-sm sm:text-base">
            📝 Items You've Placed
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {Object.entries(placedItems).map(([itemId, placement]) => {
              const item = items.find((i) => i.id === itemId);
              const room = rooms.find((r) => r.id === placement.roomId);
              if (!item || !room) return null;

              return (
                <div
                  key={itemId}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">in {room.name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-blue-600">💡</span>
          <span className="text-sm text-blue-700">
            {selectedItem
              ? "Click on a room to place the selected item where you remember it"
              : unplacedItems.length > 0
              ? "Select an item from the bank above, then click where you remember placing it"
              : "All items placed! Click Submit to see your results"}
          </span>
        </div>
      </div>
    </div>
  );
}
