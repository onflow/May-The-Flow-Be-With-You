import React, { useState, useEffect, useRef } from 'react';

const SPACE_BG = process.env.PUBLIC_URL + '/space-bg.png';
const ROCKET = process.env.PUBLIC_URL + '/rocket.png';
const PLANETS = [
  process.env.PUBLIC_URL + '/earth.png',
  process.env.PUBLIC_URL + '/moon.png',
  process.env.PUBLIC_URL + '/mars.png',
];
const BG_MUSIC = process.env.PUBLIC_URL + '/sound_effects.mp3';
const LASER_SOUND = process.env.PUBLIC_URL + '/laser.mp3';
const ALIEN_IMG = process.env.PUBLIC_URL + '/alien.png';

const BOOSTER_COST = 10;
const AUTO_THRUSTER_COST = 50;
const GOAL_THRUST = 100; // Goal thrust points to reach 100%
const COMBO_TIMEOUT = 1000; // 1 second to maintain combo
const PARTICLE_COUNT = 20; // Number of particles during launch
const AIM_ALIENS = 10;
const AIM_TIME = 1000;

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
  const [muted, setMuted] = useState(false);
  const audioRef = useRef(null);
  const laserRef = useRef(null);
  const [missionActive, setMissionActive] = useState(false);
  const [alienIndex, setAlienIndex] = useState(0);
  const [alienPos, setAlienPos] = useState({ x: 50, y: 50 });
  const [alienVisible, setAlienVisible] = useState(false);
  const [missionFailed, setMissionFailed] = useState(false);
  const alienTimeout = useRef(null);

  // Play background music on first user interaction
  useEffect(() => {
    const startMusic = () => {
      if (audioRef.current) {
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(() => {});
      }
      window.removeEventListener('pointerdown', startMusic);
    };
    window.addEventListener('pointerdown', startMusic);
    return () => window.removeEventListener('pointerdown', startMusic);
  }, []);

  // Mute/unmute effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
    if (laserRef.current) {
      laserRef.current.muted = muted;
    }
  }, [muted]);

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

    // Add thrust points
    setThrustPoints(tp => tp + clickMultiplier);

    // Add floating text with combo info
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * 30;
    const left = 50 + radius * Math.cos(angle);
    const top = 50 + radius * Math.sin(angle);
    setFloatingTexts(prev => [...prev, {
      id: Date.now(),
      text: `+${clickMultiplier.toFixed(1)}${combo > 1 ? ` (${combo}x)` : ''}`,
      isAuto: false,
      left,
      top,
    }]);

    // Visual feedback
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 100);
  };

  // Purchase booster with visual feedback
  const handlePurchaseBooster = () => {
    if (thrustPoints >= BOOSTER_COST) {
      setThrustPoints(tp => tp - BOOSTER_COST);
      setClickMultiplier(cm => cm + 1);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 200);
    }
  };

  // Purchase auto-thruster with visual feedback
  const handlePurchaseAutoThruster = () => {
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
    if (thrustPoints >= GOAL_THRUST && !isLaunching && !missionActive) {
      setMissionActive(true);
      setAlienIndex(0);
      setMissionFailed(false);
    }
  }, [thrustPoints, isLaunching, missionActive]);

  // Handle mission logic
  useEffect(() => {
    if (!missionActive) return;
    if (missionFailed) return;
    if (alienIndex >= AIM_ALIENS) {
      // Mission success: proceed to takeoff
      setMissionActive(false);
      setIsLaunching(true);
      createParticles();
      setTimeout(() => {
        setThrustPoints(0);
        setIsLaunching(false);
        setParticles([]);
        setPlanetIndex(idx => (idx + 1) % PLANETS.length);
      }, 2000);
      return;
    }
    // Show next alien
    const x = 10 + Math.random() * 80; // 10% to 90%
    const y = 20 + Math.random() * 60; // 20% to 80%
    setAlienPos({ x, y });
    setAlienVisible(true);
    if (alienTimeout.current) clearTimeout(alienTimeout.current);
    alienTimeout.current = setTimeout(() => {
      setAlienVisible(false);
      setMissionFailed(true);
    }, AIM_TIME);
    // Cleanup on unmount
    return () => {
      if (alienTimeout.current) clearTimeout(alienTimeout.current);
    };
  }, [alienIndex, missionActive, missionFailed]);

  // Handle alien click
  const handleAlienClick = () => {
    // Play laser sound
    if (laserRef.current) {
      laserRef.current.currentTime = 0;
      laserRef.current.play().catch(() => {});
    }
    setAlienVisible(false);
    setAlienIndex(idx => idx + 1);
    if (alienTimeout.current) clearTimeout(alienTimeout.current);
  };

  // Reset mission on fail
  useEffect(() => {
    if (missionFailed) {
      setTimeout(() => {
        setMissionActive(false);
        setAlienIndex(0);
        setAlienVisible(false);
        setMissionFailed(false);
      }, 1500);
    }
  }, [missionFailed]);

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
      {/* Background music */}
      <audio ref={audioRef} src={BG_MUSIC} loop style={{ display: 'none' }} />
      {/* Laser sound effect */}
      <audio ref={laserRef} src={LASER_SOUND} style={{ display: 'none' }} />
      <button
        onClick={() => setMuted(m => !m)}
        className="absolute top-4 right-4 z-20 bg-gray-800 bg-opacity-70 rounded-full p-2 hover:bg-gray-700 transition-colors"
        aria-label={muted ? 'Unmute background music' : 'Mute background music'}
      >
        {muted ? (
          <span role="img" aria-label="Unmute">🔈</span>
        ) : (
          <span role="img" aria-label="Mute">🔇</span>
        )}
      </button>

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
            onClick={handlePurchaseBooster}
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
            onClick={handlePurchaseAutoThruster}
            disabled={thrustPoints < AUTO_THRUSTER_COST}
            className="w-full px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Purchase
          </button>
        </div>
      </div>

      {/* Mission Aim Mini-game Overlay */}
      {missionActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-30">
          <div className="text-3xl mb-8">Aim Practice! {missionFailed ? 'Mission Failed!' : `Alien ${alienIndex + 1} / ${AIM_ALIENS}`}</div>
          {alienVisible && !missionFailed && (
            <button
              onClick={handleAlienClick}
              className="absolute"
              style={{
                left: `${alienPos.x}%`,
                top: `${alienPos.y}%`,
                width: 80,
                height: 80,
                transform: 'translate(-50%, -50%)',
                transition: 'left 0.2s, top 0.2s',
                zIndex: 40,
                padding: 0,
                background: 'none',
                border: 'none',
              }}
              aria-label="Alien"
            >
              <img
                src={ALIEN_IMG}
                alt="Alien"
                style={{ width: 80, height: 80, imageRendering: 'pixelated', pointerEvents: 'none' }}
              />
            </button>
          )}
          {missionFailed && (
            <div className="text-xl text-red-400 mt-8">You missed! Try again next launch.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Game; 