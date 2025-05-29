'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Box as ChakraBox, Spinner } from '@chakra-ui/react';

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

interface CreatureCanvas3DProps {
  creatures: CreatureUIDataFrontend[];
  canvasWidth?: number;
  canvasHeight?: number;
  enableInteraction?: boolean;
  viewMode?: '2D' | '3D' | 'hybrid';
}

interface Creature3DProps {
  creature: CreatureUIDataFrontend;
  position: [number, number, number];
  index: number;
}

// Utility functions
const parseFloatSafe = (value: string | number | undefined, defaultValue = 0.0): number => {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return defaultValue;
  }
  const num = parseFloat(typeof value === 'number' ? value.toString() : value);
  return isNaN(num) ? defaultValue : num;
};

// Componente básico de cámara con controles simples
function CameraControls() {
  const ref = useRef<THREE.PerspectiveCamera>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 10;
      ref.current.position.z = Math.cos(state.clock.elapsedTime * 0.1) * 10;
      ref.current.lookAt(0, 0, 0);
    }
  });
  
  return <perspectiveCamera ref={ref} position={[0, 5, 10]} fov={75} />;
}

// Componente de criatura 3D simplificado
function Creature3D({ creature, position, index }: Creature3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // Extraer genes de la criatura
  const colorR = parseFloatSafe(creature.genesVisibles.colorR, 0.5);
  const colorG = parseFloatSafe(creature.genesVisibles.colorG, 0.5);
  const colorB = parseFloatSafe(creature.genesVisibles.colorB, 0.5);
  const tamanoBase = parseFloatSafe(creature.genesVisibles.tamanoBase, 1.5);
  const formaPrincipal = parseFloatSafe(creature.genesVisibles.formaPrincipal, 1.0);
  const numApendices = parseFloatSafe(creature.genesVisibles.numApendices, 0);
  const patronMovimiento = parseFloatSafe(creature.genesVisibles.patronMovimiento, 1.0);
  
  // Genes ocultos
  const potencialEvolutivo = parseFloatSafe(creature.genesOcultos?.potencialEvolutivo, 1.0);
  const tasaMetabolica = parseFloatSafe(creature.genesOcultos?.tasaMetabolica, 1.0);
  
  // Cálculos de estado
  const evolutionPoints = parseFloatSafe(creature.puntosEvolucion, 0);
  
  // Determinar forma base
  const shapeType = Math.floor(formaPrincipal) % 3;
  const scale = tamanoBase * 0.5;
  
  // Color base
  const baseColor = useMemo(() => new THREE.Color(colorR, colorG, colorB), [colorR, colorG, colorB]);
  
  // Animación
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (meshRef.current) {
      // Movimiento basado en patronMovimiento
      const movementType = Math.floor(patronMovimiento) % 4;
      const intensity = patronMovimiento - Math.floor(patronMovimiento);
      
      switch (movementType) {
        case 0: // Flotante estático
          meshRef.current.position.y = position[1] + Math.sin(time + index) * 0.2 * intensity;
          break;
        case 1: // Circular
          const radius = 2 + intensity;
          meshRef.current.position.x = position[0] + Math.cos(time * 0.5 + index) * radius;
          meshRef.current.position.z = position[2] + Math.sin(time * 0.5 + index) * radius;
          break;
        case 2: // Errático
          meshRef.current.position.x = position[0] + Math.sin(time * 2 + index) * intensity * 1.5;
          meshRef.current.position.z = position[2] + Math.cos(time * 1.5 + index) * intensity * 1.5;
          break;
        case 3: // Vibrante
          meshRef.current.rotation.x = Math.sin(time * 3 + index) * intensity * 0.5;
          meshRef.current.rotation.z = Math.cos(time * 2.5 + index) * intensity * 0.5;
          break;
      }
      
      // Rotación base
      meshRef.current.rotation.y += 0.01 * tasaMetabolica;
      
      // Pulso de escala basado en evolución
      const pulseScale = 1 + Math.sin(time * 3 + index) * 0.1 * (evolutionPoints / 100);
      meshRef.current.scale.setScalar(pulseScale);
    }
    
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002 * potencialEvolutivo;
    }
  });

  // Render shape based on genes
  const renderMainBody = () => {
    const emissiveIntensity = Math.min(0.5, evolutionPoints / 200);
    
    switch (shapeType) {
      case 0: // Esfera
        return (
          <mesh ref={meshRef}>
            <sphereGeometry args={[scale, 32, 32]} />
            <meshStandardMaterial 
              color={baseColor}
              emissive={baseColor}
              emissiveIntensity={emissiveIntensity}
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>
        );
      case 1: // Cubo
        return (
          <mesh ref={meshRef}>
            <boxGeometry args={[scale * 2, scale * 2, scale * 2]} />
            <meshStandardMaterial 
              color={baseColor}
              emissive={baseColor}
              emissiveIntensity={emissiveIntensity}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
        );
      case 2: // Octaedro
        return (
          <mesh ref={meshRef}>
            <octahedronGeometry args={[scale]} />
            <meshStandardMaterial 
              color={baseColor}
              emissive={baseColor}
              emissiveIntensity={emissiveIntensity}
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
        );
      default:
        return (
          <mesh ref={meshRef}>
            <sphereGeometry args={[scale, 16, 16]} />
            <meshStandardMaterial 
              color={baseColor}
              emissive={baseColor}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        );
    }
  };

  // Render appendages simples
  const renderAppendages = () => {
    const appendages = [];
    for (let i = 0; i < Math.min(numApendices, 8); i++) {
      const angle = (Math.PI * 2 * i) / numApendices;
      const radius = scale * 1.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      appendages.push(
        <mesh key={i} position={[x, 0, z]}>
          <sphereGeometry args={[scale * 0.3, 8, 8]} />
          <meshStandardMaterial 
            color={baseColor.clone().multiplyScalar(0.7)}
            emissive={baseColor}
            emissiveIntensity={0.2}
          />
        </mesh>
      );
    }
    return appendages;
  };

  // Partículas simples de energía
  const renderEnergyParticles = () => {
    const particles = [];
    const particleCount = Math.min(Math.floor(evolutionPoints / 10), 10);
    
    for (let i = 0; i < particleCount; i++) {
      const radius = 1 + Math.random() * 2;
      const theta = (i / particleCount) * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      particles.push(
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.6} />
        </mesh>
      );
    }
    return particles;
  };

  return (
    <group ref={groupRef} position={position}>
      {renderMainBody()}
      {renderAppendages()}
      {renderEnergyParticles()}
      
      {/* ID simple */}
      <mesh position={[0, scale * 2, 0]}>
        <boxGeometry args={[0.5, 0.2, 0.1]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
}

// Scene setup
function Scene({ creatures }: { creatures: CreatureUIDataFrontend[] }) {
  return (
    <>
      {/* Luces básicas */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff6b6b" />
      <spotLight position={[0, 15, 0]} angle={0.3} penumbra={1} intensity={0.5} />
      
      {/* Estrellas simples */}
      <group>
        {Array.from({ length: 1000 }, (_, i) => (
          <mesh
            key={i}
            position={[
              (Math.random() - 0.5) * 100,
              (Math.random() - 0.5) * 100,
              (Math.random() - 0.5) * 100
            ]}
          >
            <sphereGeometry args={[0.05, 4, 4]} />
            <meshBasicMaterial color="white" />
          </mesh>
        ))}
      </group>
      
      {/* Criaturas */}
      {creatures.map((creature, index) => {
        const x = (index % 3 - 1) * 4;
        const y = 0;
        const z = Math.floor(index / 3) * 4 - 2;
        
        return (
          <Creature3D
            key={creature.id}
            creature={creature}
            position={[x, y, z]}
            index={index}
          />
        );
      })}
      
      {/* Plano de suelo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial 
          color="#1a1a2e" 
          transparent 
          opacity={0.3}
          wireframe
        />
      </mesh>
    </>
  );
}

// Loading component
function LoadingScreen() {
  return (
    <ChakraBox 
      display="flex" 
      alignItems="center" 
      justifyContent="center" 
      height="100%" 
      bg="gray.900"
    >
      <Spinner size="xl" color="cyan.400" />
    </ChakraBox>
  );
}

// Main component
export default function CreatureCanvas3D({ 
  creatures, 
  canvasWidth = 800, 
  canvasHeight = 600,
  enableInteraction = true,
  viewMode = '3D'
}: CreatureCanvas3DProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <LoadingScreen />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{ width: canvasWidth, height: canvasHeight }}
    >
      <Canvas
        camera={{ position: [0, 5, 10], fov: 75 }}
        style={{ background: 'linear-gradient(to bottom, #0f0f23, #1a1a2e)' }}
      >
        <Suspense fallback={null}>
          <Scene creatures={creatures.filter(c => c.estaViva)} />
          {enableInteraction && <CameraControls />}
        </Suspense>
      </Canvas>
    </motion.div>
  );
} 