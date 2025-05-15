import React, { useState, useEffect } from 'react';

const SPACE_BG = process.env.PUBLIC_URL + '/space-bg.png';
const ROCKET = process.env.PUBLIC_URL + '/rocket.png';
const PLANETS = [
  process.env.PUBLIC_URL + '/earth.png',
  process.env.PUBLIC_URL + '/moon.png',
  process.env.PUBLIC_URL + '/mars.png',
];

const BOOSTER_COST = 10;
const AUTO_THRUSTER_COST = 50;
const GOAL_THRUST = 100; // Goal thrust points to reach 100%
const COMBO_TIMEOUT = 1000; // 1 second to maintain combo
const PARTICLE_COUNT = 20; // Number of particles during launch

const Game = () => {
  const [thrustPoints, setThrustPoints] = useState(0);
  const [clickMultiplier, setClickMultiplier] = useState(1);
  const [autoThrusters, setAutoThrusters] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [combo, setCombo] = useState(0);
  const [particles, setParticles] = useState([]);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [planetIndex, setPlanetIndex] = useState(0);

  // Create particles for launch effect
  const createParticles = () => {
    const newParticles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: Date.now() + i,
      x: 50, // Center x
      y: 50, // Center y
      angle: Math.random() * Math.PI * 2,
      speed: 2 + Math.random() * 3,
      size: 2 + Math.random() * 4,
      color: `hsl(${Math.random() * 60 + 20}, 100%, 50%)`, // Orange to yellow
    }));
    setParticles(newParticles);
  };

  // Handle click with combo system
  const handleClick = () => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;
    setLastClickTime(now);

    // Update combo
    if (timeSinceLastClick < COMBO_TIMEOUT) {
      setCombo(c => c + 1);
    } else {
      setCombo(1);
    }

    // Calculate points with combo multiplier
    const comboMultiplier = Math.min(1 + (combo * 0.1), 3); // Max 3x multiplier
    const points = clickMultiplier * comboMultiplier;
    
    setThrustPoints(tp => tp + points);

    // Add floating text with combo info
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * 30;
    const left = 50 + radius * Math.cos(angle);
    const top = 50 + radius * Math.sin(angle);
    setFloatingTexts(prev => [...prev, {
      id: Date.now(),
      text: `+${points.toFixed(1)}${combo > 1 ? ` (${combo}x)` : ''}`,
      isAuto: false,
      left,
      top,
    }]);

    // Visual feedback
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 100);
  };

  // Purchase booster with visual feedback
  const purchaseBooster = () => {
    if (thrustPoints >= BOOSTER_COST) {
      setThrustPoints(tp => tp - BOOSTER_COST);
      setClickMultiplier(cm => cm + 1);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 200);
    }
  };

  // Purchase auto-thruster with visual feedback
  const purchaseAutoThruster = () => {
    if (thrustPoints >= AUTO_THRUSTER_COST) {
      setThrustPoints(tp => tp - AUTO_THRUSTER_COST);
      setAutoThrusters(at => at + 1);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 200);
    }
  };

  // Passive income effect
  useEffect(() => {
    if (autoThrusters > 0) {
      const interval = setInterval(() => {
        setThrustPoints(tp => tp + autoThrusters);
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * 30;
        const left = 50 + radius * Math.cos(angle);
        const top = 50 + radius * Math.sin(angle);
        setFloatingTexts(prev => [...prev, {
          id: Date.now(),
          text: `+${autoThrusters}`,
          isAuto: true,
          left,
          top,
        }]);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [autoThrusters]);

  // Check if goal is reached
  useEffect(() => {
    if (thrustPoints >= GOAL_THRUST && !isLaunching) {
      setIsLaunching(true);
      createParticles();
      setTimeout(() => {
        setThrustPoints(0);
        setIsLaunching(false);
        setParticles([]);
        setPlanetIndex(idx => (idx + 1) % PLANETS.length); // Rotate planet
      }, 2000);
    }
  }, [thrustPoints, isLaunching]);

  // Update particles
  useEffect(() => {
    if (particles.length > 0) {
      const interval = setInterval(() => {
        setParticles(prev => prev.map(p => ({
          ...p,
          x: p.x + Math.cos(p.angle) * p.speed,
          y: p.y + Math.sin(p.angle) * p.speed,
          size: p.size * 0.95,
        })).filter(p => p.size > 0.5));
      }, 16);
      return () => clearInterval(interval);
    }
  }, [particles]);

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
      {/* Rotating planet at the top center */}
      <img
        src={PLANETS[planetIndex]}
        alt="Planet"
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
        {combo > 1 && (
          <span className="ml-2 text-yellow-400 animate-pulse">
            {combo}x Combo!
          </span>
        )}
      </div>

      {/* Rocket as the clickable button */}
      <button
        onClick={handleClick}
        className={`mb-8 focus:outline-none transition-transform ${isShaking ? 'scale-110' : ''}`}
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

      {/* Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

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