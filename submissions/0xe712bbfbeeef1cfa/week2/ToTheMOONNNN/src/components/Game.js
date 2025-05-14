import React, { useState, useEffect } from 'react';

const SPACE_BG = process.env.PUBLIC_URL + '/space-bg.png';
const ROCKET = process.env.PUBLIC_URL + '/rocket.png';
const MOON = process.env.PUBLIC_URL + '/moon.png';

const BOOSTER_COST = 10;
const AUTO_THRUSTER_COST = 50;

const Game = () => {
  const [thrustPoints, setThrustPoints] = useState(0);
  const [clickMultiplier, setClickMultiplier] = useState(1);
  const [autoThrusters, setAutoThrusters] = useState(0);

  // Handle click
  const handleClick = () => {
    setThrustPoints(tp => tp + clickMultiplier);
  };

  // Purchase booster
  const purchaseBooster = () => {
    if (thrustPoints >= BOOSTER_COST) {
      setThrustPoints(tp => tp - BOOSTER_COST);
      setClickMultiplier(cm => cm + 1);
    }
  };

  // Purchase auto-thruster
  const purchaseAutoThruster = () => {
    if (thrustPoints >= AUTO_THRUSTER_COST) {
      setThrustPoints(tp => tp - AUTO_THRUSTER_COST);
      setAutoThrusters(at => at + 1);
    }
  };

  // Passive income effect
  useEffect(() => {
    if (autoThrusters > 0) {
      const interval = setInterval(() => {
        setThrustPoints(tp => tp + autoThrusters);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [autoThrusters]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen text-white relative"
      style={{
        backgroundImage: `url(${SPACE_BG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Moon at the top center */}
      <img
        src={MOON}
        alt="Moon"
        className="absolute top-8 left-1/2 -translate-x-1/2 w-40 h-40"
        style={{ zIndex: 2, imageRendering: 'pixelated' }}
      />

      <div className="text-2xl mb-8 mt-48 z-10">
        Thrust Points: {thrustPoints.toFixed(2)}
      </div>

      {/* Rocket as the clickable button */}
      <button
        onClick={handleClick}
        className="mb-8 focus:outline-none"
        style={{ background: 'none', border: 'none' }}
      >
        <img
          src={ROCKET}
          alt="Rocket"
          className="w-48 h-48 hover:scale-110 transition-transform"
          style={{ imageRendering: 'pixelated' }}
        />
      </button>

      {/* Upgrades UI */}
      <div className="grid grid-cols-2 gap-4 mb-8 z-10">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl mb-2">Booster</h3>
          <p className="mb-2">Cost: {BOOSTER_COST} thrust</p>
          <p className="mb-4">Current multiplier: {clickMultiplier}x</p>
          <button
            onClick={purchaseBooster}
            disabled={thrustPoints < BOOSTER_COST}
            className="w-full px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Purchase
          </button>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl mb-2">Auto-Thruster</h3>
          <p className="mb-2">Cost: {AUTO_THRUSTER_COST} thrust</p>
          <p className="mb-4">Owned: {autoThrusters}</p>
          <button
            onClick={purchaseAutoThruster}
            disabled={thrustPoints < AUTO_THRUSTER_COST}
            className="w-full px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Purchase
          </button>
        </div>
      </div>
    </div>
  );
};

export default Game; 