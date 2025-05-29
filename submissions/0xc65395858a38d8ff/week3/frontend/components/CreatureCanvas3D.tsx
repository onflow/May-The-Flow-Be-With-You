'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { 
  OrbitControls, 
  Environment, 
  Stars, 
  Float, 
  MeshDistortMaterial,
  Sphere,
  Box,
  Octahedron,
  Trail,
  useTexture,
  Text3D,
  Center,
  Sparkles,
  PointMaterial,
  Points
} from '@react-three/drei';
import { motion } from 'framer-motion';
import { Box as ChakraBox, Spinner, useColorModeValue } from '@chakra-ui/react';

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

// Shaders personalizados para efectos evolutivos
const CreatureShader = {
  vertex: `
    uniform float time;
    uniform float evolutionPhase;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normal;
      
      // Distorsión evolutiva basada en tiempo y fase
      vec3 newPosition = position;
      float distortion = sin(position.x * 4.0 + time) * 
                        cos(position.y * 4.0 + time) * 
                        evolutionPhase * 0.1;
      newPosition += normal * distortion;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  fragment: `
    uniform float time;
    uniform vec3 baseColor;
    uniform float evolutionPhase;
    uniform float age;
    uniform float lifespan;
    uniform vec3 energyColor;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
      // Gradiente de vida basado en edad
      float lifeProgress = age / lifespan;
      vec3 ageColor = mix(vec3(0.2, 1.0, 0.3), vec3(1.0, 0.5, 0.1), lifeProgress);
      
      // Pulso energético
      float pulse = sin(time * 3.0 + vPosition.x + vPosition.y) * 0.5 + 0.5;
      vec3 energyPulse = energyColor * pulse * evolutionPhase;
      
      // Fresnel effect para dar volumen
      float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
      
      vec3 finalColor = baseColor + ageColor * 0.3 + energyPulse + fresnel * 0.2;
      
      // Transparencia basada en vitalidad
      float alpha = 0.8 + pulse * 0.2;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

// Componente para partículas de energía alrededor de las criaturas
function EnergyField({ creature, position }: { creature: CreatureUIDataFrontend; position: [number, number, number] }) {
  const points = useRef<THREE.Points>(null);
  const ep = parseFloatSafe(creature.puntosEvolucion, 0);
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(ep * 3 * 3); // Más partículas con más EP
    
    for (let i = 0; i < ep * 3; i++) {
      const radius = 1 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = position[0] + radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = position[1] + radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = position[2] + radius * Math.cos(phi);
    }
    
    return positions;
  }, [ep, position]);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y += 0.01;
      points.current.rotation.x += 0.005;
    }
  });

  return (
    <Points ref={points} positions={particlesPosition}>
      <PointMaterial 
        transparent 
        color="#00ffff" 
        size={0.05} 
        sizeAttenuation={true} 
        depthWrite={false}
      />
    </Points>
  );
}

// Componente principal de criatura 3D
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
  
  // Genes ocultos para efectos especiales
  const potencialEvolutivo = parseFloatSafe(creature.genesOcultos?.potencialEvolutivo, 1.0);
  const tasaMetabolica = parseFloatSafe(creature.genesOcultos?.tasaMetabolica, 1.0);
  
  // Cálculos de estado
  const edadDias = parseFloatSafe(creature.edadDiasCompletos, 0);
  const lifespanTotal = parseFloatSafe(creature.lifespanTotalSimulatedDays, 100);
  const evolutionPoints = parseFloatSafe(creature.puntosEvolucion, 0);
  
  // Determinar forma base
  const shapeType = Math.floor(formaPrincipal) % 3;
  const scale = tamanoBase * 0.5;
  
  // Shader uniforms
  const shaderUniforms = useMemo(() => ({
    time: { value: 0 },
    baseColor: { value: new THREE.Color(colorR, colorG, colorB) },
    evolutionPhase: { value: potencialEvolutivo },
    age: { value: edadDias },
    lifespan: { value: lifespanTotal },
    energyColor: { value: new THREE.Color(0, 1, 1) }
  }), [colorR, colorG, colorB, potencialEvolutivo, edadDias, lifespanTotal]);

  // Animación
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (meshRef.current) {
      // Actualizar shader
      shaderUniforms.time.value = time;
      
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
    }
    
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002 * potencialEvolutivo;
    }
  });

  // Render shape based on genes
  const renderMainBody = () => {
    const material = (
      <shaderMaterial
        uniforms={shaderUniforms}
        vertexShader={CreatureShader.vertex}
        fragmentShader={CreatureShader.fragment}
        transparent
      />
    );

    switch (shapeType) {
      case 0: // Esfera orgánica
        return (
          <Sphere ref={meshRef} args={[scale, 32, 32]} scale={[1, 1, 1]}>
            <MeshDistortMaterial
              color={new THREE.Color(colorR, colorG, colorB)}
              distort={potencialEvolutivo * 0.3}
              speed={tasaMetabolica * 2}
              roughness={0.1}
              metalness={0.8}
            />
          </Sphere>
        );
      case 1: // Cubo cristalino
        return (
          <Box ref={meshRef} args={[scale * 2, scale * 2, scale * 2]}>
            {material}
          </Box>
        );
      case 2: // Octaedro complejo
        return (
          <Octahedron ref={meshRef} args={[scale]}>
            {material}
          </Octahedron>
        );
      default:
        return (
          <Sphere ref={meshRef} args={[scale, 16, 16]}>
            {material}
          </Sphere>
        );
    }
  };

  // Render appendages
  const renderAppendages = () => {
    const appendages = [];
    for (let i = 0; i < numApendices; i++) {
      const angle = (Math.PI * 2 * i) / numApendices;
      const radius = scale * 1.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      appendages.push(
        <Float key={i} speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Sphere 
            position={[x, 0, z]} 
            args={[scale * 0.3, 8, 8]}
          >
            <meshStandardMaterial 
              color={new THREE.Color(colorR * 0.7, colorG * 0.7, colorB * 0.7)}
              emissive={new THREE.Color(colorR, colorG, colorB)}
              emissiveIntensity={0.2}
            />
          </Sphere>
        </Float>
      );
    }
    return appendages;
  };

  return (
    <group ref={groupRef} position={position}>
      {/* Trail effect for movement */}
      <Trail
        width={0.5}
        color={new THREE.Color(colorR, colorG, colorB)}
        length={20}
        decay={1}
        local={false}
        stride={0.1}
        interval={1}
        target={meshRef as any}
        attenuation={(width: number) => width}
      >
        {renderMainBody()}
      </Trail>
      
      {/* Appendages */}
      {renderAppendages()}
      
      {/* Energy field particles */}
      <EnergyField creature={creature} position={position} />
      
      {/* ID Label */}
      <Text3D
        font="/fonts/helvetiker_regular.typeface.json"
        size={0.2}
        height={0.02}
        position={[0, scale * 1.5, 0]}
      >
        {`#${creature.id}`}
        <meshStandardMaterial color="white" />
      </Text3D>
      
      {/* Evolution glow effect */}
      {evolutionPoints > 50 && (
        <Sparkles
          count={20}
          scale={[scale * 3, scale * 3, scale * 3]}
          size={3}
          speed={0.5}
          color={new THREE.Color(1, 1, 0)}
        />
      )}
    </group>
  );
}

// Environment and scene setup
function Scene({ creatures }: { creatures: CreatureUIDataFrontend[] }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff6b6b" />
      
      {/* Environment */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Environment preset="night" />
      
      {/* Creatures */}
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
      
      {/* Ground plane with grid */}
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
        shadows
        style={{ background: 'linear-gradient(to bottom, #0f0f23, #1a1a2e)' }}
      >
        <Suspense fallback={null}>
          <Scene creatures={creatures.filter(c => c.estaViva)} />
          {enableInteraction && (
            <OrbitControls 
              enablePan={true} 
              enableZoom={true} 
              enableRotate={true}
              maxDistance={20}
              minDistance={3}
            />
          )}
        </Suspense>
      </Canvas>
    </motion.div>
  );
} 