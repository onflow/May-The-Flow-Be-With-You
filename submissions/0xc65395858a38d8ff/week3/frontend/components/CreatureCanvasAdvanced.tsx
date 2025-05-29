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
  
  // Main body - FORMA MÁS ORGÁNICA Y RECONOCIBLE
  const bodyRadius = 30;
  const hue = visual.hue;
  const saturation = Math.min(visual.saturation + 20, 100);
  const lightness = Math.min(visual.lightness + 10, 70);
  
  // Glow suave si tiene energía
  if (visual.energy > 0.3) {
    ctx.shadowColor = `hsl(${hue}, ${saturation}%, ${lightness + 20}%)`;
    ctx.shadowBlur = 15;
  }
  
  // ===== CUERPO PRINCIPAL - FORMA DE BLOB ORGÁNICO =====
  ctx.beginPath();
  
  // Crear forma blob más orgánica
  const numPoints = 8;
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    
    // Variación orgánica en el radio
    const baseVariation = 0.8 + 0.3 * Math.sin(angle * 3);
    const breathingEffect = 1 + 0.15 * Math.sin(time * 0.003 + visual.id);
    const organicNoise = 0.9 + 0.2 * Math.sin(time * 0.005 + angle * 2 + visual.id);
    
    const radius = bodyRadius * baseVariation * breathingEffect * organicNoise;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      // Usar curvas suaves en lugar de líneas rectas
      const prevAngle = ((i - 1) / numPoints) * Math.PI * 2;
      const prevRadius = bodyRadius * (0.8 + 0.3 * Math.sin(prevAngle * 3)) * breathingEffect;
      const prevX = Math.cos(prevAngle) * prevRadius;
      const prevY = Math.sin(prevAngle) * prevRadius;
      
      const cpX = (prevX + x) / 2;
      const cpY = (prevY + y) / 2;
      
      ctx.quadraticCurveTo(cpX, cpY, x, y);
    }
  }
  ctx.closePath();
  
  // Gradiente corporal más realista
  const bodyGradient = ctx.createRadialGradient(
    -bodyRadius * 0.3, -bodyRadius * 0.3, 0,
    0, 0, bodyRadius * 1.2
  );
  
  bodyGradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness + 25}%)`);
  bodyGradient.addColorStop(0.4, `hsl(${hue + 10}, ${saturation}%, ${lightness}%)`);
  bodyGradient.addColorStop(0.8, `hsl(${hue - 10}, ${saturation + 15}%, ${lightness - 15}%)`);
  bodyGradient.addColorStop(1, `hsl(${hue - 20}, ${saturation + 10}%, ${lightness - 25}%)`);
  
  ctx.fillStyle = bodyGradient;
  ctx.fill();
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  
  // ===== TEXTURA ORGÁNICA EN LA PIEL =====
  if (visual.energy > 0.2) {
    ctx.strokeStyle = `hsla(${hue + 30}, 60%, ${lightness + 20}%, 0.3)`;
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const angle = (i / 5) * Math.PI * 2 + time * 0.001;
      const x1 = Math.cos(angle) * bodyRadius * 0.3;
      const y1 = Math.sin(angle) * bodyRadius * 0.3;
      const x2 = Math.cos(angle + Math.PI * 0.8) * bodyRadius * 0.7;
      const y2 = Math.sin(angle + Math.PI * 0.8) * bodyRadius * 0.7;
      
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(
        x1 + Math.sin(time * 0.01) * 10, y1 + Math.cos(time * 0.01) * 10,
        x2 + Math.cos(time * 0.008) * 8, y2 + Math.sin(time * 0.008) * 8,
        x2, y2
      );
      ctx.stroke();
    }
  }
  
  // ===== OJOS - CARACTERÍSTICAS RECONOCIBLES =====
  const eyeSize = bodyRadius * 0.15;
  const eyeDistance = bodyRadius * 0.4;
  
  // Ojo izquierdo
  const leftEyeX = -eyeDistance;
  const leftEyeY = -bodyRadius * 0.2;
  
  // Base del ojo
  ctx.beginPath();
  ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  
  // Iris
  ctx.beginPath();
  ctx.arc(leftEyeX, leftEyeY, eyeSize * 0.7, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${(hue + 180) % 360}, 70%, 50%)`;
  ctx.fill();
  
  // Pupila
  ctx.beginPath();
  const pupilOffsetX = Math.sin(time * 0.002) * 2;
  const pupilOffsetY = Math.cos(time * 0.003) * 2;
  ctx.arc(leftEyeX + pupilOffsetX, leftEyeY + pupilOffsetY, eyeSize * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'black';
  ctx.fill();
  
  // Brillo en el ojo
  ctx.beginPath();
  ctx.arc(leftEyeX + pupilOffsetX - 1, leftEyeY + pupilOffsetY - 1, eyeSize * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  
  // Ojo derecho (similar)
  const rightEyeX = eyeDistance;
  const rightEyeY = leftEyeY;
  
  ctx.beginPath();
  ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(rightEyeX, rightEyeY, eyeSize * 0.7, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${(hue + 180) % 360}, 70%, 50%)`;
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(rightEyeX + pupilOffsetX, rightEyeY + pupilOffsetY, eyeSize * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'black';
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(rightEyeX + pupilOffsetX - 1, rightEyeY + pupilOffsetY - 1, eyeSize * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  
  // ===== BOCA/CARACTERÍSTICA FACIAL =====
  const mouthY = bodyRadius * 0.3;
  const mouthWidth = bodyRadius * 0.3;
  
  ctx.strokeStyle = `hsl(${hue - 30}, 50%, 30%)`;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  
  // Boca que respira/cambia
  const mouthOpenness = 0.5 + 0.5 * Math.sin(time * 0.004);
  
  ctx.beginPath();
  ctx.arc(0, mouthY, mouthWidth * mouthOpenness, 0, Math.PI);
  ctx.stroke();
  
  // ===== APÉNDICES COMO TENTÁCULOS/BRAZOS =====
  for (let i = 0; i < visual.numAppendages && i < 6; i++) {
    const baseAngle = (i / visual.numAppendages) * Math.PI * 2;
    const angle = baseAngle + visual.appendageAngle + Math.sin(time * 0.002 + i) * 0.3;
    const length = visual.appendageLength * (0.8 + 0.4 * Math.sin(time * 0.003 + i));
    
    ctx.save();
    ctx.rotate(angle);
    ctx.translate(bodyRadius * 0.7, 0);
    
    // Tentáculo orgánico
    ctx.strokeStyle = `hsl(${hue - 20}, ${saturation}%, ${lightness - 10}%)`;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    
    // Dibujar tentáculo con curvas
    const segments = 4;
    for (let j = 1; j <= segments; j++) {
      const t = j / segments;
      const segmentX = length * t;
      const wave = Math.sin(time * 0.005 + i + t * 4) * length * 0.2;
      const segmentY = wave;
      
      if (j === 1) {
        ctx.lineTo(segmentX, segmentY);
      } else {
        const prevT = (j - 1) / segments;
        const prevX = length * prevT;
        const prevWave = Math.sin(time * 0.005 + i + prevT * 4) * length * 0.2;
        
        ctx.quadraticCurveTo(
          (prevX + segmentX) / 2,
          (prevWave + segmentY) / 2,
          segmentX, segmentY
        );
      }
    }
    ctx.stroke();
    
    // Punta del tentáculo con detalle
    const tipX = length;
    const tipY = Math.sin(time * 0.005 + i) * length * 0.2;
    
    ctx.beginPath();
    ctx.arc(tipX, tipY, 3, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${hue + 40}, 80%, 70%)`;
    ctx.fill();
    
    ctx.restore();
  }
  
  // ===== INDICADOR DE ENERGÍA/VIDA =====
  if (visual.energy > 0.5) {
    // Aura de energía
    ctx.strokeStyle = `hsla(${hue + 60}, 80%, 80%, 0.6)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, bodyRadius * 1.3, 0, Math.PI * 2);
    ctx.stroke();
    
    // Partículas de energía alrededor
    for (let i = 0; i < 3; i++) {
      const angle = time * 0.001 + (i / 3) * Math.PI * 2;
      const radius = bodyRadius * 1.2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue + 60}, 90%, 80%, 0.8)`;
      ctx.fill();
    }
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
  
  // Dibujar trail como una serie de círculos decrecientes
  for (let i = 0; i < visual.trailPoints.length; i++) {
    const point = visual.trailPoints[i];
    const size = (point.alpha * 8) + 1; // Trail más pequeño
    
    ctx.globalAlpha = point.alpha * 0.6; // Más transparente
    ctx.fillStyle = `hsl(${visual.hue}, ${visual.saturation * 0.8}%, ${visual.lightness}%)`;
    
    ctx.beginPath();
    ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
    ctx.fill();
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
    
    // Obtener genes más específicos
    const tamanoBase = parseFloatSafe(creature.genesVisibles.tamanoBase, 1.5);
    const formaPrincipal = parseFloatSafe(creature.genesVisibles.formaPrincipal, 1.0);
    const numApendices = parseFloatSafe(creature.genesVisibles.numApendices, 0);
    const patronMovimiento = parseFloatSafe(creature.genesVisibles.patronMovimiento, 1.0);
    
    // Usar genes ocultos si están disponibles
    const agilidadCombate = parseFloatSafe(creature.genesOcultos?.agilidadCombate, 1.0);
    const ataqueBase = parseFloatSafe(creature.genesOcultos?.ataqueBase, 10.0);
    const defensaBase = parseFloatSafe(creature.genesOcultos?.defensaBase, 10.0);
    
    // Posición inicial más orgánica
    const gridCols = Math.ceil(Math.sqrt(creatures.length));
    const gridSpacing = Math.min(120, 800 / gridCols);
    const col = index % gridCols;
    const row = Math.floor(index / gridCols);
    const x = 100 + col * gridSpacing + (Math.random() - 0.5) * 40;
    const y = 100 + row * gridSpacing + (Math.random() - 0.5) * 40;
    
    return {
      id: creature.id,
      x,
      y,
      targetX: x,
      targetY: y,
      vx: 0,
      vy: 0,
      rotation: 0,
      scale: Math.max(0.7, Math.min(1.8, tamanoBase * 0.6)), // Mejor escalado
      baseScale: tamanoBase * 0.6,
      pulsePhase: Math.random() * Math.PI * 2,
      trailPoints: [],
      particles: [],
      hue: hue * 360,
      saturation: Math.max(40, saturation * 100), // Saturación mínima para mejor visibilidad
      lightness: Math.max(30, Math.min(70, lightness * 100)), // Mejor rango de luminosidad
      energy: Math.min(1.0, parseFloatSafe(creature.puntosEvolucion, 0) / 50), // Mejor escala de energía
      
      // Movimiento más sofisticado basado en genes
      movementType: Math.floor(patronMovimiento) % 4,
      movementIntensity: (patronMovimiento - Math.floor(patronMovimiento)) * agilidadCombate,
      movementTimer: Math.random() * 1000,
      
      // Forma basada en genes reales
      shapeType: Math.floor(formaPrincipal) % 4,
      numAppendages: Math.min(8, Math.max(0, Math.floor(numApendices))),
      appendageLength: 15 + (numApendices % 1) * 15 + (ataqueBase / 25.0) * 10, // Ataque influye en longitud
      appendageAngle: 0,
      
      // Estados de evolución más dinámicos
      isEvolving: false,
      evolutionIntensity: 0,
      lastEvolutionTime: parseFloatSafe(creature.puntosEvolucion, 0)
    };
  }, [creatures.length]);
  
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
        
        // Update animation - más lento y relajado
        visual.pulsePhase += 0.02 * animationSpeed; // Reducido de 0.05 a 0.02
        visual.appendageAngle += 0.008 * animationSpeed; // Reducido de 0.02 a 0.008
        visual.movementTimer += 1;
        
        // Update movement
        const agilidadMod = parseFloatSafe(creature.genesOcultos?.agilidadCombate, 1.0);
        const defensaMod = parseFloatSafe(creature.genesOcultos?.defensaBase, 10.0) / 25.0; // Normalizar
        const tamanoMod = parseFloatSafe(creature.genesVisibles?.tamanoBase, 1.5);
        
        switch (visual.movementType) {
          case 0: // Guardián Defensivo - Se mueve poco, patrones predecibles
            const guardianFloat = Math.sin(time * 0.0003 * agilidadMod + visual.id) * (15 / tamanoMod);
            visual.y += guardianFloat * 0.1;
            visual.x += Math.cos(time * 0.0002 + visual.id) * (defensaMod * 2);
            
            // Cambio de posición ocasional basado en defensa alta
            if (visual.movementTimer % Math.floor(1200 / defensaMod) === 0) {
              visual.targetX = visual.x + (Math.random() - 0.5) * (30 * defensaMod);
              visual.targetY = visual.y + (Math.random() - 0.5) * (30 * defensaMod);
            }
            break;
            
          case 1: // Cazador Circular - Patrullas en círculos
            const huntRadius = 30 + visual.movementIntensity * 25 + (agilidadMod * 15);
            const huntSpeed = 0.0003 * agilidadMod * (1.5 / tamanoMod);
            visual.targetX = canvasWidth/2 + Math.cos(time * huntSpeed + visual.id) * huntRadius;
            visual.targetY = canvasHeight/2 + Math.sin(time * huntSpeed + visual.id) * huntRadius;
            
            // Variación en la altura basada en agilidad
            visual.y += Math.sin(time * 0.001 * agilidadMod) * 3;
            break;
            
          case 2: // Explorador Errático - Cambia destino frecuentemente
            const exploreFreq = Math.max(100, 300 - (agilidadMod * 50)); // Más ágil = más frecuente
            if (visual.movementTimer % Math.floor(exploreFreq) === 0) {
              const maxDistance = 40 + (agilidadMod * 30);
              visual.targetX = Math.max(50, Math.min(canvasWidth - 50, 
                visual.x + (Math.random() - 0.5) * maxDistance));
              visual.targetY = Math.max(50, Math.min(canvasHeight - 50, 
                visual.y + (Math.random() - 0.5) * maxDistance));
            }
            
            // Movimiento nervioso adicional más suave
            visual.x += Math.sin(time * 0.003 * agilidadMod) * 1;
            visual.y += Math.cos(time * 0.004 * agilidadMod) * 0.8;
            break;
            
          case 3: // Territorial - Defiende un área específica
            const territoryX = 100 + (visual.id % 6) * 120;
            const territoryY = 100 + Math.floor(visual.id / 6) * 120;
            const territoryRadius = 30 + (defensaMod * 20);
            
            // Patrulla dentro de su territorio más lento
            const territoryAngle = time * 0.0008 * (agilidadMod * 0.5);
            const territoryPatrolRadius = territoryRadius * 0.6;
            visual.targetX = territoryX + Math.cos(territoryAngle) * territoryPatrolRadius;
            visual.targetY = territoryY + Math.sin(territoryAngle) * territoryPatrolRadius;
            
            // Movimiento defensivo si se aleja mucho
            const distFromTerritory = Math.sqrt(
              Math.pow(visual.x - territoryX, 2) + Math.pow(visual.y - territoryY, 2)
            );
            if (distFromTerritory > territoryRadius) {
              visual.targetX = territoryX;
              visual.targetY = territoryY;
            }
            break;
        }
        
        // Smooth movement to target - velocidad mucho más lenta
        const baseSpeed = 0.008; // Reducido de 0.02 a 0.008
        const speedModifier = 0.5 + (agilidadMod * 0.3); // Reducido el rango
        const actualSpeed = baseSpeed * speedModifier;
        
        visual.vx = lerp(visual.vx, (visual.targetX - visual.x) * actualSpeed, 0.05); // Menos responsivo
        visual.vy = lerp(visual.vy, (visual.targetY - visual.y) * actualSpeed, 0.05);
        visual.x += visual.vx;
        visual.y += visual.vy;
        
        // Keep in bounds
        visual.x = Math.max(50, Math.min(canvasWidth - 50, visual.x));
        visual.y = Math.max(50, Math.min(canvasHeight - 50, visual.y));
        
        // Efectos de salud/edad en el movimiento
        const ageRatio = parseFloatSafe(creature.edadDiasCompletos, 0) / parseFloatSafe(creature.lifespanTotalSimulatedDays, 7);
        const healthMultiplier = Math.max(0.3, 1 - (ageRatio * 0.5)); // Reduce velocidad con edad
        visual.vx *= healthMultiplier;
        visual.vy *= healthMultiplier;
        
        // Update trail
        if (showTrails) {
          visual.trailPoints.unshift({ x: visual.x, y: visual.y, alpha: 1 });
          if (visual.trailPoints.length > 8) {
            visual.trailPoints.pop();
          }
          
          visual.trailPoints.forEach((point, i) => {
            point.alpha = Math.max(0, 1 - (i / visual.trailPoints.length) * 1.5);
          });
        }
        
        // Update particles - más sofisticado basado en genes
        if (showParticles) {
          const ataqueNorm = parseFloatSafe(creature.genesOcultos?.ataqueBase, 10.0) / 25.0;
          const defensaNorm = parseFloatSafe(creature.genesOcultos?.defensaBase, 10.0) / 25.0;
          
          // Partículas de energía - frecuencia basada en evolución
          if (visual.movementTimer % Math.max(5, 20 - (visual.energy * 15)) === 0 && visual.energy > 0.1) {
            // Color de partícula basado en tipo de criatura
            let particleColor = `hsl(${visual.hue}, 80%, 70%)`;
            
            if (ataqueNorm > 0.7) {
              // Criaturas agresivas - partículas rojas/naranjas
              particleColor = `hsl(${(visual.hue + 20) % 360}, 90%, 65%)`;
            } else if (defensaNorm > 0.7) {
              // Criaturas defensivas - partículas azules/verdes
              particleColor = `hsl(${(visual.hue + 180) % 360}, 70%, 60%)`;
            } else if (agilidadMod > 1.3) {
              // Criaturas ágiles - partículas más brillantes
              particleColor = `hsl(${visual.hue}, 95%, 80%)`;
            }
            
            visual.particles.push(createParticle(
              visual.x + (Math.random() - 0.5) * 40,
              visual.y + (Math.random() - 0.5) * 40,
              'energy',
              particleColor
            ));
          }
          
          // Partículas especiales cuando evoluciona
          if (visual.isEvolving) {
            for (let i = 0; i < 3; i++) {
              visual.particles.push(createParticle(
                visual.x + (Math.random() - 0.5) * 60,
                visual.y + (Math.random() - 0.5) * 60,
                'evolution',
                `hsl(${visual.hue + 60}, 100%, 85%)`
              ));
            }
          }
          
          // Partículas de vejez/salud
          if (ageRatio > 0.7) {
            if (visual.movementTimer % 30 === 0) {
              visual.particles.push(createParticle(
                visual.x + (Math.random() - 0.5) * 20,
                visual.y + (Math.random() - 0.5) * 20,
                'death',
                `hsl(${visual.hue}, 30%, 40%)`
              ));
            }
          }
          
          // Update existing particles
          visual.particles = visual.particles.filter(updateParticle);
        }
        
        // Update evolution state - más responsivo
        const currentEP = parseFloatSafe(creature.puntosEvolucion, 0);
        const epDifference = Math.abs(currentEP - visual.lastEvolutionTime);
        
        // Detectar evolución significativa (cambio de >5 EP)
        if (epDifference > 5 && currentEP > visual.lastEvolutionTime) {
          visual.isEvolving = true;
          visual.evolutionIntensity = Math.min(2, epDifference / 10); // Intensidad basada en cambio
          visual.lastEvolutionTime = currentEP;
          
          // Cambio temporal en escala durante evolución
          visual.scale = visual.baseScale * (1 + visual.evolutionIntensity * 0.3);
        }
        
        // Decay de evolución
        if (visual.isEvolving) {
          visual.evolutionIntensity *= 0.95; // Decay más lento
          if (visual.evolutionIntensity < 0.1) {
            visual.isEvolving = false;
            visual.scale = visual.baseScale; // Restaurar escala normal
          }
        }
        
        // Actualizar energía visual basada en EP actual
        visual.energy = Math.min(1.2, currentEP / 50);
        
        // Efectos de energía en el comportamiento - más moderado
        if (visual.energy > 0.8) {
          // Criaturas con mucha energía se mueven un poco más rápido
          visual.vx *= 1.1; // Reducido de 1.2 a 1.1
          visual.vy *= 1.1;
          
          // Y cambian menos frecuentemente de dirección
          if (visual.movementTimer % 200 === 0) { // Aumentado de 80 a 200
            visual.targetX += (Math.random() - 0.5) * 30; // Reducido de 60 a 30
            visual.targetY += (Math.random() - 0.5) * 30;
          }
        }
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
    
    // Clear canvas completamente - SIN trails fantasma
    ctx.fillStyle = 'rgb(15, 15, 35)'; // Color sólido sin alpha
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw grid SOLO si está activado
    if (showGrid) {
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.2)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      
      // Líneas verticales
      for (let x = 0; x < canvasWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
      }
      
      // Líneas horizontales
      for (let y = 0; y < canvasHeight; y += gridSize) {
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
      
      // Draw trail SOLO si showTrails está activado
      if (showTrails && visual.trailPoints.length > 1) {
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
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '12px monospace';
      ctx.fillText(`Creatures: ${visualsMap.size}`, 10, 20);
      ctx.fillText(`Particles: ${Array.from(visualsMap.values()).reduce((sum, v) => sum + v.particles.length, 0)}`, 10, 35);
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