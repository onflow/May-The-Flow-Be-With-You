import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import type { Mesh } from 'three';

interface AvatarProps {
  reputation: number;
  participationCount: number;
}

export function Avatar({ reputation, participationCount }: AvatarProps) {
  const meshRef = useRef<Mesh>(null);

  // Calculate color based on reputation
  const getColor = () => {
    const hue = (reputation * 0.1) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Calculate size based on participation count
  const getSize = () => {
    return 1 + (participationCount * 0.1);
  };

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.2;
    }
  });

  return (
    <Sphere ref={meshRef} args={[getSize(), 64, 64]}>
      <MeshDistortMaterial
        color={getColor()}
        attach="material"
        distort={0.3}
        speed={2}
        roughness={0.2}
        metalness={0.8}
      />
    </Sphere>
  );
} 