import React, { useState, useEffect } from 'react';

const SPACE_BG = process.env.PUBLIC_URL + '/space-bg.png';
const ROCKET = process.env.PUBLIC_URL + '/rocket.png';
const MOON = process.env.PUBLIC_URL + '/moon.png';

const BOOSTER_COST = 10;
const AUTO_THRUSTER_COST = 50;
const GOAL_THRUST = 100; // Goal thrust points to reach 100%

const Game = () => {
  const [thrustPoints, setThrustPoints] = useState(0);
  const [clickMultiplier, setClickMultiplier] = useState(1);
  const [autoThrusters, setAutoThrusters] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState([]);

  // Handle click
  const handleClick = () => {
    setThrustPoints(tp => tp + clickMultiplier);
    // Add floating text for click within circular region
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * 30; // 30% of the screen width
    const left = 50 + radius * Math.cos(angle); // Center at 50%
    const top = 50 + radius * Math.sin(angle); // Center at 50%
    setFloatingTexts(prev => [...prev, { id: Date.now(), text: `+${clickMultiplier}`, isAuto: false, left, top }]);
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
        // Add floating text for auto-thrusters within circular region
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * 30; // 30% of the screen width
        const left = 50 + radius * Math.cos(angle); // Center at 50%
        const top = 50 + radius * Math.sin(angle); // Center at 50%
        setFloatingTexts(prev => [...prev, { id: Date.now(), text: `+${autoThrusters}`, isAuto: true, left, top }]);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [autoThrusters]);

  // Check if goal is reached
  useEffect(() => {
    if (thrustPoints >= GOAL_THRUST && !isLaunching) {
      setIsLaunching(true);
      // Reset after animation (e.g., 2 seconds)
      setTimeout(() => {
        setThrustPoints(0);
        setIsLaunching(false);
      }, 2000);
    }
  }, [thrustPoints, isLaunching]);

  // Remove floating texts after animation
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingTexts(prev => prev.filter(text => Date.now() - text.id < 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const progress = Math.min((thrustPoints / GOAL_THRUST) * 100, 100);

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

      {/* Progress bar */}
      <div className="w-full max-w-md h-4 bg-gray-700 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

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
          style={{
            imageRendering: 'pixelated',
            transform: isLaunching ? 'translateY(-200px)' : 'none',
            transition: isLaunching ? 'transform 2s ease-in-out' : 'none',
          }}
        />
      </button>

      {/* Floating texts */}
      {floatingTexts.map(text => (
        <div
          key={text.id}
          className="absolute text-green-500 font-bold animate-float text-2xl"
          style={{
            left: `${text.left}%`,
            top: `${text.top}%`,
            animation: 'float 1s ease-out forwards',
          }}
        >
          {text.text}
        </div>
      ))}

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