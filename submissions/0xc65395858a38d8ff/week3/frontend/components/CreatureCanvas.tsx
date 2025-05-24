'use client';

import type { Sketch, P5CanvasInstance } from 'react-p5-wrapper';
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

export interface CreatureCanvasProps {
  creatures: CreatureUIDataFrontend[];
  canvasWidth?: number;
  canvasHeight?: number;
  [key: string]: any;
}

// Función para parsear UFix64 (string) a número de forma segura
const parseFloatSafe = (value: string | undefined, defaultValue = 0.0): number => {
  if (value === undefined || value === null) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

const sketch: Sketch<CreatureCanvasProps> = (p: P5CanvasInstance<CreatureCanvasProps>) => {
  let creaturesData: CreatureUIDataFrontend[] = [];
  let effectiveCanvasWidth = 600;
  let effectiveCanvasHeight = 400;

  p.updateWithProps = (props: CreatureCanvasProps) => {
    if (props.creatures) {
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
    if (dimensionsChanged && p.canvas) {
      p.resizeCanvas(effectiveCanvasWidth, effectiveCanvasHeight);
    }
  };

  p.setup = () => {
    p.createCanvas(effectiveCanvasWidth, effectiveCanvasHeight);
    p.colorMode(p.RGB, 255);
    p.textAlign(p.CENTER, p.CENTER);
  };

  p.draw = () => {
    p.background(20, 25, 30); // Fondo oscuro tipo nebulosa/espacio

    if (!creaturesData) return;

    const aliveCreatures = creaturesData.filter(c => c.estaViva);

    aliveCreatures.forEach((creature, index) => {
      const geneColorR = parseFloatSafe(creature.genesVisibles.colorR, 0.5) * 255;
      const geneColorG = parseFloatSafe(creature.genesVisibles.colorG, 0.5) * 255;
      const geneColorB = parseFloatSafe(creature.genesVisibles.colorB, 0.5) * 255;
      
      // Escalar tamanoBase (rango 0.5-3.0) a un diámetro visible (ej. 20px a 100px)
      // (tamanoBase - min) / (max - min) -> normalizado 0-1
      // luego (normalizado * (targetMax - targetMin)) + targetMin
      const minTamanoBase = 0.5;
      const maxTamanoBase = 3.0;
      const minDiametroPx = 20;
      const maxDiametroPx = 80;
      let tamanoBase = parseFloatSafe(creature.genesVisibles.tamanoBase, 1.5);
      tamanoBase = Math.max(minTamanoBase, Math.min(maxTamanoBase, tamanoBase)); // Clamp

      const normalizedTamano = (tamanoBase - minTamanoBase) / (maxTamanoBase - minTamanoBase);
      const diametro = (normalizedTamano * (maxDiametroPx - minDiametroPx)) + minDiametroPx;

      // Posición simple por ahora - distribuir en X
      const x = (effectiveCanvasWidth / (aliveCreatures.length + 1)) * (index + 1);
      const y = effectiveCanvasHeight / 2;

      p.push(); // Guardar estado de dibujo actual
      p.fill(geneColorR, geneColorG, geneColorB);
      p.noStroke();
      p.ellipse(x, y, diametro, diametro);
      
      // Mostrar ID o nombre de la criatura (opcional)
      p.fill(255);
      p.textSize(Math.max(10, diametro / 5));
      p.text(creature.id.toString(), x, y);
      p.pop(); // Restaurar estado de dibujo
    });
  };
};

export default function CreatureCanvas(props: CreatureCanvasProps) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return <ReactP5Wrapper sketch={sketch} {...props} />;
} 