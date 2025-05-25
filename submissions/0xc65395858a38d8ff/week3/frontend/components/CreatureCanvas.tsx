'use client';

import type { Sketch, P5CanvasInstance, P5WrapperProps } from 'react-p5-wrapper';
import { ReactP5Wrapper } from 'react-p5-wrapper';
import { useState, useEffect } from 'react';

// La interfaz ya está definida en EnvironmentPage, la importaremos o redefiniremos si es necesario.
// Por ahora, asumimos que la estructura es conocida.
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
}

export interface CreatureCanvasProps extends P5WrapperProps {
  creatures: CreatureUIDataFrontend[];
  canvasWidth?: number;
  canvasHeight?: number;
}

interface CreatureVisualState {
  id: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  angle: number; // For orientation if needed later
  animationPhase: number; // Generic phase for subtle animations, sync
  noiseOffsetSeed: number; // Added for better desynchronization

  // Movement specific
  movementType: number; // 1: Static, 2: Circular, 3: Patrol, 4: Erratic
  movementIntensity: number; // Fractional part of patronMovimiento (0-1)
  targetX?: number;
  targetY?: number;
  patrolPoints?: { x: number; y: number }[];
  currentPatrolIndex?: number;
  circularMotion?: {
    centerX: number;
    centerY: number;
    radiusX: number;
    radiusY: number;
    angle: number;
    speed: number;
  };
  lastErraticChangeTime?: number; // For erratic movement timing

  // Shape specific
  shapeType: number; // 1: Ellipse, 2: Rectangle, 3: Triangle
  shapeIntensity: number; // Fractional part of formaPrincipal (0-1)
  baseDiameter: number;

  // Appendages
  numAppendages: number;
  appendageAnimationPhase: number;
}

// Función para parsear UFix64 (string) a número de forma segura
const parseFloatSafe = (value: string | undefined, defaultValue = 0.0): number => {
  if (value === undefined || value === null) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

const parseIntSafe = (value: string | undefined, defaultValue = 0): number => {
    if (value === undefined || value === null) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  };

const sketch: Sketch<CreatureCanvasProps> = (p: P5CanvasInstance<CreatureCanvasProps>) => {
  let creaturesData: CreatureUIDataFrontend[] = [];
  let creatureVisuals: Map<number, CreatureVisualState> = new Map();
  
  let effectiveCanvasWidth = 600;
  let effectiveCanvasHeight = 400;
  const stars: { x: number; y: number; size: number; opacity: number }[] = [];
  let noiseSeed = 0;

  p.updateWithProps = (props: CreatureCanvasProps) => {
    let newCreaturesReceived = false;
    if (props.creatures) {
      const newCreatureIds = new Set(props.creatures.map(c => c.id));
      const oldCreatureIds = new Set(creaturesData.map(c => c.id));
      if (props.creatures.length !== creaturesData.length || 
          !props.creatures.every(c => oldCreatureIds.has(c.id)) ||
          !creaturesData.every(c => newCreatureIds.has(c.id))) {
        newCreaturesReceived = true;
      }
      creaturesData = props.creatures;
    }

    let dimensionsChanged = false;
    if (props.canvasWidth && props.canvasWidth !== effectiveCanvasWidth) {
      effectiveCanvasWidth = props.canvasWidth;
      dimensionsChanged = true;
    }
    if (props.canvasHeight && props.canvasHeight !== effectiveCanvasHeight) {
      effectiveCanvasHeight = props.canvasHeight;
      dimensionsChanged = true;
    }

    if (dimensionsChanged || newCreaturesReceived) {
      initializeAllCreatureVisuals();
    }

    if (dimensionsChanged && p.canvas) {
      p.resizeCanvas(effectiveCanvasWidth, effectiveCanvasHeight);
      generateStars();
    }
  };

  const initializeCreatureVisual = (creature: CreatureUIDataFrontend, index: number): CreatureVisualState => {
    const patronMovimiento = parseFloatSafe(creature.genesVisibles.patronMovimiento, 1.0);
    const formaPrincipal = parseFloatSafe(creature.genesVisibles.formaPrincipal, 1.0);
    const tamanoBaseGene = parseFloatSafe(creature.genesVisibles.tamanoBase, 1.5);
    const numApendicesGene = parseFloatSafe(creature.genesVisibles.numApendices, 0);
    
    // Ensure initialSeed is treated as a number for noise offset. 
    // It's already number in CreatureUIDataFrontend, but good practice if it were from genes.
    const creatureNoiseSeed = creature.initialSeed || p.random(1000, 5000); // Fallback if initialSeed is 0 or undefined

    const minTamanoBase = 0.5;
    const maxTamanoBase = 3.0;
    const minDiametroPx = 30;
    const maxDiametroPx = 100;
    const normalizedTamano = Math.max(0, Math.min(1, (tamanoBaseGene - minTamanoBase) / (maxTamanoBase - minTamanoBase)));
    const baseDiameter = p.lerp(minDiametroPx, maxDiametroPx, normalizedTamano);

    const visual: CreatureVisualState = {
      id: creature.id,
      x: p.random(baseDiameter, effectiveCanvasWidth - baseDiameter),
      y: p.random(baseDiameter, effectiveCanvasHeight - baseDiameter),
      velocityX: 0,
      velocityY: 0,
      angle: p.random(p.TWO_PI),
      animationPhase: p.random(p.TWO_PI),
      noiseOffsetSeed: creatureNoiseSeed,
      
      movementType: Math.floor(patronMovimiento) % 4 + 1, // 1-4
      movementIntensity: patronMovimiento - Math.floor(patronMovimiento),
      
      shapeType: Math.floor(formaPrincipal) % 3 + 1, // 1-3
      shapeIntensity: formaPrincipal - Math.floor(formaPrincipal),
      baseDiameter: baseDiameter,

      numAppendages: Math.max(0,Math.floor(numApendicesGene)),
      appendageAnimationPhase: p.random(p.TWO_PI)
    };

    // Initialize movement-specific properties
    switch (visual.movementType) {
      case 1: // Static (drifts slightly)
        visual.velocityX = p.random(-0.1, 0.1) * (1 + visual.movementIntensity);
        visual.velocityY = p.random(-0.1, 0.1) * (1 + visual.movementIntensity);
        break;
      case 2: // Circular
        const centralBias = 0.3 + visual.movementIntensity * 0.4; // 0.3 to 0.7
        visual.circularMotion = {
          centerX: p.lerp(effectiveCanvasWidth / 2, visual.x, centralBias),
          centerY: p.lerp(effectiveCanvasHeight / 2, visual.y, centralBias),
          radiusX: p.random(baseDiameter * 0.5, baseDiameter * 2) * (1 + visual.movementIntensity),
          radiusY: p.random(baseDiameter * 0.5, baseDiameter * 2) * (1 + visual.movementIntensity * 0.5), // Allow elliptical
          angle: p.random(p.TWO_PI),
          speed: p.random(0.005, 0.02) * (1 + visual.movementIntensity),
        };
        break;
      case 3: // Patrol
        visual.patrolPoints = [];
        const numPatrolPoints = 2 + Math.floor(visual.movementIntensity * 3); // 2 to 4 points
        for (let i = 0; i < numPatrolPoints; i++) {
          visual.patrolPoints.push({
            x: p.random(baseDiameter, effectiveCanvasWidth - baseDiameter),
            y: p.random(baseDiameter, effectiveCanvasHeight - baseDiameter),
          });
        }
        visual.currentPatrolIndex = 0;
        if (visual.patrolPoints.length > 0) {
          visual.targetX = visual.patrolPoints[0].x;
          visual.targetY = visual.patrolPoints[0].y;
        }
        break;
      case 4: // Erratic
        visual.targetX = p.random(effectiveCanvasWidth);
        visual.targetY = p.random(effectiveCanvasHeight);
        visual.lastErraticChangeTime = p.millis();
        break;
    }
    return visual;
  }

  const initializeAllCreatureVisuals = () => {
    const newVisualsMap = new Map<number, CreatureVisualState>();
    creaturesData.forEach((creature, index) => {
      const existingVisual = creatureVisuals.get(creature.id);
      // Ensure initialSeed is treated as a number for noise offset. 
      const creatureNoiseSeedForUpdate = creature.initialSeed || p.random(1000, 5000); // Fallback

      if (existingVisual && existingVisual.movementType && existingVisual.shapeType) { 
          const updatedGeneVisual = initializeCreatureVisual(creature, index); 
          existingVisual.movementType = updatedGeneVisual.movementType;
          existingVisual.movementIntensity = updatedGeneVisual.movementIntensity;
          existingVisual.shapeType = updatedGeneVisual.shapeType;
          existingVisual.shapeIntensity = updatedGeneVisual.shapeIntensity;
          existingVisual.baseDiameter = updatedGeneVisual.baseDiameter;
          existingVisual.numAppendages = updatedGeneVisual.numAppendages;
          existingVisual.noiseOffsetSeed = creatureNoiseSeedForUpdate; // Update the seed if creature data changes
          
          existingVisual.targetX = undefined; 
          existingVisual.circularMotion = undefined; 
          switch (existingVisual.movementType) { // Re-init based on *new* types
            case 1: existingVisual.velocityX = p.random(-0.1, 0.1) * (1 + existingVisual.movementIntensity); existingVisual.velocityY = p.random(-0.1, 0.1) * (1 + existingVisual.movementIntensity); break;
            case 2: 
                const centralBias = 0.3 + existingVisual.movementIntensity * 0.4;
                existingVisual.circularMotion = {
                    centerX: p.lerp(effectiveCanvasWidth / 2, existingVisual.x, centralBias),
                    centerY: p.lerp(effectiveCanvasHeight / 2, existingVisual.y, centralBias),
                    radiusX: p.random(existingVisual.baseDiameter * 0.5, existingVisual.baseDiameter * 2) * (1 + existingVisual.movementIntensity),
                    radiusY: p.random(existingVisual.baseDiameter * 0.5, existingVisual.baseDiameter * 2) * (1 + existingVisual.movementIntensity * 0.5),
                    angle: p.random(p.TWO_PI),
                    speed: p.random(0.005, 0.02) * (1 + existingVisual.movementIntensity),
                }; break;
            case 3: 
                existingVisual.patrolPoints = [];
                const numPatrolPoints = 2 + Math.floor(existingVisual.movementIntensity * 3);
                for (let i = 0; i < numPatrolPoints; i++) { existingVisual.patrolPoints.push({ x: p.random(existingVisual.baseDiameter, effectiveCanvasWidth - existingVisual.baseDiameter), y: p.random(existingVisual.baseDiameter, effectiveCanvasHeight - existingVisual.baseDiameter), }); }
                existingVisual.currentPatrolIndex = 0;
                if (existingVisual.patrolPoints.length > 0) { existingVisual.targetX = existingVisual.patrolPoints[0].x; existingVisual.targetY = existingVisual.patrolPoints[0].y; }
                break;
            case 4: 
                existingVisual.targetX = p.random(effectiveCanvasWidth); existingVisual.targetY = p.random(effectiveCanvasHeight); existingVisual.lastErraticChangeTime = p.millis(); break;
          }

          newVisualsMap.set(creature.id, existingVisual);
      } else {
          newVisualsMap.set(creature.id, initializeCreatureVisual(creature, index));
      }
    });
    creatureVisuals = newVisualsMap;
  };

  const generateStars = () => {
    stars.length = 0;
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: p.random(effectiveCanvasWidth),
        y: p.random(effectiveCanvasHeight),
        size: p.random(0.5, 2.5),
        opacity: p.random(50, 150)
      });
    }
  }

  p.setup = () => {
    noiseSeed = p.floor(p.random(10000));
    p.noiseSeed(noiseSeed);
    p.createCanvas(effectiveCanvasWidth, effectiveCanvasHeight);
    p.colorMode(p.RGB, 255);
    p.textAlign(p.CENTER, p.CENTER);
    generateStars();
    initializeAllCreatureVisuals();
  };

  const updateCreatureMovement = (visual: CreatureVisualState) => {
    let maxSpeed = 0.5 + visual.movementIntensity * 1.5; // Base max speed 0.5, up to 2.0

    switch (visual.movementType) {
      case 1: // Static (drifts slightly)
        visual.x += visual.velocityX || 0;
        visual.y += visual.velocityY || 0;
        // Add subtle random walk if too static
        if (p.frameCount % 30 === 0) {
            visual.velocityX = (visual.velocityX || 0) + p.random(-0.02, 0.02) * (1 + visual.movementIntensity);
            visual.velocityY = (visual.velocityY || 0) + p.random(-0.02, 0.02) * (1 + visual.movementIntensity);
            visual.velocityX = p.constrain(visual.velocityX || 0, -0.15, 0.15);
            visual.velocityY = p.constrain(visual.velocityY || 0, -0.15, 0.15);
        }
        break;
      case 2: // Circular
        if (visual.circularMotion) {
          visual.circularMotion.angle += visual.circularMotion.speed;
          visual.x = visual.circularMotion.centerX + p.cos(visual.circularMotion.angle) * visual.circularMotion.radiusX;
          visual.y = visual.circularMotion.centerY + p.sin(visual.circularMotion.angle) * visual.circularMotion.radiusY;
          // Center point can also drift slowly
          visual.circularMotion.centerX += p.noise(visual.noiseOffsetSeed, p.frameCount * 0.001) * 0.2 - 0.1;
          visual.circularMotion.centerY += p.noise(visual.noiseOffsetSeed + 1000, p.frameCount * 0.001) * 0.2 - 0.1;
        }
        break;
      case 3: // Patrol
        if (visual.targetX !== undefined && visual.targetY !== undefined && visual.patrolPoints && visual.patrolPoints.length > 0) {
          const targetVec = p.createVector(visual.targetX, visual.targetY);
          const currentPosVec = p.createVector(visual.x, visual.y);
          const dir = p.constructor.Vector.sub(targetVec, currentPosVec);
          const dist = dir.mag();

          if (dist < maxSpeed * 2 || dist < 5) { // Reached target (or close enough)
            visual.currentPatrolIndex = ((visual.currentPatrolIndex || 0) + 1) % visual.patrolPoints.length;
            visual.targetX = visual.patrolPoints[visual.currentPatrolIndex!].x; // ! because length > 0
            visual.targetY = visual.patrolPoints[visual.currentPatrolIndex!].y;
          } else {
            dir.normalize();
            dir.mult(maxSpeed);
            // Add some sideways sway based on movementIntensity & Perlin noise
            const swayAngle = p.noise(visual.noiseOffsetSeed, p.frameCount * 0.02) * p.PI * visual.movementIntensity - (p.PI * visual.movementIntensity / 2);
            const swayVector = p.createVector(dir.y, -dir.x); // Perpendicular
            swayVector.mult(p.sin(swayAngle) * 0.3); // Modulate sway magnitude
            dir.add(swayVector);
            dir.limit(maxSpeed);

            visual.x += dir.x;
            visual.y += dir.y;
          }
        }
        break;
      case 4: // Erratic
        if (visual.targetX !== undefined && visual.targetY !== undefined) {
          const targetVec = p.createVector(visual.targetX, visual.targetY);
          const currentPosVec = p.createVector(visual.x, visual.y);
          const dir = p.constructor.Vector.sub(targetVec, currentPosVec);
          const dist = dir.mag();
          const changeTargetInterval = 2000 + (1 - visual.movementIntensity) * 3000; // 2 to 5 seconds

          if (dist < maxSpeed * 5 || p.millis() - (visual.lastErraticChangeTime || 0) > changeTargetInterval) {
            visual.targetX = p.constrain(visual.x + p.noise(visual.noiseOffsetSeed, p.frameCount * 0.1) * 400 - 200, visual.baseDiameter, effectiveCanvasWidth - visual.baseDiameter);
            visual.targetY = p.constrain(visual.y + p.noise(visual.noiseOffsetSeed + 2000, p.frameCount * 0.1) * 400 - 200, visual.baseDiameter, effectiveCanvasHeight - visual.baseDiameter);
            visual.lastErraticChangeTime = p.millis();
          } else {
            dir.normalize();
            dir.mult(maxSpeed * (0.5 + visual.movementIntensity)); // More intense = faster erratic
            visual.x += dir.x;
            visual.y += dir.y;
          }
        }
        break;
    }
    // Boundary checks - simple bounce for now
    if (visual.x < visual.baseDiameter / 2) { visual.x = visual.baseDiameter / 2; if (visual.movementType === 1 && visual.velocityX) visual.velocityX *= -1; else if(visual.movementType !==2) visual.targetX = p.random(effectiveCanvasWidth * 0.75, effectiveCanvasWidth);}
    if (visual.x > effectiveCanvasWidth - visual.baseDiameter / 2) { visual.x = effectiveCanvasWidth - visual.baseDiameter / 2; if (visual.movementType === 1 && visual.velocityX) visual.velocityX *= -1; else if(visual.movementType !==2) visual.targetX = p.random(0, effectiveCanvasWidth*0.25); }
    if (visual.y < visual.baseDiameter / 2) { visual.y = visual.baseDiameter / 2; if (visual.movementType === 1 && visual.velocityY) visual.velocityY *= -1; else if(visual.movementType !==2) visual.targetY = p.random(effectiveCanvasHeight * 0.75, effectiveCanvasHeight); }
    if (visual.y > effectiveCanvasHeight - visual.baseDiameter / 2) { visual.y = effectiveCanvasHeight - visual.baseDiameter / 2; if (visual.movementType === 1 && visual.velocityY) visual.velocityY *= -1; else if(visual.movementType !==2) visual.targetY = p.random(0, effectiveCanvasHeight*0.25); }

    visual.animationPhase += 0.02 * (1 + visual.movementIntensity); // General pulsing / breathing
    visual.appendageAnimationPhase += 0.05 * (1 + visual.movementIntensity * 0.5);
  };
  
  const drawCreatureBodyAndAppendages = (visual: CreatureVisualState, creatureGenes: { [key: string]: string }) => {
    const geneColorR = parseFloatSafe(creatureGenes.colorR, 0.5) * 255;
    const geneColorG = parseFloatSafe(creatureGenes.colorG, 0.5) * 255;
    const geneColorB = parseFloatSafe(creatureGenes.colorB, 0.5) * 255;
    
    p.push();
    p.translate(visual.x, visual.y);
    // p.rotate(visual.angle); // Could use this for directional sprites later

    const bodyPulse = p.sin(visual.animationPhase) * visual.baseDiameter * 0.05 * visual.shapeIntensity;
    const currentDiameter = visual.baseDiameter + bodyPulse;

    // --- Main Body ---
    p.noStroke();
    p.fill(geneColorR, geneColorG, geneColorB);

    const intensity = visual.shapeIntensity; // 0 to almost 1

    switch (visual.shapeType) {
      case 1: // Ellipse (Sphere) -> morphs to more eccentric with intensity
        const aspectRatio1 = p.lerp(1, 0.6, intensity); // Becomes more squashed/stretched
        p.ellipse(0, 0, currentDiameter, currentDiameter * aspectRatio1);
        break;
      case 2: // Rectangle (Cube) -> morphs to rounded / different aspect with intensity
        const cornerRadius2 = intensity * (currentDiameter * 0.4); // Increased potential rounding
        const aspectRatio2 = p.lerp(1, 1.4, p.sin(visual.animationPhase * 0.5 + visual.noiseOffsetSeed) * intensity * 0.5 + 0.5); // Used noiseOffsetSeed
        p.rectMode(p.CENTER);
        p.rect(0, 0, currentDiameter * aspectRatio2, currentDiameter / aspectRatio2, cornerRadius2, cornerRadius2, cornerRadius2, cornerRadius2);
        break;
      case 3: // Triangle (Pyramid) -> morphs by vertex displacement and curved sides
        const d3 = currentDiameter / 1.8; // Adjusted base for more pronounced effect
        const yOffset3 = intensity * d3 * 0.8 * p.cos(visual.animationPhase * 0.6 + visual.noiseOffsetSeed); // Used noiseOffsetSeed
        const xSkew3 = p.sin(visual.animationPhase * 0.7 + visual.noiseOffsetSeed) * d3 * 0.6 * intensity; // Used noiseOffsetSeed

        const x1_3 = -d3 + xSkew3;
        const y1_3 = d3;
        const x2_3 = d3 - xSkew3;
        const y2_3 = d3;
        const x3_3 = 0;
        const y3_3 = -d3 - yOffset3;

        // Control points for curved sides based on intensity
        // For simplicity, we'll make the triangle sides bulge or contract slightly
        // A more complex approach would use bezierVertex for true curves
        p.beginShape();
        p.vertex(x1_3, y1_3);
        // Quadratic vertex to make side 1-3 curve
        const cp1x = p.lerp(x1_3,x3_3, 0.5) + p.cos(visual.animationPhase + visual.noiseOffsetSeed + intensity) * d3 * 0.2 * intensity; // Used noiseOffsetSeed
        const cp1y = p.lerp(y1_3,y3_3, 0.5) + p.sin(visual.animationPhase + visual.noiseOffsetSeed + intensity) * d3 * 0.2 * intensity; // Used noiseOffsetSeed
        p.quadraticVertex(cp1x, cp1y, x3_3, y3_3);
        // Quadratic vertex to make side 3-2 curve
        const cp2x = p.lerp(x3_3,x2_3, 0.5) - p.cos(visual.animationPhase + visual.noiseOffsetSeed + intensity) * d3 * 0.2 * intensity; // Used noiseOffsetSeed
        const cp2y = p.lerp(y3_3,y2_3, 0.5) - p.sin(visual.animationPhase + visual.noiseOffsetSeed + intensity) * d3 * 0.2 * intensity; // Used noiseOffsetSeed
        p.quadraticVertex(cp2x, cp2y, x2_3, y2_3);
        // Straight line for base, or could also be curved
        p.vertex(x2_3, y2_3); 
        p.endShape(p.CLOSE);
        break;
    }

    // --- Appendages ---
    if (visual.numAppendages > 0) {
        const appendageBaseSize = visual.baseDiameter / 3.5; // Reduced base size slightly
        const appendageOffsetMagnitude = visual.baseDiameter / 1.8 + p.sin(visual.appendageAnimationPhase * 1.2) * visual.baseDiameter * 0.1;

        for (let i = 0; i < visual.numAppendages; i++) {
            const baseAngle = (p.TWO_PI / visual.numAppendages) * i;
            const angleWiggle = p.sin(visual.appendageAnimationPhase + i * 0.8) * 0.45 * (1 + visual.movementIntensity); // Slightly more wiggle
            const currentAngle = baseAngle + angleWiggle;
            
            const appendageX = p.cos(currentAngle) * appendageOffsetMagnitude;
            const appendageY = p.sin(currentAngle) * appendageOffsetMagnitude;
            
            const appendagePulse = p.cos(visual.appendageAnimationPhase * 1.5 + i * 1.2) * 0.20 + 0.9; // 0.7 to 1.1
            let currentAppendageSize = appendageBaseSize * appendagePulse;

            p.push();
            p.translate(appendageX, appendageY);
            p.rotate(currentAngle + p.PI / 2); // Orient appendage outwards

            p.fill(geneColorR * 0.8, geneColorG * 0.8, geneColorB * 0.8);

            const appendageIntensity = visual.shapeIntensity; // Use main body's shape intensity for appendage variation

            switch (visual.shapeType) {
                case 1: // Elliptical Appendages
                    const appendageAspect = p.lerp(1, 0.5, appendageIntensity); // More eccentric with intensity
                    p.ellipse(0, 0, currentAppendageSize, currentAppendageSize * appendageAspect);
                    break;
                case 2: // Rectangular Appendages
                    const appendageCornerRadius = appendageIntensity * (currentAppendageSize * 0.3);
                    p.rectMode(p.CENTER);
                    p.rect(0, 0, currentAppendageSize, currentAppendageSize * 0.7, appendageCornerRadius);
                    break;
                case 3: // Triangular Appendages
                    const ad = currentAppendageSize / 2;
                    const ayOffset = appendageIntensity * ad * 0.3 * p.cos(visual.appendageAnimationPhase * 0.8 + i);
                    const axSkew = p.sin(visual.appendageAnimationPhase * 0.9 + i) * ad * 0.2 * appendageIntensity;
                    p.triangle(-ad + axSkew, ad, ad - axSkew, ad, 0, -ad - ayOffset);
                    break;
                default:
                    p.ellipse(0, 0, currentAppendageSize, currentAppendageSize * 0.7); // Fallback
            }
            p.pop(); 
        }
    }
    
    // ID Text
    p.fill(255, 200); // Semi-transparent white
    p.textSize(Math.max(10, visual.baseDiameter / 5.5));
    p.text(visual.id.toString(), 0, 0);

    p.pop();
  };

  p.draw = () => {
    p.background(30, 40, 55); // Dark space blue

    // Draw Stars (subtle twinkle)
    p.noStroke();
    stars.forEach(star => {
      const currentOpacity = star.opacity + p.sin(p.frameCount * 0.05 + star.x * 0.1) * 30;
      p.fill(200, 200, 255, p.constrain(currentOpacity, 30, 180));
      p.ellipse(star.x, star.y, star.size, star.size);
    });

    if (!creaturesData) return;

    creaturesData.forEach((creature) => {
      if (!creature.estaViva) return; // Should not happen with current script, but good practice

      let visual = creatureVisuals.get(creature.id);
      if (!visual) {
        // This can happen if creatures are added dynamically and map isn't updated before draw
        // For safety, re-initialize all; ideally, updateWithProps handles this robustly
        console.warn("Visual not found for creature", creature.id, ". Re-initializing all.");
        initializeAllCreatureVisuals();
        visual = creatureVisuals.get(creature.id);
        if (!visual) return; // Still not found, skip
      }
      
      updateCreatureMovement(visual);
      drawCreatureBodyAndAppendages(visual, creature.genesVisibles);
    });
  };
};

export default function CreatureCanvas(props: CreatureCanvasProps) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <Box sx={{ width: props.canvasWidth || 600, height: props.canvasHeight || 400, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'neutral.800' }}><Text>Loading Canvas...</Text></Box>;
  }

  return <ReactP5Wrapper sketch={sketch} {...props} />;
}

// A dummy Box and Text for the non-client case to avoid undefined Chakra components if they are not globally available here.
const Box = ({ children, sx }: any) => <div style={sx}>{children}</div>;
const Text = ({ children }: any) => <p>{children}</p>; 