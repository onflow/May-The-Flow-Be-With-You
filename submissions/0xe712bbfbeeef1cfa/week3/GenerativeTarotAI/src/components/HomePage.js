import React, { useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import './HomePage.css';

function FortuneTellerMachine() {
  const { scene } = useGLTF('/cards/fortune_teller.glb');

  return (
    <group scale={0.001} rotation={[0, 0, 0]} position={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
}

function HomePage({ onStart }) {
  return (
    <div className="home-page">
      <div className="scene-container">
        <Canvas camera={{ position: [0, 1, 3], fov: 35 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.7} />
            <pointLight position={[5, 5, 5]} intensity={1} />
            <pointLight position={[-5, 5, -5]} intensity={0.5} />
            <FortuneTellerMachine />
            <OrbitControls 
              enableZoom={true}
              minDistance={2}
              maxDistance={5}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2}
              enablePan={false}
            />
          </Suspense>
        </Canvas>
      </div>
      <button className="start-button" onClick={onStart}>
        Begin Your Reading
      </button>
    </div>
  );
}

export default HomePage;
