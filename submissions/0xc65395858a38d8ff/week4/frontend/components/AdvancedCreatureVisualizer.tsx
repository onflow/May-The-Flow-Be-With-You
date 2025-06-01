'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Text,
  Badge,
  SimpleGrid,
  Card,
  CardBody,
  Flex,
  Progress,
  useColorModeValue,
  Icon,
  Tooltip,
  Button,
  ButtonGroup,
  Tag
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiHeart, FiEye, FiStar } from 'react-icons/fi';

// Interfaces
interface CreatureVisualData {
  id: number;
  name: string;
  description: string;
  thumbnail: string;
  estaViva: boolean;
  edadDiasCompletos: string;
  lifespanTotalSimulatedDays: string;
  puntosEvolucion: string;
  traitValues: { [key: string]: string | null };
  registeredModules: string[];
}

interface AdvancedCreatureVisualizerProps {
  creatures: CreatureVisualData[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

const MotionBox = motion(Box);
const MotionCard = motion(Card);

// Helper functions to parse trait values - COMPLETE PARSING
const parseVisualTraits = (traitValue: string | null) => {
  if (!traitValue) return null;
  
  const traits: any = {};
  const parts = traitValue.split('|');
  
  parts.forEach(part => {
    if (part.includes('R:')) traits.colorR = parseFloat(part.split('R:')[1]) || 0;
    if (part.includes('G:')) traits.colorG = parseFloat(part.split('G:')[1]) || 0;
    if (part.includes('B:')) traits.colorB = parseFloat(part.split('B:')[1]) || 0;
    if (part.includes('Size:')) traits.tamanoBase = parseFloat(part.split('Size:')[1]) || 1;
    if (part.includes('Form:')) traits.formaPrincipal = parseFloat(part.split('Form:')[1]) || 1;
    if (part.includes('Apps:')) traits.numApendices = parseFloat(part.split('Apps:')[1]) || 0;
    if (part.includes('Mov:')) traits.patronMovimiento = parseFloat(part.split('Mov:')[1]) || 1;
  });
  
  return traits;
};

const parseAdvancedVisualTraits = (traitValue: string | null) => {
  if (!traitValue) return null;
  
  const traits: any = {};
  const parts = traitValue.split('|');
  
  parts.forEach(part => {
    // Pattern traits
    if (part.includes('PAT:')) traits.tipoPatron = parseInt(part.split('PAT:')[1]) || 0;
    if (part.includes('DENS:')) traits.densidadPatron = parseFloat(part.split('DENS:')[1]) || 0;
    
    // Secondary colors
    if (part.includes('SEC:')) {
      const colorStr = part.split('SEC:')[1];
      const colors = colorStr.split(',');
      traits.colorSecundarioR = parseFloat(colors[0]) || 0;
      traits.colorSecundarioG = parseFloat(colors[1]) || 0;
      traits.colorSecundarioB = parseFloat(colors[2]) || 0;
    }
    
    // Surface properties
    if (part.includes('BRILL:')) traits.brilloSuperficie = parseFloat(part.split('BRILL:')[1]) || 0;
    
    // Aura effects
    if (part.includes('AURA:')) traits.tipoAura = parseInt(part.split('AURA:')[1]) || 0;
    if (part.includes('AINT:')) traits.intensidadAura = parseFloat(part.split('AINT:')[1]) || 0;
    
    // Light/bioluminescence
    if (part.includes('LUZ:')) traits.emiteLuz = part.split('LUZ:')[1] === '1';
    if (part.includes('LUZC:')) {
      const lightStr = part.split('LUZC:')[1];
      const lightColors = lightStr.split(',');
      traits.colorLuzR = parseFloat(lightColors[0]) || 0.8;
      traits.colorLuzG = parseFloat(lightColors[1]) || 0.8;
      traits.colorLuzB = parseFloat(lightColors[2]) || 0.6;
    }
    
    // Physical features
    if (part.includes('OJOS:')) traits.tipoOjos = parseInt(part.split('OJOS:')[1]) || 0;
    if (part.includes('TOJOS:')) traits.tamanoOjos = parseFloat(part.split('TOJOS:')[1]) || 1;
    if (part.includes('BOCA:')) traits.tipoBoca = parseInt(part.split('BOCA:')[1]) || 0;
    if (part.includes('TEX:')) traits.texturaPiel = parseInt(part.split('TEX:')[1]) || 0;
    
    // Cycles and states
    if (part.includes('RITMO:')) traits.ritmoCircadiano = parseFloat(part.split('RITMO:')[1]) || 0.5;
    if (part.includes('SALUD:')) traits.nivelSalud = parseFloat(part.split('SALUD:')[1]) || 1;
    if (part.includes('ENERGIA:')) traits.nivelEnergia = parseFloat(part.split('ENERGIA:')[1]) || 1;
    
    // Elemental effects
    if (part.includes('ELEM:')) traits.efectoElemental = parseInt(part.split('ELEM:')[1]) || 0;
    
    // Evolution marks
    if (part.includes('MARCAS:')) {
      const marcasStr = part.split('MARCAS:')[1];
      traits.marcasEvolucion = marcasStr ? marcasStr.split(',').map(m => parseInt(m)).filter(m => !isNaN(m)) : [];
    }
  });
  
  return traits;
};

// Visual trait type mappings - COMPLETE FROM CONTRACTS
const PATTERN_TYPES = ['Smooth', 'Spots', 'Stripes', 'Dots', 'Swirls'];
const AURA_TYPES = ['None', '🔥Fire', '💧Water', '🌍Earth', '💨Air'];
const EYE_TYPES = ['Round', 'Feline', 'Compound', 'Multiple'];
const MOUTH_TYPES = ['Small', 'Large', 'Beak', 'Tentacles'];
const TEXTURE_TYPES = ['Smooth', 'Scaled', 'Furry', 'Crystalline'];
const ELEMENTAL_EFFECTS = ['Normal', '💎Crystal', '🔥Flame', '❄️Ice'];
const FORM_TYPES = ['Agile', 'Tank', 'Attacker'];
const MOVEMENT_TYPES = ['Walk', 'Run', 'Hop', 'Dash'];
const EVOLUTION_MARKS: Record<number, string> = {
  1: '🌱First Evolution',
  2: '🛡️Survivor', 
  3: '👶Breeder',
  4: '👴Elder',
  5: '⚔️Fighter',
  6: '🗺️Explorer'
};

export default function AdvancedCreatureVisualizer({ 
  creatures, 
  onRefresh, 
  isLoading = false 
}: AdvancedCreatureVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [time, setTime] = useState(0);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  
  // Canvas colors (moved out of useEffect to avoid hook violations)
  const canvasBgColor = useColorModeValue('#f7fafc', '#0f0f23');
  const textColor = useColorModeValue('#2d3748', '#e2e8f0');
  
  // Background gradient colors
  // Primordia Environment Colors - Genesis Shaper's Realm
  const nebulaTopColor = useColorModeValue('#1a0b2e', '#0f051a'); // Deep cosmic purple
  const nebulaMidColor = useColorModeValue('#2d1b4e', '#1a0d2a'); // Mid nebula
  const nebulaDeepColor = useColorModeValue('#4a3268', '#251741'); // Deeper purple
  const nebulaBottomColor = useColorModeValue('#6a4c93', '#352352'); // Base nebula
  const animaStreamColor = useColorModeValue('#8a2be2', '#9d4edd'); // Anima energy streams
  const creationEnergyColor = useColorModeValue('#ff6b9d', '#ff8cc8'); // Creation collision energy
  const echoColor = useColorModeValue('#ffd700', '#ffec8b'); // Echoes of First Forging
  const elementalStratumColor = useColorModeValue('#4ade80', '#22d3ee'); // Elemental strata
  const selectionColor = useColorModeValue('#ff6b6b', '#ffa726');
  const gridColor = useColorModeValue('rgba(138, 43, 226, 0.2)', 'rgba(157, 78, 221, 0.3)');
  
  // Environment controls
  const [showTrails, setShowTrails] = useState(true);
  const [showParticles, setShowParticles] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const [selectedCreature, setSelectedCreature] = useState<number | null>(null);

  // Enhanced creature data with physics - using useRef to persist between renders
  const creaturePhysicsRef = useRef<Map<number, any>>(new Map());
  
  // Parse all creature visual data
  const parsedCreatures = useMemo(() => {
    return creatures.map(creature => {
      const visualTraits = parseVisualTraits(creature.traitValues['visual']);
      const advancedTraits = parseAdvancedVisualTraits(creature.traitValues['advanced_visual']);
      
      return {
        ...creature,
        visual: visualTraits,
        advanced: advancedTraits
      };
    });
  }, [creatures]);

  // Initialize creature physics
  const initializeCreaturePhysics = useCallback((creature: any, index: number, canvasW: number, canvasH: number) => {
    const cols = Math.ceil(Math.sqrt(parsedCreatures.length));
    const spacing = Math.min(120, canvasW / cols);
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    // Random initial position within bounds
    const baseX = 100 + col * spacing + (Math.random() - 0.5) * 60;
    const baseY = 100 + row * spacing + (Math.random() - 0.5) * 60;
    
    const visual = creature.visual || {};
    const advanced = creature.advanced || {};
    
    // Give creatures an immediate target far from their starting position
    const targetX = baseX + (Math.random() - 0.5) * 200; // Increased from 100 to 200
    const targetY = baseY + (Math.random() - 0.5) * 200;
    
    return {
      id: creature.id,
      x: Math.max(50, Math.min(canvasW - 50, baseX)),
      y: Math.max(50, Math.min(canvasH - 50, baseY)),
      targetX: Math.max(50, Math.min(canvasW - 50, targetX)),
      targetY: Math.max(50, Math.min(canvasH - 50, targetY)),
      vx: 0,
      vy: 0,
      rotation: 0,
      scale: Math.max(0.8, (visual.tamanoBase || 1) * 0.7),
      pulsePhase: Math.random() * Math.PI * 2,
      trailPoints: [],
      particles: [],
      energy: Math.min(1.0, parseFloat(creature.puntosEvolucion) / 50),
      
      // Movement patterns based on traits - FULL decimal precision for uniqueness
      movementType: Math.floor(visual.patronMovimiento || 1) % 4,
      movementVariation: (visual.patronMovimiento || 1) % 1, // Decimal part = personality signature
      movementPersonality: {
        // Extract decimals from multiple traits for compound uniqueness
        speedMod: (visual.tamanoBase || 1) % 1, // Size decimal affects speed
        patternMod: (visual.formaPrincipal || 1) % 1, // Form decimal affects pattern
        energyMod: (visual.numApendices || 0) % 1, // Appendage decimal affects energy
      },
      movementTimer: Math.random() * 1000,
      movementIntensity: Math.max(0.3, advanced.nivelEnergia || 0.5), // Ensure minimum energy
      
      // Territory for territorial creatures
      territoryX: baseX,
      territoryY: baseY,
      territoryRadius: 40 + (advanced.nivelSalud || 0.5) * 30,
      
      // Activity states for natural behavior
      activityState: 'active', // 'active', 'resting', 'observing'
      activityTimer: 0,
      restDuration: 0,
      nextActivityChange: Math.random() * 180 + 120, // 2-5 seconds initially
    };
  }, [parsedCreatures.length]);

  // Physics and particle systems
  const updateCreaturePhysics = useCallback((physics: any, creature: any, currentTime: number, canvasW: number, canvasH: number) => {
    // INITIALIZE ACTIVITY STATE for existing creatures that don't have it
    if (!physics.activityState) {
      physics.activityState = 'active';
      physics.activityTimer = 0;
      physics.restDuration = 0;
      physics.nextActivityChange = Math.random() * 180 + 120;
      console.log(`Initialized activity state for creature ${physics.id}`);
    }
    
    // SAFETY: Validate and fix NaN coordinates immediately
    if (isNaN(physics.x) || isNaN(physics.y)) {
      console.warn(`Creature ${physics.id} has NaN coordinates, resetting to safe position`);
      physics.x = 100 + Math.random() * (canvasW - 200);
      physics.y = 100 + Math.random() * (canvasH - 200);
      physics.vx = 0;
      physics.vy = 0;
    }
    
    // SAFETY: Validate targets
    if (isNaN(physics.targetX) || isNaN(physics.targetY)) {
      console.warn(`Creature ${physics.id} has NaN targets, setting new targets`);
      physics.targetX = 100 + Math.random() * (canvasW - 200);
      physics.targetY = 100 + Math.random() * (canvasH - 200);
    }
    
    // SAFETY: Validate velocities  
    if (isNaN(physics.vx) || isNaN(physics.vy)) {
      console.warn(`Creature ${physics.id} has NaN velocities, resetting to zero`);
      physics.vx = 0;
      physics.vy = 0;
    }
    
    // Always update physics, but movement speed depends on isPlaying
    const speedMultiplier = isPlaying ? 1.0 : 0.0;
    
    console.log(`updateCreaturePhysics called for creature ${physics.id}, speedMultiplier: ${speedMultiplier}, isPlaying: ${isPlaying}`);

    const visual = creature.visual || {};
    const advanced = creature.advanced || {};
    
    // Update animation phases (always animate breathing)
    physics.pulsePhase += 0.02 * animationSpeed;
    const oldTimer = physics.movementTimer;
    physics.movementTimer += speedMultiplier; // Only increment timer when playing
    console.log(`Timer update: ${oldTimer} -> ${physics.movementTimer} (speedMultiplier: ${speedMultiplier})`);
    
    // Movement patterns - smooth acceleration from rest
    const baseSpeed = 0.06 * animationSpeed * speedMultiplier;  // Reduced for gentler starts
    const energyMod = Math.max(0.1, physics.movementIntensity || 0.5); // SAFETY: Ensure minimum energy
    const movementVariation = Math.max(0, Math.min(1, physics.movementVariation || 0)); // SAFETY: Clamp to [0,1]
    
        console.log(`Creature ${physics.id}: movementType=${physics.movementType}, timer=${physics.movementTimer}, energyMod=${energyMod}, state=${physics.activityState}`);
    
    // CIRCADIAN RHYTHM: Based on real browser time
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60; // 0-24 with decimals
    const circadianRhythm = advanced.ritmoCircadiano || 0.5; // 0-1 creature's preference
    
    // Calculate if creature should be awake based on their circadian rhythm
    // circadianRhythm 0 = nocturnal, 0.5 = crepuscular, 1 = diurnal
    let shouldBeAwake = false;
    let sleepIntensity = 0; // 0 = fully awake, 1 = deep sleep
    
    if (circadianRhythm < 0.3) {
      // Nocturnal (active 20:00-06:00)
      shouldBeAwake = currentHour >= 20 || currentHour <= 6;
      sleepIntensity = shouldBeAwake ? 0 : Math.sin((currentHour - 6) / 14 * Math.PI) * 0.8;
    } else if (circadianRhythm > 0.7) {
      // Diurnal (active 06:00-20:00)  
      shouldBeAwake = currentHour >= 6 && currentHour <= 20;
      sleepIntensity = shouldBeAwake ? 0 : Math.sin((currentHour >= 20 ? currentHour - 20 : currentHour + 4) / 10 * Math.PI) * 0.8;
    } else {
      // Crepuscular (active dawn/dusk: 05:00-08:00 and 17:00-21:00)
      shouldBeAwake = (currentHour >= 5 && currentHour <= 8) || (currentHour >= 17 && currentHour <= 21);
      if (currentHour >= 9 && currentHour <= 16) {
        sleepIntensity = 0.6; // Afternoon nap
      } else if (currentHour >= 22 || currentHour <= 4) {
        sleepIntensity = 0.8; // Night sleep
      } else {
        sleepIntensity = 0;
      }
    }
    
    // NATURAL ACTIVITY CYCLE: Influenced by circadian rhythm
    physics.activityTimer++;
    
    if (physics.activityTimer >= physics.nextActivityChange) {
      const healthFactor = advanced.nivelSalud || 1.0;
      const energyFactor = advanced.nivelEnergia || 1.0;
      
      // Determine next activity based on circadian rhythm and creature state
      if (sleepIntensity > 0.5) {
        // Should be sleeping due to circadian rhythm
        physics.activityState = 'sleeping';
        physics.nextActivityChange = physics.activityTimer + Math.floor(300 + Math.random() * 600); // 5-15 seconds of sleep
      } else if (!shouldBeAwake && sleepIntensity > 0.2) {
        // Drowsy period
        physics.activityState = 'drowsy';
        physics.nextActivityChange = physics.activityTimer + Math.floor(120 + Math.random() * 180); // 2-5 seconds
      } else if (physics.activityState === 'active') {
        // Normal activity cycle when awake
        const shouldRest = Math.random() < (0.3 + (1 - energyFactor) * 0.2 + sleepIntensity * 0.3);
        physics.activityState = shouldRest ? 'resting' : 'observing';
        
        if (shouldRest) {
          physics.restDuration = Math.floor(60 + Math.random() * 120 + (1 - energyFactor) * 120);
          physics.nextActivityChange = physics.activityTimer + physics.restDuration;
        } else {
          physics.nextActivityChange = physics.activityTimer + Math.floor(30 + Math.random() * 90);
        }
      } else {
        // Return to activity when awake
        physics.activityState = 'active';
        const activityDuration = Math.floor(120 + Math.random() * 240 + energyFactor * 180);
        physics.nextActivityChange = physics.activityTimer + activityDuration;
      }
    }
    
    // APPLY MOVEMENT BASED ON ACTIVITY STATE AND CIRCADIAN RHYTHM
    const sleepSpeedMod = physics.activityState === 'sleeping' ? 0 : 
                         physics.activityState === 'drowsy' ? 0.3 : 1.0;
    
    if (physics.activityState === 'active' || physics.activityState === 'drowsy') {
      switch (physics.movementType) {
        case 0: // Guardian - distinctive protective patrols with decimal personality
          const guardianSpeedBase = 0.001 * (0.5 + movementVariation) * sleepSpeedMod;
          const guardianSpeed = guardianSpeedBase * (0.7 + physics.movementPersonality.speedMod * 0.6); // Individual speed signature
          const guardianRange = 30 * (0.8 + movementVariation * 0.4) * (0.8 + physics.movementPersonality.patternMod * 0.4);
          
          // Unique float pattern combining multiple decimals
          const uniquePhase = physics.id + physics.movementPersonality.patternMod * Math.PI * 2;
          const guardianFloat = Math.sin(currentTime * guardianSpeed + uniquePhase) * guardianRange;
          physics.targetY = physics.territoryY + guardianFloat;
          
          // More frequent direction changes for patrol behavior
          if (Math.floor(physics.movementTimer) % (120 + Math.floor(movementVariation * 60)) === 0) {
            const guardianMoveRange = 80 * (0.6 + movementVariation * 0.8);
            physics.targetX = physics.territoryX + (Math.random() - 0.5) * guardianMoveRange;
            physics.targetX = Math.max(50, Math.min(canvasW - 50, physics.targetX));
          }
          break;
        
        case 1: // Circular hunter - distinctive hunting spirals
          const huntRadius = (70 + energyMod * 50) * (0.7 + movementVariation * 0.6);
          const huntSpeed = 0.0015 * energyMod * (0.5 + movementVariation * 1.0) * sleepSpeedMod; // Smoother
          const huntPhase = physics.id + movementVariation * Math.PI * 2;
          
          // Add spiral effect - radius changes over time
          const spiralMod = 0.8 + 0.4 * Math.sin(currentTime * huntSpeed * 0.3);
          const actualRadius = huntRadius * spiralMod;
          
          physics.targetX = canvasW/2 + Math.cos(currentTime * huntSpeed + huntPhase) * actualRadius;
          physics.targetY = canvasH/2 + Math.sin(currentTime * huntSpeed + huntPhase) * actualRadius;
          
          // Keep targets in bounds
          physics.targetX = Math.max(50, Math.min(canvasW - 50, physics.targetX));
          physics.targetY = Math.max(50, Math.min(canvasH - 50, physics.targetY));
          break;
        
        case 2: // Erratic explorer - distinctive zigzag exploration
          const explorerFreq = Math.floor(90 + (120 * movementVariation)); // 1.5-3.5 seconds (faster changes)
          if (Math.floor(physics.movementTimer) % explorerFreq === 0 || 
              Math.abs(physics.x - physics.targetX) < 15 && Math.abs(physics.y - physics.targetY) < 15) {
            
            const explorerRange = (100 + energyMod * 100) * (0.5 + movementVariation * 1.0) * sleepSpeedMod; // Larger range
            
            // Zigzag pattern - alternate between different quadrants
            const quadrant = Math.floor(physics.movementTimer / explorerFreq) % 4;
            const directionX = quadrant < 2 ? 1 : -1;
            const directionY = (quadrant % 2 === 0) ? 1 : -1;
            
            const newTargetX = physics.x + directionX * (Math.random() * 0.7 + 0.3) * explorerRange;
            const newTargetY = physics.y + directionY * (Math.random() * 0.7 + 0.3) * explorerRange;
            
            physics.targetX = Math.max(50, Math.min(canvasW - 50, newTargetX));
            physics.targetY = Math.max(50, Math.min(canvasH - 50, newTargetY));
          }
          break;
        
        case 3: // Territorial - distinctive figure-8 patrols
          const territorySpeed = 0.002 * energyMod * (0.4 + movementVariation * 1.2) * sleepSpeedMod; // Moderate
          const territoryAngle = currentTime * territorySpeed + movementVariation * Math.PI * 2;
          const patrolRadius = physics.territoryRadius * (0.7 + movementVariation * 0.3); // Moderate radius
          
          // Figure-8 pattern for distinctive territorial behavior
          const figureEightX = Math.cos(territoryAngle) * patrolRadius;
          const figureEightY = Math.sin(territoryAngle * 2) * patrolRadius * 0.6; // Double frequency on Y
          
          physics.targetX = physics.territoryX + figureEightX;
          physics.targetY = physics.territoryY + figureEightY;
          
          // Keep in bounds
          physics.targetX = Math.max(50, Math.min(canvasW - 50, physics.targetX));
          physics.targetY = Math.max(50, Math.min(canvasH - 50, physics.targetY));
          break;
      }
    } else if (physics.activityState === 'observing') {
      // Observing: Very subtle movements, like breathing or looking around
      const observeFloat = Math.sin(currentTime * 0.001 + physics.id) * 3;
      physics.targetX = physics.x + observeFloat;
      physics.targetY = physics.y + Math.cos(currentTime * 0.0012 + physics.id) * 2;
    } else if (physics.activityState === 'drowsy') {
      // Drowsy: Slow, minimal movements
      const drowsyFloat = Math.sin(currentTime * 0.0008 + physics.id) * 2;
      physics.targetX = physics.x + drowsyFloat;
      physics.targetY = physics.y + Math.cos(currentTime * 0.0006 + physics.id) * 1;
    } else {
      // Resting or sleeping: Stay still with minimal breathing
      const breathingFloat = Math.sin(currentTime * 0.0005 + physics.id) * 1;
      physics.targetX = physics.x + breathingFloat;
      physics.targetY = physics.y;
    }
    
    // Smooth and natural movement with gradual acceleration
    const individualSpeedMod = 0.8 + movementVariation * 0.4; // Less extreme variation
    const speed = baseSpeed * (0.4 + energyMod * 0.3) * individualSpeedMod; // Much lower responsiveness
    const dampening = 0.95 + movementVariation * 0.03; // Higher dampening for smoother start
    
    // Gradual acceleration from rest - if creature was nearly still, start slower
    const currentSpeed = Math.sqrt(physics.vx * physics.vx + physics.vy * physics.vy);
    const isNearlyStill = currentSpeed < 0.5;
    const accelerationMultiplier = isNearlyStill ? 0.3 : 1.0; // Start at 30% speed when nearly still
    const finalSpeed = speed * accelerationMultiplier;
    
    // SAFETY: Validate all calculations before applying
    const deltaX = (physics.targetX - physics.x);
    const deltaY = (physics.targetY - physics.y);
    
    if (!isNaN(deltaX) && !isNaN(deltaY) && !isNaN(finalSpeed) && !isNaN(dampening)) {
      const newVx = physics.vx * dampening + deltaX * finalSpeed;
      const newVy = physics.vy * dampening + deltaY * finalSpeed;
      
      // SAFETY: Validate new velocities before applying
      if (!isNaN(newVx) && !isNaN(newVy)) {
        physics.vx = newVx;
        physics.vy = newVy;
        
        const newX = physics.x + physics.vx;
        const newY = physics.y + physics.vy;
        
        // SAFETY: Validate new positions before applying
        if (!isNaN(newX) && !isNaN(newY)) {
          physics.x = newX;
          physics.y = newY;
        }
      }
    }
    
    // Keep in bounds - SAFETY: Ensure coordinates are always valid
    physics.x = Math.max(50, Math.min(canvasW - 50, physics.x || 100));
    physics.y = Math.max(50, Math.min(canvasH - 50, physics.y || 100));
    
    // FINAL SAFETY CHECK: If somehow still NaN, reset to center
    if (isNaN(physics.x) || isNaN(physics.y)) {
      console.error(`Creature ${physics.id} still has NaN after all safety checks, resetting to center`);
      physics.x = canvasW / 2;
      physics.y = canvasH / 2;
      physics.vx = 0;
      physics.vy = 0;
      physics.targetX = physics.x + (Math.random() - 0.5) * 100;
      physics.targetY = physics.y + (Math.random() - 0.5) * 100;
    }
    
    // Update trails
    if (showTrails) {
      physics.trailPoints.unshift({ x: physics.x, y: physics.y, alpha: 1 });
      if (physics.trailPoints.length > 12) {
        physics.trailPoints.pop();
      }
      physics.trailPoints.forEach((point: any, i: number) => {
        point.alpha = Math.max(0, 1 - (i / physics.trailPoints.length) * 1.2);
      });
    }
    
    // Update particles
    if (showParticles) {
      // Add energy particles
      if (physics.movementTimer % Math.max(10, 30 - physics.energy * 20) === 0 && physics.energy > 0.1) {
        const hue = visual.colorR ? (visual.colorR * 360) % 360 : 180;
        physics.particles.push({
          x: physics.x + (Math.random() - 0.5) * 40,
          y: physics.y + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2 - 0.5,
          life: 60 + Math.random() * 40,
          maxLife: 60 + Math.random() * 40,
          size: 1 + Math.random() * 3,
          color: `hsl(${hue}, 80%, 70%)`,
          type: 'energy'
        });
      }
      
      // Update existing particles
      physics.particles = physics.particles.filter((particle: any) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        particle.vy -= 0.02; // Float upward
        particle.life--;
        return particle.life > 0;
      });
    }
    
    return physics;
  }, [isPlaying, animationSpeed, showTrails, showParticles]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use persistent physics state
    const localCreaturePhysics = creaturePhysicsRef.current;

    const drawCreature = (physics: any, creature: any, currentTime: number) => {
      const visual = creature.visual;
      const advanced = creature.advanced;
      
      if (!visual) return;

      // Use physics position
      const x = physics.x;
      const y = physics.y;

      ctx.save();
      ctx.translate(x, y);
      
      // Enhanced size calculation with health modifier - MORE IMPACTFUL
      const healthModifier = advanced?.nivelSalud || 1;
      const baseSize = Math.max(35, (visual.tamanoBase || 1) * physics.scale * 65 * (0.9 + 0.5 * healthModifier)); // Increased from 40 to 65
      
      // Unique breathing pattern per creature
      const breathingSpeed = 0.003 * (advanced?.nivelEnergia || 1);
      const creatureOffset = creature.id * 0.1; // Different phase per creature
      const energyBreathing = 0.8 + 0.2 * Math.sin(currentTime * breathingSpeed + creatureOffset);
      ctx.scale(energyBreathing, energyBreathing);
      
      // Enhanced color system - Primary + Secondary colors
      const primaryR = visual.colorR || 0.5;
      const primaryG = visual.colorG || 0.5;
      const primaryB = visual.colorB || 0.5;
      
      // Secondary colors from advanced traits
      const secondaryR = advanced?.colorSecundarioR || primaryR;
      const secondaryG = advanced?.colorSecundarioG || primaryG;
      const secondaryB = advanced?.colorSecundarioB || primaryB;
      
      // Convert primary to HSL
      const max = Math.max(primaryR, primaryG, primaryB);
      const min = Math.min(primaryR, primaryG, primaryB);
      const lightness = (max + min) / 2;
      
      let hue = 0;
      let saturation = 0;
      
      if (max !== min) {
        const delta = max - min;
        saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
        
        switch (max) {
          case primaryR: hue = (primaryG - primaryB) / delta + (primaryG < primaryB ? 6 : 0); break;
          case primaryG: hue = (primaryB - primaryR) / delta + 2; break;
          case primaryB: hue = (primaryR - primaryG) / delta + 4; break;
        }
        hue /= 6;
      }
      
      const hslHue = hue * 360;
      const hslSat = Math.max(40, saturation * 100);
      let hslLight = Math.max(30, Math.min(70, lightness * 100));
      
      // Health/energy/brightness affects lighting
      const healthMod = advanced?.nivelSalud || 1;
      const energyMod = advanced?.nivelEnergia || 1;
      const brightness = advanced?.brilloSuperficie || 0.2;
      
      hslLight = hslLight * healthMod * (1 + brightness * 0.5);
      
      // Enhanced aura system with intensity - MORE VISIBLE
      if (advanced?.tipoAura > 0 && advanced?.intensidadAura > 0) {
        const auraColors = [
          [255, 120, 120], // Fire - brighter
          [120, 180, 255], // Water - brighter  
          [160, 120, 60],  // Earth - brighter
          [220, 220, 255]  // Air - brighter
        ];
        const auraColor = auraColors[advanced.tipoAura - 1] || [255, 255, 255];
        const intensity = Math.max(0.5, advanced.intensidadAura); // Minimum intensity
        const pulsation = 0.9 + 0.3 * Math.sin(currentTime * 0.004 + creature.id);
        
        // Multiple aura layers for depth - MORE INTENSE
        for (let layer = 0; layer < 4; layer++) { // One more layer
          const layerSize = baseSize * (1.8 + layer * 0.4) * pulsation; // Larger auras
          const layerAlpha = intensity * (0.8 - layer * 0.15); // More opaque
          
          const gradient = ctx.createRadialGradient(0, 0, baseSize * 0.2, 0, 0, layerSize);
          gradient.addColorStop(0, `rgba(${auraColor[0]}, ${auraColor[1]}, ${auraColor[2]}, 0)`);
          gradient.addColorStop(0.6, `rgba(${auraColor[0]}, ${auraColor[1]}, ${auraColor[2]}, ${layerAlpha * 0.6})`); // More visible
          gradient.addColorStop(1, `rgba(${auraColor[0]}, ${auraColor[1]}, ${auraColor[2]}, ${layerAlpha * 0.2})`); // More visible
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(0, 0, layerSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // MAIN BODY - Enhanced with texture and patterns
      ctx.beginPath();
      const numPoints = 8;
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        
        // Organic variation influenced by texture type
        let textureModifier = 1.0;
        const textureType = advanced?.texturaPiel || 0;
        switch (textureType) {
          case 1: // Scaled - more angular
            textureModifier = 0.95 + 0.1 * Math.sin(angle * 6);
            break;
          case 2: // Furry - softer
            textureModifier = 0.98 + 0.04 * Math.sin(angle * 12);
            break;
          case 3: // Crystalline - geometric
            textureModifier = 0.9 + 0.2 * Math.sin(angle * 4);
            break;
        }
        
        const baseVariation = (0.8 + 0.3 * Math.sin(angle * 3)) * textureModifier;
        const breathingEffect = 1 + 0.15 * Math.sin(currentTime * 0.003 + creature.id);
        const organicNoise = 0.9 + 0.2 * Math.sin(currentTime * 0.005 + angle * 2 + creature.id);
        
        const radius = baseSize * baseVariation * breathingEffect * organicNoise;
        const bx = Math.cos(angle) * radius;
        const by = Math.sin(angle) * radius;
        
        if (i === 0) {
          ctx.moveTo(bx, by);
        } else {
          const prevAngle = ((i - 1) / numPoints) * Math.PI * 2;
          const prevRadius = baseSize * (0.8 + 0.3 * Math.sin(prevAngle * 3)) * textureModifier * breathingEffect;
          const prevX = Math.cos(prevAngle) * prevRadius;
          const prevY = Math.sin(prevAngle) * prevRadius;
          
          const cpX = (prevX + bx) / 2;
          const cpY = (prevY + by) / 2;
          
          ctx.quadraticCurveTo(cpX, cpY, bx, by);
        }
      }
      ctx.closePath();
      
      // Enhanced gradient with primary and secondary colors
      const bodyGradient = ctx.createRadialGradient(
        -baseSize * 0.3, -baseSize * 0.3, 0,
        0, 0, baseSize * 1.2
      );
      
      // Calculate secondary color HSL
      const secMax = Math.max(secondaryR, secondaryG, secondaryB);
      const secMin = Math.min(secondaryR, secondaryG, secondaryB);
      const secLightness = (secMax + secMin) / 2;
      
      let secHue = hslHue;
      if (secMax !== secMin) {
        const delta = secMax - secMin;
        switch (secMax) {
          case secondaryR: secHue = ((secondaryG - secondaryB) / delta + (secondaryG < secondaryB ? 6 : 0)) / 6 * 360; break;
          case secondaryG: secHue = ((secondaryB - secondaryR) / delta + 2) / 6 * 360; break;
          case secondaryB: secHue = ((secondaryR - secondaryG) / delta + 4) / 6 * 360; break;
        }
      }
      
      bodyGradient.addColorStop(0, `hsl(${hslHue}, ${hslSat}%, ${hslLight + 25 * healthMod}%)`);
      bodyGradient.addColorStop(0.3, `hsl(${secHue}, ${hslSat}%, ${secLightness * 100 * healthMod}%)`);
      bodyGradient.addColorStop(0.7, `hsl(${hslHue - 10}, ${hslSat + 15}%, ${(hslLight - 15) * healthMod}%)`);
      bodyGradient.addColorStop(1, `hsl(${secHue - 20}, ${hslSat + 10}%, ${(secLightness * 100 - 25) * healthMod}%)`);
      
      ctx.fillStyle = bodyGradient;
      ctx.fill();
      
      // Surface patterns overlay with decimal uniqueness
      if (advanced?.tipoPatron > 0 && advanced?.densidadPatron > 0.1) {
        const patternTypeRaw = advanced.tipoPatron;
        const patternType = Math.floor(patternTypeRaw);
        const patternVariation = patternTypeRaw % 1; // Decimal for pattern uniqueness
        const density = advanced.densidadPatron;
        
        ctx.save();
        ctx.globalAlpha = density * 0.6;
        ctx.strokeStyle = `hsl(${secHue}, ${hslSat + 20}%, ${(secLightness * 100 - 30) * healthMod}%)`;
        ctx.lineWidth = 1;
        
        switch (patternType) {
          case 1: // Spots with decimal uniqueness
            const spotCount = Math.floor(density * (10 + patternVariation * 6)); // 10-16 spots based on decimal
            for (let i = 0; i < spotCount; i++) {
              const angle = (i / spotCount) * Math.PI * 2 + patternVariation * Math.PI * 0.5; // Unique rotation
              const r = baseSize * (0.25 + patternVariation * 0.1) + Math.sin(angle * 3) * baseSize * 0.2;
              const x = Math.cos(angle) * r;
              const y = Math.sin(angle) * r;
              const spotSize = baseSize * (0.06 + patternVariation * 0.04); // 0.06-0.10 size variation
              ctx.beginPath();
              ctx.arc(x, y, spotSize, 0, Math.PI * 2);
              ctx.stroke();
            }
            break;
          case 2: // Stripes
            for (let i = -baseSize; i < baseSize; i += baseSize * 0.3 / density) {
              ctx.beginPath();
              ctx.moveTo(i, -baseSize);
              ctx.lineTo(i, baseSize);
              ctx.stroke();
            }
            break;
          case 4: // Swirls
            ctx.beginPath();
            for (let t = 0; t < Math.PI * 4; t += 0.1) {
              const r = baseSize * 0.6 * (1 - t / (Math.PI * 4));
              const x = Math.cos(t) * r;
              const y = Math.sin(t) * r;
              if (t === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
            break;
        }
        ctx.restore();
      }
      
      // Enhanced glow with bioluminescence - MORE INTENSE
      if (advanced?.emiteLuz) {
        const lightR = advanced.colorLuzR || 0.9;
        const lightG = advanced.colorLuzG || 0.9;
        const lightB = advanced.colorLuzB || 0.7;
        const glowPulse = 0.8 + 0.4 * Math.sin(currentTime * 0.003 + creature.id); // Stronger pulse
        
        ctx.shadowColor = `rgba(${Math.floor(lightR * 255)}, ${Math.floor(lightG * 255)}, ${Math.floor(lightB * 255)}, ${glowPulse})`;
        ctx.shadowBlur = baseSize * 1.2; // Larger glow
        ctx.fill();
        
        // Double glow for more impact
        ctx.shadowBlur = baseSize * 0.6;
        ctx.fill();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      } else if (energyMod > 0.4) { // Lower threshold
        // Regular energy glow - MORE VISIBLE
        ctx.shadowColor = `hsl(${hslHue}, ${hslSat + 20}%, ${hslLight + 30}%)`;
        ctx.shadowBlur = 15 * energyMod; // Larger glow
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      // ENHANCED EYES - Using decimal precision for uniqueness
      const eyeTypeRaw = advanced?.tipoOjos || 0;
      const eyeType = Math.floor(eyeTypeRaw);
      const eyeVariation = eyeTypeRaw % 1; // Extract decimal part for uniqueness
      
      const eyeSizeMultiplier = advanced?.tamanoOjos || 1.0;
      const baseEyeSize = baseSize * 0.15 * eyeSizeMultiplier;
      
      // Use eye variation for unique spacing and asymmetry
      const eyeDistanceBase = baseSize * 0.4;
      const eyeDistance = eyeDistanceBase * (0.9 + eyeVariation * 0.2); // 0.9x - 1.1x variation
      const eyeAsymmetry = (eyeVariation - 0.5) * baseEyeSize * 0.1; // Slight asymmetry
      
      // Eye closure based on activity state and circadian rhythm
      const isSleeping = physics.activityState === 'sleeping';
      const isDrowsy = physics.activityState === 'drowsy';
      const eyeOpenness = isSleeping ? 0.1 : isDrowsy ? 0.5 : 1.0;
      
      // Blinking animation when awake
      const blinkCycle = Math.sin(currentTime * 0.001 + physics.id) * 0.5 + 0.5;
      const shouldBlink = blinkCycle > 0.95 && !isSleeping;
      const finalEyeOpenness = shouldBlink ? 0.2 : eyeOpenness;
      
      // Pupil movement based on energy level (less when tired)
      const pupilSpeed = (advanced?.nivelEnergia || 0.5) * 0.003 * eyeOpenness;
      const pupilOffsetX = Math.sin(currentTime * pupilSpeed) * 2;
      const pupilOffsetY = Math.cos(currentTime * pupilSpeed * 1.3) * 2;
      
             // Draw eyes based on type
       if (eyeType === 1) {
         // Feline eyes - more elongated
         [-eyeDistance, eyeDistance].forEach(x => {
           const y = -baseSize * 0.2;
           
           // Eye shape
           ctx.beginPath();
           ctx.ellipse(x, y, baseEyeSize, baseEyeSize * 0.7, 0, 0, Math.PI * 2);
           ctx.fillStyle = 'white';
           ctx.fill();
           
           // Iris
           ctx.beginPath();
           ctx.ellipse(x, y, baseEyeSize * 0.8, baseEyeSize * 0.5, 0, 0, Math.PI * 2);
           ctx.fillStyle = `hsl(${(hslHue + 180) % 360}, 80%, 45%)`;
           ctx.fill();
           
           // Vertical pupil
           ctx.beginPath();
           ctx.ellipse(x + pupilOffsetX, y + pupilOffsetY, baseEyeSize * 0.15, baseEyeSize * 0.4, 0, 0, Math.PI * 2);
           ctx.fillStyle = 'black';
           ctx.fill();
         });
       } else if (eyeType === 2) {
         // Compound eyes - multiple small segments
         [-eyeDistance, eyeDistance].forEach(x => {
           const y = -baseSize * 0.2;
           const segments = 6;
           for (let i = 0; i < segments; i++) {
             const angle = (i / segments) * Math.PI * 2;
             const segX = x + Math.cos(angle) * baseEyeSize * 0.3;
             const segY = y + Math.sin(angle) * baseEyeSize * 0.3;
             
             ctx.beginPath();
             ctx.arc(segX, segY, baseEyeSize * 0.3, 0, Math.PI * 2);
             ctx.fillStyle = `hsl(${(hslHue + 180 + i * 10) % 360}, 70%, 40%)`;
             ctx.fill();
             ctx.strokeStyle = 'black';
             ctx.lineWidth = 1;
             ctx.stroke();
           }
         });
       } else if (eyeType === 3) {
         // Multiple eyes - 4 smaller eyes
         const positions = [
           [-eyeDistance * 0.7, -baseSize * 0.3],
           [eyeDistance * 0.7, -baseSize * 0.3],
           [-eyeDistance * 1.2, -baseSize * 0.1],
           [eyeDistance * 1.2, -baseSize * 0.1]
         ];
         
         positions.forEach(([x, y]) => {
           ctx.beginPath();
           ctx.arc(x, y, baseEyeSize * 0.6, 0, Math.PI * 2);
           ctx.fillStyle = 'white';
           ctx.fill();
           
           ctx.beginPath();
           ctx.arc(x + pupilOffsetX * 0.5, y + pupilOffsetY * 0.5, baseEyeSize * 0.2, 0, Math.PI * 2);
           ctx.fillStyle = 'black';
           ctx.fill();
         });
       } else {
         // Round eyes (default) with sleep states and decimal uniqueness
         [-eyeDistance, eyeDistance].forEach((x, index) => {
           const y = -baseSize * 0.2 + (index === 1 ? eyeAsymmetry : -eyeAsymmetry); // Slight asymmetry
           const individualEyeSize = baseEyeSize * (0.95 + eyeVariation * 0.1); // Size variation per eye
           
                        if (finalEyeOpenness < 0.3) {
               // Closed/sleeping eyes - draw as lines with unique angles
               ctx.strokeStyle = `hsl(${hslHue - 30}, 50%, 30%)`;
               ctx.lineWidth = 2;
               const eyeAngle = (eyeVariation - 0.5) * 0.3; // Unique eye angle
               ctx.beginPath();
               ctx.moveTo(x - individualEyeSize + Math.sin(eyeAngle) * 2, y - Math.cos(eyeAngle) * 2);
               ctx.lineTo(x + individualEyeSize + Math.sin(eyeAngle) * 2, y + Math.cos(eyeAngle) * 2);
               ctx.stroke();
                        } else {
               // Open eyes with variable openness and decimal uniqueness
               const eyeHeight = individualEyeSize * finalEyeOpenness;
               const eyeRotation = (eyeVariation - 0.5) * 0.2; // Unique eye rotation
               
               // Eye white (ellipse when drowsy) with unique proportions
               const eyeEccentricity = 0.9 + eyeVariation * 0.2; // 0.9-1.1 width variation
               ctx.beginPath();
               ctx.ellipse(x, y, individualEyeSize * eyeEccentricity, eyeHeight, eyeRotation, 0, Math.PI * 2);
               ctx.fillStyle = 'white';
               ctx.fill();
               
               // Iris (scaled with eye openness) with unique color shift
               const irisHueShift = eyeVariation * 60 - 30; // ±30 degree hue shift
               ctx.beginPath();
               ctx.ellipse(x, y, individualEyeSize * 0.7 * eyeEccentricity, eyeHeight * 0.7, eyeRotation, 0, Math.PI * 2);
               ctx.fillStyle = `hsl(${((hslHue + 180 + irisHueShift) % 360)}, ${60 + eyeVariation * 20}%, ${45 + eyeVariation * 10}%)`;
               ctx.fill();
             
             // Pupil (only if reasonably open)
             if (finalEyeOpenness > 0.4) {
               ctx.beginPath();
               ctx.arc(x + pupilOffsetX, y + pupilOffsetY, baseEyeSize * 0.3 * finalEyeOpenness, 0, Math.PI * 2);
               ctx.fillStyle = 'black';
               ctx.fill();
               
               // Eye shine (only when awake)
               if (finalEyeOpenness > 0.8) {
                 ctx.beginPath();
                 ctx.arc(x + pupilOffsetX - 1, y + pupilOffsetY - 1, baseEyeSize * 0.1, 0, Math.PI * 2);
                 ctx.fillStyle = 'white';
                 ctx.fill();
               }
             }
           }
         });
       }

      // ENHANCED MOUTH - Using decimal precision for uniqueness
      const mouthTypeRaw = advanced?.tipoBoca || 0;
      const mouthType = Math.floor(mouthTypeRaw);
      const mouthVariation = mouthTypeRaw % 1; // Extract decimal for unique mouth characteristics
      
      const mouthY = baseSize * (0.28 + mouthVariation * 0.04); // 0.28-0.32 position variation
      const mouthWidth = baseSize * (0.25 + mouthVariation * 0.1); // 0.25-0.35 width variation
      const mouthOpenness = 0.5 + 0.5 * Math.sin(currentTime * 0.004 * (advanced?.nivelEnergia || 1) * (0.8 + mouthVariation * 0.4));
      
      ctx.strokeStyle = `hsl(${hslHue - 30}, 50%, 30%)`;
      ctx.fillStyle = `hsl(${hslHue - 30}, 40%, 20%)`;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      switch (mouthType) {
        case 1: // Large mouth
          ctx.beginPath();
          ctx.arc(0, mouthY, mouthWidth * 1.5 * mouthOpenness, 0, Math.PI);
          ctx.stroke();
          if (mouthOpenness > 0.7) {
            ctx.fill(); // Show interior when wide open
          }
          break;
        case 2: // Beak
          ctx.beginPath();
          ctx.moveTo(-mouthWidth * 0.3, mouthY - 2);
          ctx.lineTo(0, mouthY + mouthWidth * 0.5);
          ctx.lineTo(mouthWidth * 0.3, mouthY - 2);
          ctx.closePath();
          ctx.fillStyle = `hsl(${hslHue + 40}, 60%, 40%)`;
          ctx.fill();
          ctx.stroke();
          break;
        case 3: // Tentacle mouth
          const tentacleCount = 4;
          for (let i = 0; i < tentacleCount; i++) {
            const angle = (i / tentacleCount) * Math.PI + Math.PI * 0.2;
            const length = mouthWidth * (0.5 + mouthOpenness * 0.5);
            const endX = Math.cos(angle) * length;
            const endY = mouthY + Math.sin(angle) * length * 0.5;
            
            ctx.beginPath();
            ctx.moveTo(0, mouthY);
            ctx.quadraticCurveTo(endX * 0.5, mouthY, endX, endY);
            ctx.stroke();
            
            // Tentacle tip
            ctx.beginPath();
            ctx.arc(endX, endY, 1, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        default: // Small mouth
          ctx.beginPath();
          ctx.arc(0, mouthY, mouthWidth * mouthOpenness, 0, Math.PI);
          ctx.stroke();
      }

      // TENTACLES/APPENDAGES
      const numApps = Math.min(6, Math.floor(visual.numApendices || 0));
      for (let i = 0; i < numApps; i++) {
        const baseAngle = (i / numApps) * Math.PI * 2;
        const angle = baseAngle + Math.sin(currentTime * 0.002 + i) * 0.3;
        const length = baseSize * 0.6 * (0.8 + 0.4 * Math.sin(currentTime * 0.003 + i));
        
        ctx.save();
        ctx.rotate(angle);
        ctx.translate(baseSize * 0.7, 0);
        
        // Tentacle
        ctx.strokeStyle = `hsl(${hslHue - 20}, ${hslSat}%, ${(hslLight - 10) * healthMod}%)`;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        
        const segments = 4;
        for (let j = 1; j <= segments; j++) {
          const t = j / segments;
          const segmentX = length * t;
          const wave = Math.sin(currentTime * 0.005 + i + t * 4) * length * 0.2;
          const segmentY = wave;
          
          if (j === 1) {
            ctx.lineTo(segmentX, segmentY);
          } else {
            const prevT = (j - 1) / segments;
            const prevX = length * prevT;
            const prevWave = Math.sin(currentTime * 0.005 + i + prevT * 4) * length * 0.2;
            
            ctx.quadraticCurveTo(
              (prevX + segmentX) / 2,
              (prevWave + segmentY) / 2,
              segmentX, segmentY
            );
          }
        }
        ctx.stroke();
        
        // Tentacle tip
        const tipX = length;
        const tipY = Math.sin(currentTime * 0.005 + i) * length * 0.2;
        
        ctx.beginPath();
        ctx.arc(tipX, tipY, 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${hslHue + 40}, 80%, 70%)`;
        ctx.fill();
        
        ctx.restore();
      }

      // ELEMENTAL EFFECTS - Advanced visual effects
      const elementalEffect = advanced?.efectoElemental || 0;
      
      if (elementalEffect > 0) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        
        switch (elementalEffect) {
          case 1: // Crystal effect
            ctx.strokeStyle = `hsla(${hslHue + 120}, 90%, 70%, 0.7)`;
            ctx.lineWidth = 2;
            // Draw crystalline lines
            for (let i = 0; i < 6; i++) {
              const angle = (i / 6) * Math.PI * 2;
              const innerR = baseSize * 0.7;
              const outerR = baseSize * 1.1;
              
              ctx.beginPath();
              ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
              ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
              ctx.stroke();
            }
            break;
            
          case 2: // Flame effect
            const flameParticles = 8;
            for (let i = 0; i < flameParticles; i++) {
              const angle = (i / flameParticles) * Math.PI * 2;
              const distance = baseSize * (1.0 + 0.3 * Math.sin(currentTime * 0.01 + i));
              const px = Math.cos(angle) * distance;
              const py = Math.sin(angle) * distance - Math.abs(Math.sin(currentTime * 0.008 + i)) * 8;
              
              const flameSize = 3 + Math.sin(currentTime * 0.012 + i) * 2;
              ctx.beginPath();
              ctx.arc(px, py, flameSize, 0, Math.PI * 2);
              ctx.fillStyle = `hsla(${20 + Math.sin(currentTime * 0.01 + i) * 40}, 90%, 70%, 0.8)`;
              ctx.fill();
            }
            break;
            
          case 3: // Ice effect
            ctx.strokeStyle = `hsla(200, 90%, 80%, 0.6)`;
            ctx.lineWidth = 1;
            // Ice crystals
            for (let i = 0; i < 12; i++) {
              const angle = (i / 12) * Math.PI * 2;
              const r = baseSize * (0.8 + 0.4 * Math.sin(currentTime * 0.003 + i));
              const px = Math.cos(angle) * r;
              const py = Math.sin(angle) * r;
              
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(px + Math.cos(angle + Math.PI/2) * 5, py + Math.sin(angle + Math.PI/2) * 5);
              ctx.moveTo(px, py);
              ctx.lineTo(px + Math.cos(angle - Math.PI/2) * 5, py + Math.sin(angle - Math.PI/2) * 5);
              ctx.stroke();
            }
            break;
        }
        
        ctx.restore();
      }
      
      // Energy aura for high energy creatures - MORE DRAMATIC
      if (energyMod > 0.3) { // Lower threshold for more creatures
        ctx.strokeStyle = `hsla(${hslHue + 60}, 90%, 85%, 0.8)`; // More opaque
        ctx.lineWidth = 2; // Thicker line
        ctx.beginPath();
        ctx.arc(0, 0, baseSize * 1.5, 0, Math.PI * 2); // Larger aura
        ctx.stroke();
        
        // More energy particles for impact
        for (let i = 0; i < 6; i++) { // Double the particles
          const angle = currentTime * 0.002 + (i / 6) * Math.PI * 2;
          const radius = baseSize * (1.3 + 0.3 * Math.sin(currentTime * 0.005 + i));
          const px = Math.cos(angle) * radius;
          const py = Math.sin(angle) * radius;
          
          const particleSize = 3 + Math.sin(currentTime * 0.008 + i) * 1; // Variable size
          ctx.beginPath();
          ctx.arc(px, py, particleSize, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hslHue + 60 + i * 10}, 95%, 85%, 0.9)`; // More saturated
          ctx.fill();
          
          // Particle glow
          ctx.shadowColor = `hsla(${hslHue + 60 + i * 10}, 95%, 85%, 0.6)`;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }
      }

      ctx.restore();
    };

    const animate = () => {
      const currentTime = Date.now();
      
              // Debug: log less frequently
        if (currentTime % 2000 < 20) { // Log every 2 seconds
          console.log(`Animation running - isPlaying: ${isPlaying}, creatures: ${parsedCreatures.length}, speed: ${animationSpeed}x`);
        }
      
      // Always clear and redraw canvas for smooth animation
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // PRIMORDIA - CHAOTIC NEBULA ENVIRONMENT
      // Deep nebula gradient - the roiling heart of creation
      const nebulaGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      nebulaGradient.addColorStop(0, nebulaTopColor); // Deep cosmic void
      nebulaGradient.addColorStop(0.25, nebulaMidColor); // Mid nebula swirls
      nebulaGradient.addColorStop(0.65, nebulaDeepColor); // Energy-rich depths
      nebulaGradient.addColorStop(1, nebulaBottomColor); // Foundational strata
      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Anima Streams - flowing lifeblood energy - MORE SUBTLE
      ctx.save();
      ctx.globalAlpha = 0.25; // Less prominent so creatures stand out
      ctx.strokeStyle = animaStreamColor;
      ctx.lineWidth = 1;
      ctx.shadowColor = animaStreamColor;
      ctx.shadowBlur = 4;
      for (let i = 0; i < 6; i++) {
        const streamPhase = currentTime * 0.0008 + i * 1.2;
        const streamY = 30 + i * 60 + Math.sin(streamPhase) * 25;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 15) {
          const y = streamY + Math.sin((x * 0.015) + streamPhase) * 20;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
      
      // Creation Energy Particles - colliding forces of genesis - MORE SUBTLE
      ctx.save();
      ctx.globalAlpha = 0.3; // Less prominent so creatures stand out
      for (let i = 0; i < 20; i++) {
        const energyPhase = currentTime * 0.001 + i * 0.3;
        const x = (i * 35 + Math.sin(energyPhase * 1.5) * 40) % canvas.width;
        const y = (i * 25 + Math.cos(energyPhase * 1.2) * 50) % canvas.height;
        const size = Math.max(0.5, 1.5 + Math.sin(energyPhase * 3) * 1); // Ensure minimum size
        const pulsation = Math.max(0.1, 0.5 + 0.5 * Math.sin(energyPhase * 4)); // Ensure positive pulsation
        const radius = Math.max(0.1, size * pulsation); // Ensure positive radius
        
        ctx.shadowColor = creationEnergyColor;
        ctx.shadowBlur = 10 * pulsation;
        ctx.fillStyle = creationEnergyColor;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      
      // Echoes of the First Forging - golden memory fragments
      ctx.save();
      ctx.globalAlpha = 0.25;
      for (let i = 0; i < 8; i++) {
        const echoPhase = currentTime * 0.0003 + i * 0.8;
        const x = (i * 80 + Math.sin(echoPhase) * 60) % canvas.width;
        const y = (i * 45 + Math.cos(echoPhase * 0.7) * 30) % canvas.height;
        const size = Math.max(0.5, 2 + Math.sin(echoPhase * 2) * 1.5); // Ensure minimum size
        const twinkle = Math.max(0.1, 0.3 + 0.7 * Math.sin(echoPhase * 5)); // Ensure positive twinkle
        const radius = Math.max(0.1, size * twinkle); // Ensure positive radius
        
        ctx.shadowColor = echoColor;
        ctx.shadowBlur = 15 * twinkle;
        ctx.fillStyle = echoColor;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Echo trails
        ctx.strokeStyle = echoColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = Math.max(0.05, 0.1 * twinkle); // Ensure positive alpha
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(echoPhase * 2) * 20, y + Math.sin(echoPhase * 2) * 20);
        ctx.stroke();
      }
      ctx.restore();
      
      // Elemental Strata - foundational energy layers
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = elementalStratumColor;
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const stratumY = canvas.height - 80 + i * 15;
        const stratumPhase = currentTime * 0.0005 + i * 0.5;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 10) {
          const y = stratumY + Math.sin((x * 0.01) + stratumPhase) * 5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
      
      // Draw grid if enabled
      if (showGrid) {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        const gridSize = 50;
        
        for (let x = 0; x < canvas.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        
        for (let y = 0; y < canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      // Update physics and draw creatures
      parsedCreatures.forEach((creature, index) => {
        if (!creature.estaViva) return;
        
        let physics = localCreaturePhysics.get(creature.id);
        if (!physics) {
          physics = initializeCreaturePhysics(creature, index, canvas.width, canvas.height);
          localCreaturePhysics.set(creature.id, physics);
          console.log('Initialized physics for creature:', creature.id, 'at position:', physics.x, physics.y, 'target:', physics.targetX, physics.targetY);
        }
        
        // Update physics
        const oldX = physics.x;
        const oldY = physics.y;
        console.log(`Before update - Creature ${creature.id}: (${oldX.toFixed(2)}, ${oldY.toFixed(2)}) target: (${physics.targetX.toFixed(2)}, ${physics.targetY.toFixed(2)}) vx: ${physics.vx.toFixed(4)} vy: ${physics.vy.toFixed(4)}`);
        
        physics = updateCreaturePhysics(physics, creature, currentTime, canvas.width, canvas.height);
        localCreaturePhysics.set(creature.id, physics);
        
        console.log(`After update - Creature ${creature.id}: (${physics.x.toFixed(2)}, ${physics.y.toFixed(2)}) target: (${physics.targetX.toFixed(2)}, ${physics.targetY.toFixed(2)}) vx: ${physics.vx.toFixed(4)} vy: ${physics.vy.toFixed(4)}`);
        
        
        // Only log movement if there's significant change
        const moved = Math.abs(physics.x - oldX) > 0.1 || Math.abs(physics.y - oldY) > 0.1;
        if (moved && currentTime % 500 < 20) { // Log movement every half second if creature moved
          const speedMultiplier = isPlaying ? 1.0 : 0.0;
          const baseSpeed = 0.05 * animationSpeed * speedMultiplier;
          console.log(`Creature ${creature.id} moved: (${physics.x.toFixed(1)}, ${physics.y.toFixed(1)}) target: (${physics.targetX.toFixed(1)}, ${physics.targetY.toFixed(1)}) speed: ${baseSpeed.toFixed(3)} isPlaying: ${isPlaying}`);
        }
        
        // Draw trails first - MORE VIBRANT
        if (showTrails && physics.trailPoints.length > 1) {
          ctx.save();
          ctx.lineCap = 'round';
          for (let i = 0; i < physics.trailPoints.length; i++) {
            const point = physics.trailPoints[i];
            const size = (point.alpha * 8) + 2; // Larger trails
            
            ctx.globalAlpha = point.alpha * 0.7; // More opaque trails
            const visual = creature.visual || {};
            const hue = visual.colorR ? (visual.colorR * 360) % 360 : 180;
            ctx.fillStyle = `hsl(${hue}, 80%, 70%)`; // More saturated
            
            // Trail glow
            ctx.shadowColor = `hsl(${hue}, 80%, 70%)`;
            ctx.shadowBlur = 6;
            
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          }
          ctx.restore();
        }
        
        // Draw particles
        if (showParticles) {
          physics.particles.forEach((particle: any) => {
            const alpha = particle.life / particle.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });
        }
        
        // Draw creature
        console.log('Drawing creature at:', physics.x, physics.y);
        drawCreature(physics, creature, currentTime);
        
        // Selection indicator
        if (selectedCreature === creature.id) {
          ctx.save();
          ctx.strokeStyle = selectionColor;
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.8 + 0.2 * Math.sin(currentTime * 0.005);
          ctx.beginPath();
          ctx.arc(physics.x, physics.y, 45, 0, Math.PI * 2);
          ctx.stroke();
          
          // Selection pulse
          ctx.globalAlpha = 0.3 + 0.2 * Math.sin(currentTime * 0.008);
          ctx.beginPath();
          ctx.arc(physics.x, physics.y, 55 + Math.sin(currentTime * 0.01) * 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        
        // Draw creature ID
        ctx.fillStyle = selectedCreature === creature.id ? selectionColor : textColor;
        ctx.font = selectedCreature === creature.id ? 'bold 12px Arial' : '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`#${creature.id}`, physics.x, physics.y - 40);
      });
      
      // Clean up physics for dead creatures
      const aliveIds = new Set(parsedCreatures.filter(c => c.estaViva).map(c => c.id));
      localCreaturePhysics.forEach((_, id) => {
        if (!aliveIds.has(id)) {
          localCreaturePhysics.delete(id);
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation immediately
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
      }, [parsedCreatures, nebulaTopColor, nebulaMidColor, nebulaDeepColor, nebulaBottomColor, animaStreamColor, creationEnergyColor, echoColor, elementalStratumColor, selectionColor, gridColor, textColor, showTrails, showParticles, showGrid, isPlaying, animationSpeed, updateCreaturePhysics, initializeCreaturePhysics]);

  return (
    <VStack spacing={6} align="stretch" w="full">
      {/* Environment Controls */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={2} mb={4}>
          <ButtonGroup size="sm" isAttached variant="outline">
            <Button 
              onClick={() => setIsPlaying(!isPlaying)}
              colorScheme={isPlaying ? "red" : "green"}
            >
              {isPlaying ? "⏸️ Pause" : "▶️ Play"}
            </Button>
            <Button onClick={() => setAnimationSpeed(prev => prev === 1 ? 2 : prev === 2 ? 0.5 : 1)}>
              {animationSpeed === 2 ? "⏩ 2x" : animationSpeed === 0.5 ? "🐌 0.5x" : "🎯 1x"}
            </Button>
          </ButtonGroup>
          
          <Flex gap={2} wrap="wrap">
            <Tag 
              size="sm" 
              colorScheme={showTrails ? "blue" : "gray"}
              cursor="pointer"
              onClick={() => setShowTrails(!showTrails)}
            >
              ✨ Trails
            </Tag>
            <Tag 
              size="sm" 
              colorScheme={showParticles ? "purple" : "gray"}
              cursor="pointer"
              onClick={() => setShowParticles(!showParticles)}
            >
              💫 Particles
            </Tag>
            <Tag 
              size="sm" 
              colorScheme={showGrid ? "green" : "gray"}
              cursor="pointer"
              onClick={() => setShowGrid(!showGrid)}
            >
              📐 Grid
            </Tag>
          </Flex>
        </Flex>
      </MotionBox>

      {/* Enhanced Canvas */}
      <MotionBox
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        bg={bgColor}
        p={4}
        borderRadius="xl"
        border="1px"
        borderColor={borderColor}
        boxShadow="0 10px 40px rgba(0, 0, 0, 0.3)"
      >
        <Text fontSize="lg" fontWeight="bold" mb={4} textAlign="center">
          🌌 Primordia: Genesis Shaper's Realm
        </Text>
        <canvas 
          ref={canvasRef}
          width={900}
          height={600}
          onClick={(e) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            
            // Find clicked creature
            let clickedCreature = null;
            const localCreaturePhysics = creaturePhysicsRef.current;
            
            parsedCreatures.forEach(creature => {
              if (!creature.estaViva) return;
              const physics = localCreaturePhysics.get(creature.id);
              if (!physics) return;
              
              const distance = Math.sqrt((x - physics.x) ** 2 + (y - physics.y) ** 2);
              const clickRadius = 30; // Click tolerance
              
              if (distance <= clickRadius) {
                clickedCreature = creature.id;
              }
            });
            
            setSelectedCreature(clickedCreature === selectedCreature ? null : clickedCreature);
          }}
          style={{ 
            width: '100%', 
            maxWidth: '900px',
            height: 'auto', 
            borderRadius: '12px',
            backgroundColor: canvasBgColor,
            margin: '0 auto',
            display: 'block',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        />
        
        {/* Genesis Protocol Stats */}
        <Flex justify="center" gap={4} wrap="wrap" mt={4}>
          <Text fontSize="sm" color="gray.400">
            🧬 Active Life Forms: {parsedCreatures.filter(c => c.estaViva).length}
          </Text>
          <Text fontSize="sm" color="gray.400">
            ⚡ Anima Essence: {parsedCreatures.reduce((sum, c) => sum + parseFloat(c.puntosEvolucion), 0).toFixed(1)}
          </Text>
          <Text fontSize="sm" color="gray.400">
            🌌 Nebula Flow: {isPlaying ? 'Active' : 'Stasis'} ({animationSpeed}x)
          </Text>
        </Flex>
      </MotionBox>

      {/* Selected Creature Card */}
      {selectedCreature && (
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          mb={4}
        >
          <Text fontSize="lg" fontWeight="bold" mb={3} textAlign="center">
            🔮 Elemental Life Form Analysis
          </Text>
        </MotionBox>
      )}
      
      {!selectedCreature && (
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          textAlign="center"
          py={8}
        >
          <Text fontSize="lg" color="gray.500" mb={2}>
            ✨ Click on any life form to commune with its essence
          </Text>
          <Text fontSize="sm" color="gray.400">
            Explore their elemental traits, Anima patterns, and primordial nature
          </Text>
        </MotionBox>
      )}
      
      <SimpleGrid columns={{ base: 1 }} spacing={4}>
        <AnimatePresence>
          {parsedCreatures
            .filter(creature => selectedCreature ? creature.id === selectedCreature : false)
            .map((creature, index) => (
            <MotionCard
              key={creature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              bg={cardBg}
              border="1px"
              borderColor={borderColor}
              overflow="hidden"
            >
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  {/* Header */}
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" fontSize="lg">
                      Life Form #{creature.id}
                    </Text>
                    <HStack spacing={1}>
                      <Icon as={FiHeart} color={creature.estaViva ? "green.500" : "red.500"} />
                      <Badge colorScheme={creature.estaViva ? "green" : "red"}>
                        {creature.estaViva ? "Alive" : "Dead"}
                      </Badge>
                    </HStack>
                  </Flex>

                  {/* Basic Stats */}
                  <SimpleGrid columns={2} spacing={2}>
                    <Box>
                      <Text fontSize="xs" color="gray.500">Age</Text>
                      <Text fontSize="sm" fontWeight="bold">
                        {parseFloat(creature.edadDiasCompletos).toFixed(1)} days
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500">Anima Essence</Text>
                      <Text fontSize="sm" fontWeight="bold" color="purple.500">
                        {parseFloat(creature.puntosEvolucion).toFixed(1)}
                      </Text>
                    </Box>
                  </SimpleGrid>

                  {/* Visual Traits */}
                  {creature.visual && (
                    <Box>
                      <Text fontSize="xs" color="gray.500" mb={1}>Visual Traits</Text>
                      <HStack wrap="wrap" spacing={1}>
                        <Badge 
                          colorScheme="red" 
                          variant="solid"
                          style={{ 
                            backgroundColor: `rgb(${Math.floor((creature.visual.colorR || 0) * 255)}, ${Math.floor((creature.visual.colorG || 0) * 255)}, ${Math.floor((creature.visual.colorB || 0) * 255)})`,
                            color: 'white'
                          }}
                        >
                          Color
                        </Badge>
                        <Badge colorScheme="blue">
                          {FORM_TYPES[Math.floor((creature.visual.formaPrincipal || 1) - 1)] || 'Unknown'}
                        </Badge>
                        <Badge colorScheme="green">
                          Size: {(creature.visual.tamanoBase || 1).toFixed(1)}x
                        </Badge>
                        <Badge colorScheme="orange">
                          Apps: {Math.floor(creature.visual.numApendices || 0)}
                        </Badge>
                      </HStack>
                    </Box>
                  )}

                  {/* Advanced Visual Features */}
                  {creature.advanced && (
                    <VStack align="stretch" spacing={2}>
                      <Box>
                        <Text fontSize="xs" color="gray.500" mb={1}>🎨 Visual Effects</Text>
                        <HStack wrap="wrap" spacing={1}>
                          {creature.advanced.tipoPatron > 0 && (
                            <Badge colorScheme="purple" title={`Density: ${(creature.advanced.densidadPatron * 100).toFixed(0)}%`}>
                              {PATTERN_TYPES[creature.advanced.tipoPatron] || 'Pattern'}
                            </Badge>
                          )}
                          {creature.advanced.tipoAura > 0 && (
                            <Badge colorScheme="cyan" title={`Intensity: ${(creature.advanced.intensidadAura * 100).toFixed(0)}%`}>
                              {AURA_TYPES[creature.advanced.tipoAura] || 'Aura'}
                            </Badge>
                          )}
                          {creature.advanced.emiteLuz && (
                            <Badge colorScheme="yellow">✨ Bioluminescent</Badge>
                          )}
                          {creature.advanced.efectoElemental > 0 && (
                            <Badge colorScheme="teal">
                              {ELEMENTAL_EFFECTS[creature.advanced.efectoElemental] || 'Elemental'}
                            </Badge>
                          )}
                        </HStack>
                      </Box>

                      <Box>
                        <Text fontSize="xs" color="gray.500" mb={1}>👁️ Physical Features</Text>
                        <HStack wrap="wrap" spacing={1}>
                          <Badge colorScheme="gray" title={`Size: ${creature.advanced.tamanoOjos?.toFixed(1)}x`}>
                            {EYE_TYPES[creature.advanced.tipoOjos] || 'Round'} Eyes
                          </Badge>
                          <Badge colorScheme="orange">
                            {MOUTH_TYPES[creature.advanced.tipoBoca] || 'Small'} Mouth
                          </Badge>
                          <Badge colorScheme="green">
                            {TEXTURE_TYPES[creature.advanced.texturaPiel] || 'Smooth'} Skin
                          </Badge>
                          <Badge colorScheme="blue" title={`Brightness: ${((creature.advanced.brilloSuperficie || 0) * 100).toFixed(0)}%`}>
                            ✨ {((creature.advanced.brilloSuperficie || 0) * 100).toFixed(0)}% Shine
                          </Badge>
                        </HStack>
                      </Box>

                      {/* Evolution Marks */}
                      {creature.advanced.marcasEvolucion && creature.advanced.marcasEvolucion.length > 0 && (
                        <Box>
                          <Text fontSize="xs" color="gray.500" mb={1}>🏆 Evolution Marks</Text>
                          <HStack wrap="wrap" spacing={1}>
                            {creature.advanced.marcasEvolucion.map((mark: number, index: number) => (
                              <Badge key={index} colorScheme="gold" variant="solid">
                                {EVOLUTION_MARKS[mark] || `Mark ${mark}`}
                              </Badge>
                            ))}
                          </HStack>
                        </Box>
                      )}

                      {/* Circadian Rhythm */}
                      <Box>
                        <Text fontSize="xs" color="gray.500" mb={1}>🌅 Circadian Cycle</Text>
                        <Progress 
                          value={(creature.advanced.ritmoCircadiano || 0.5) * 100} 
                          colorScheme="yellow" 
                          size="sm" 
                          borderRadius="full"
                        />
                        <Text fontSize="xs" color="gray.400" mt={1}>
                          {(creature.advanced.ritmoCircadiano || 0.5) < 0.25 ? '🌙 Night' : 
                           (creature.advanced.ritmoCircadiano || 0.5) < 0.75 ? '☀️ Day' : '🌅 Dawn/Dusk'}
                        </Text>
                      </Box>
                    </VStack>
                  )}

                  {/* Health & Energy Bars */}
                  {creature.advanced && (
                    <VStack spacing={1} align="stretch">
                      <Box>
                        <Flex justify="space-between" align="center" mb={1}>
                          <Text fontSize="xs" color="gray.500">Health</Text>
                          <Text fontSize="xs" color="gray.500">
                            {Math.floor((creature.advanced.nivelSalud || 1) * 100)}%
                          </Text>
                        </Flex>
                        <Progress 
                          value={(creature.advanced.nivelSalud || 1) * 100} 
                          colorScheme="red" 
                          size="sm" 
                          borderRadius="full"
                        />
                      </Box>
                      <Box>
                        <Flex justify="space-between" align="center" mb={1}>
                          <Text fontSize="xs" color="gray.500">Energy</Text>
                          <Text fontSize="xs" color="gray.500">
                            {Math.floor((creature.advanced.nivelEnergia || 1) * 100)}%
                          </Text>
                        </Flex>
                        <Progress 
                          value={(creature.advanced.nivelEnergia || 1) * 100} 
                          colorScheme="blue" 
                          size="sm" 
                          borderRadius="full"
                        />
                      </Box>
                    </VStack>
                  )}
                </VStack>
              </CardBody>
            </MotionCard>
          ))}
        </AnimatePresence>
      </SimpleGrid>
    </VStack>
  );
} 