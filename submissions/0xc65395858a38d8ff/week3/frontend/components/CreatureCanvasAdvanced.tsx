'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Box, Flex, Button, ButtonGroup, Tag, Text } from '@chakra-ui/react';

// Interfaces
interface CreatureUIDataFrontend {
  id: number;
  name: string;
  description: string;
  thumbnail: string;
  edadDiasCompletos: string; 
  lifespanTotalSimulatedDays: string; 
  puntosEvolucion: string; 
  genesVisibles: { [key: string]: string }; 
  initialSeed: number; 
  seedChangeCount: string; 
  estaViva: boolean;
  genesOcultos: { [key: string]: string };
}

interface CreatureCanvasAdvancedProps {
  creatures: CreatureUIDataFrontend[];
  canvasWidth?: number;
  canvasHeight?: number;
  showTrails?: boolean;
  showParticles?: boolean;
  showGrid?: boolean;
  animationSpeed?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'energy' | 'evolution' | 'death' | 'birth';
}

interface CreatureVisualAdvanced {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  rotation: number;
  scale: number;
  baseScale: number;
  pulsePhase: number;
  trailPoints: { x: number; y: number; alpha: number }[];
  particles: Particle[];
  hue: number;
  saturation: number;
  lightness: number;
  energy: number;
  
  // Movement pattern
  movementType: number;
  movementIntensity: number;
  movementTimer: number;
  
  // Shape properties
  shapeType: number;
  numAppendages: number;
  appendageLength: number;
  appendageAngle: number;
  
  // Evolution visual state
  isEvolving: boolean;
  evolutionIntensity: number;
  lastEvolutionTime: number;
}

// Utility functions
const parseFloatSafe = (value: string | undefined, defaultValue = 0.0): number => {
  if (value === undefined || value === null || typeof value === 'string' && value.trim() === '') {
    return defaultValue;
  }
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const createGradient = (
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  radius: number, 
  color1: string, 
  color2: string
): CanvasGradient => {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  return gradient;
};

// Particle system
const createParticle = (
  x: number, 
  y: number, 
  type: Particle['type'], 
  color: string
): Particle => {
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.5 + Math.random() * 2;
  
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 1,
    maxLife: 60 + Math.random() * 60,
    size: 1 + Math.random() * 3,
    color,
    type
  };
};

const updateParticle = (particle: Particle): boolean => {
  particle.x += particle.vx;
  particle.y += particle.vy;
  particle.vx *= 0.98; // Drag
  particle.vy *= 0.98;
  particle.life--;
  
  if (particle.type === 'energy') {
    particle.vy -= 0.02; // Float upward
  }
  
  return particle.life > 0;
};

const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle): void => {
  const alpha = particle.life / particle.maxLife;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

// Advanced drawing functions
const drawCreatureBody = (
  ctx: CanvasRenderingContext2D,
  visual: CreatureVisualAdvanced,
  time: number
): void => {
  ctx.save();
  ctx.translate(visual.x, visual.y);
  ctx.rotate(visual.rotation);
  
  const scale = visual.scale * (1 + Math.sin(visual.pulsePhase) * 0.1);
  ctx.scale(scale, scale);
  
  // Main body
  const bodyRadius = 20;
  const hslColor = `hsl(${visual.hue}, ${visual.saturation}%, ${visual.lightness}%)`;
  
  // Outer glow
  if (visual.isEvolving) {
    ctx.shadowColor = hslColor;
    ctx.shadowBlur = 20 + Math.sin(time * 0.1) * 10;
  }
  
  // Body gradient
  const gradient = createGradient(
    ctx, 0, 0, bodyRadius,
    `hsla(${visual.hue}, ${visual.saturation}%, ${visual.lightness + 20}%, 0.9)`,
    `hsla(${visual.hue}, ${visual.saturation}%, ${visual.lightness - 20}%, 0.7)`
  );
  
  ctx.fillStyle = gradient;
  
  // Draw body based on shape type
  ctx.beginPath();
  switch (visual.shapeType) {
    case 0: // Circle
      ctx.arc(0, 0, bodyRadius, 0, Math.PI * 2);
      break;
    case 1: // Square
      ctx.rect(-bodyRadius, -bodyRadius, bodyRadius * 2, bodyRadius * 2);
      break;
    case 2: // Triangle
      ctx.moveTo(0, -bodyRadius);
      ctx.lineTo(-bodyRadius * 0.866, bodyRadius * 0.5);
      ctx.lineTo(bodyRadius * 0.866, bodyRadius * 0.5);
      ctx.closePath();
      break;
    default: // Organic shape
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const radius = bodyRadius * (0.8 + 0.4 * Math.sin(time * 0.05 + i));
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
  }
  ctx.fill();
  
  // Inner core
  ctx.fillStyle = `hsla(${visual.hue + 30}, 90%, 70%, 0.8)`;
  ctx.beginPath();
  ctx.arc(0, 0, bodyRadius * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  // Appendages
  for (let i = 0; i < visual.numAppendages; i++) {
    const angle = (i / visual.numAppendages) * Math.PI * 2 + visual.appendageAngle;
    const length = visual.appendageLength * (0.8 + 0.4 * Math.sin(time * 0.08 + i));
    
    ctx.save();
    ctx.rotate(angle);
    ctx.translate(bodyRadius, 0);
    
    // Appendage body
    ctx.fillStyle = `hsla(${visual.hue - 30}, ${visual.saturation}%, ${visual.lightness}%, 0.7)`;
    ctx.beginPath();
    ctx.ellipse(0, 0, length, length * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Appendage tip
    ctx.fillStyle = `hsla(${visual.hue + 60}, 80%, 60%, 0.9)`;
    ctx.beginPath();
    ctx.arc(length * 0.7, 0, length * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  ctx.restore();
};

const drawCreatureTrail = (
  ctx: CanvasRenderingContext2D,
  visual: CreatureVisualAdvanced
): void => {
  if (visual.trailPoints.length < 2) return;
  
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  for (let i = 1; i < visual.trailPoints.length; i++) {
    const point = visual.trailPoints[i];
    const prevPoint = visual.trailPoints[i - 1];
    
    ctx.globalAlpha = point.alpha;
    ctx.strokeStyle = `hsl(${visual.hue}, ${visual.saturation}%, ${visual.lightness}%)`;
    ctx.lineWidth = (point.alpha * 3) + 1;
    
    ctx.beginPath();
    ctx.moveTo(prevPoint.x, prevPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }
  
  ctx.restore();
};

const drawUI = (
  ctx: CanvasRenderingContext2D,
  visual: CreatureVisualAdvanced,
  creature: CreatureUIDataFrontend
): void => {
  const x = visual.x;
  const y = visual.y - 40;
  
  // ID and name
  ctx.save();
  ctx.fillStyle = 'white';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`#${creature.id}`, x, y);
  
  // Health/energy bar
  const barWidth = 30;
  const barHeight = 4;
  const energy = visual.energy;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(x - barWidth/2, y + 5, barWidth, barHeight);
  
  ctx.fillStyle = `hsl(${120 * energy}, 80%, 50%)`;
  ctx.fillRect(x - barWidth/2, y + 5, barWidth * energy, barHeight);
  
  ctx.restore();
};

export default function CreatureCanvasAdvanced({
  creatures,
  canvasWidth = 800,
  canvasHeight = 600,
  showTrails: initialShowTrails = true,
  showParticles: initialShowParticles = true,
  showGrid: initialShowGrid = false,
  animationSpeed = 1
}: CreatureCanvasAdvancedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [visualsMap, setVisualsMap] = useState<Map<number, CreatureVisualAdvanced>>(new Map());
  const [isPlaying, setIsPlaying] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [showTrails, setShowTrails] = useState(initialShowTrails);
  const [showParticles, setShowParticles] = useState(initialShowParticles);
  const [showGrid, setShowGrid] = useState(initialShowGrid);
  
  // Initialize creature visuals
  const initializeVisual = useCallback((creature: CreatureUIDataFrontend, index: number): CreatureVisualAdvanced => {
    const colorR = parseFloatSafe(creature.genesVisibles.colorR, 0.5);
    const colorG = parseFloatSafe(creature.genesVisibles.colorG, 0.5);
    const colorB = parseFloatSafe(creature.genesVisibles.colorB, 0.5);
    
    // Convert RGB to HSL
    const max = Math.max(colorR, colorG, colorB);
    const min = Math.min(colorR, colorG, colorB);
    const lightness = (max + min) / 2;
    
    let hue = 0;
    let saturation = 0;
    
    if (max !== min) {
      const delta = max - min;
      saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
      
      switch (max) {
        case colorR: hue = (colorG - colorB) / delta + (colorG < colorB ? 6 : 0); break;
        case colorG: hue = (colorB - colorR) / delta + 2; break;
        case colorB: hue = (colorR - colorG) / delta + 4; break;
      }
      hue /= 6;
    }
    
    const tamanoBase = parseFloatSafe(creature.genesVisibles.tamanoBase, 1.5);
    const formaPrincipal = parseFloatSafe(creature.genesVisibles.formaPrincipal, 1.0);
    const numApendices = parseFloatSafe(creature.genesVisibles.numApendices, 0);
    const patronMovimiento = parseFloatSafe(creature.genesVisibles.patronMovimiento, 1.0);
    
    const x = 100 + (index % 4) * 150;
    const y = 100 + Math.floor(index / 4) * 150;
    
    return {
      id: creature.id,
      x,
      y,
      targetX: x,
      targetY: y,
      vx: 0,
      vy: 0,
      rotation: 0,
      scale: tamanoBase * 0.5,
      baseScale: tamanoBase * 0.5,
      pulsePhase: Math.random() * Math.PI * 2,
      trailPoints: [],
      particles: [],
      hue: hue * 360,
      saturation: saturation * 100,
      lightness: lightness * 100,
      energy: parseFloatSafe(creature.puntosEvolucion, 0) / 100,
      
      movementType: Math.floor(patronMovimiento) % 4,
      movementIntensity: patronMovimiento - Math.floor(patronMovimiento),
      movementTimer: 0,
      
      shapeType: Math.floor(formaPrincipal) % 4,
      numAppendages: Math.floor(numApendices),
      appendageLength: 15 + (numApendices % 1) * 10,
      appendageAngle: 0,
      
      isEvolving: false,
      evolutionIntensity: 0,
      lastEvolutionTime: 0
    };
  }, []);
  
  // Update creature visuals
  const updateVisuals = useCallback((time: number) => {
    setVisualsMap(prev => {
      const newMap = new Map(prev);
      
      creatures.forEach((creature, index) => {
        if (!creature.estaViva) return;
        
        let visual = newMap.get(creature.id);
        if (!visual) {
          visual = initializeVisual(creature, index);
          newMap.set(creature.id, visual);
        }
        
        // Update animation
        visual.pulsePhase += 0.05 * animationSpeed;
        visual.appendageAngle += 0.02 * animationSpeed;
        visual.movementTimer += 1;
        
        // Update movement
        switch (visual.movementType) {
          case 0: // Static float
            visual.y += Math.sin(time * 0.001 + visual.id) * 0.5;
            break;
          case 1: // Circular
            const radius = 50 + visual.movementIntensity * 50;
            visual.targetX = canvasWidth/2 + Math.cos(time * 0.001) * radius;
            visual.targetY = canvasHeight/2 + Math.sin(time * 0.001) * radius;
            break;
          case 2: // Patrol
            if (visual.movementTimer % 300 === 0) {
              visual.targetX = 50 + Math.random() * (canvasWidth - 100);
              visual.targetY = 50 + Math.random() * (canvasHeight - 100);
            }
            break;
          case 3: // Erratic
            if (visual.movementTimer % 60 === 0) {
              visual.targetX = visual.x + (Math.random() - 0.5) * 100;
              visual.targetY = visual.y + (Math.random() - 0.5) * 100;
            }
            break;
        }
        
        // Smooth movement to target
        visual.vx = lerp(visual.vx, (visual.targetX - visual.x) * 0.02, 0.1);
        visual.vy = lerp(visual.vy, (visual.targetY - visual.y) * 0.02, 0.1);
        visual.x += visual.vx;
        visual.y += visual.vy;
        
        // Keep in bounds
        visual.x = Math.max(50, Math.min(canvasWidth - 50, visual.x));
        visual.y = Math.max(50, Math.min(canvasHeight - 50, visual.y));
        
        // Update trail
        if (showTrails) {
          visual.trailPoints.unshift({ x: visual.x, y: visual.y, alpha: 1 });
          if (visual.trailPoints.length > 20) {
            visual.trailPoints.pop();
          }
          
          visual.trailPoints.forEach((point, i) => {
            point.alpha = 1 - (i / visual.trailPoints.length);
          });
        }
        
        // Update particles
        if (showParticles) {
          // Add energy particles
          if (visual.movementTimer % 10 === 0 && visual.energy > 0.1) {
            visual.particles.push(createParticle(
              visual.x + (Math.random() - 0.5) * 40,
              visual.y + (Math.random() - 0.5) * 40,
              'energy',
              `hsl(${visual.hue}, 80%, 70%)`
            ));
          }
          
          // Update existing particles
          visual.particles = visual.particles.filter(updateParticle);
        }
        
        // Update evolution state
        const currentEP = parseFloatSafe(creature.puntosEvolucion, 0);
        if (currentEP > visual.lastEvolutionTime + 10) {
          visual.isEvolving = true;
          visual.evolutionIntensity = 1;
          visual.lastEvolutionTime = currentEP;
        }
        
        if (visual.isEvolving) {
          visual.evolutionIntensity *= 0.98;
          if (visual.evolutionIntensity < 0.1) {
            visual.isEvolving = false;
          }
        }
        
        visual.energy = Math.min(1, currentEP / 100);
      });
      
      // Remove dead creatures
      const aliveIds = new Set(creatures.filter(c => c.estaViva).map(c => c.id));
      newMap.forEach((_, id) => {
        if (!aliveIds.has(id)) {
          newMap.delete(id);
        }
      });
      
      return newMap;
    });
  }, [creatures, canvasWidth, canvasHeight, showTrails, showParticles, animationSpeed, initializeVisual]);
  
  // Render function
  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = 'rgba(15, 15, 35, 0.1)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvasWidth; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
      }
      for (let y = 0; y < canvasHeight; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }
    }
    
    // Draw creatures
    visualsMap.forEach((visual, id) => {
      const creature = creatures.find(c => c.id === id);
      if (!creature || !creature.estaViva) return;
      
      // Draw trail
      if (showTrails) {
        drawCreatureTrail(ctx, visual);
      }
      
      // Draw particles
      if (showParticles) {
        visual.particles.forEach(particle => drawParticle(ctx, particle));
      }
      
      // Draw creature body
      drawCreatureBody(ctx, visual, time);
      
      // Draw UI
      drawUI(ctx, visual, creature);
    });
    
    // Debug info
    if (showDebug) {
      ctx.fillStyle = 'white';
      ctx.font = '12px monospace';
      ctx.fillText(`FPS: ${Math.round(1000 / 16)}`, 10, 20);
      ctx.fillText(`Creatures: ${visualsMap.size}`, 10, 35);
      ctx.fillText(`Particles: ${Array.from(visualsMap.values()).reduce((sum, v) => sum + v.particles.length, 0)}`, 10, 50);
    }
  }, [canvasWidth, canvasHeight, showGrid, showTrails, showParticles, visualsMap, creatures, showDebug]);
  
  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;
    
    let lastTime = 0;
    const animate = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;
      
      updateVisuals(time);
      render(time);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updateVisuals, render]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Flex direction="column" gap={4}>
        {/* Controls */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
          <ButtonGroup size="sm" isAttached variant="outline">
            <Button 
              onClick={() => setIsPlaying(!isPlaying)}
              colorScheme={isPlaying ? "red" : "green"}
            >
              {isPlaying ? "Pause" : "Play"}
            </Button>
            <Button onClick={() => setShowDebug(!showDebug)}>
              Debug
            </Button>
          </ButtonGroup>
          
          <Flex gap={2} wrap="wrap">
            <Tag 
              size="sm" 
              colorScheme={showTrails ? "blue" : "gray"}
              cursor="pointer"
              onClick={() => setShowTrails(!showTrails)}
            >
              Trails
            </Tag>
            <Tag 
              size="sm" 
              colorScheme={showParticles ? "purple" : "gray"}
              cursor="pointer"
              onClick={() => setShowParticles(!showParticles)}
            >
              Particles
            </Tag>
            <Tag 
              size="sm" 
              colorScheme={showGrid ? "green" : "gray"}
              cursor="pointer"
              onClick={() => setShowGrid(!showGrid)}
            >
              Grid
            </Tag>
          </Flex>
        </Flex>
        
        {/* Canvas */}
        <Box
          borderRadius="lg"
          overflow="hidden"
          boxShadow="0 10px 40px rgba(0, 0, 0, 0.3)"
          bg="gray.900"
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            style={{
              display: 'block',
              background: 'linear-gradient(45deg, #0f0f23, #1a1a2e, #16213e)'
            }}
          />
        </Box>
        
        {/* Stats */}
        <Flex justify="center" gap={4} wrap="wrap">
          <Text fontSize="sm" color="gray.400">
            Active Creatures: {creatures.filter(c => c.estaViva).length}
          </Text>
          <Text fontSize="sm" color="gray.400">
            Total Evolution Points: {creatures.reduce((sum, c) => sum + parseFloatSafe(c.puntosEvolucion, 0), 0).toFixed(1)}
          </Text>
        </Flex>
      </Flex>
    </motion.div>
  );
} 