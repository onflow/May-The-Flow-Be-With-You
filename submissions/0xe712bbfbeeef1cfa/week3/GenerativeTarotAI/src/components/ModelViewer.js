import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Box } from '@react-three/drei';
import './ModelViewer.css';

function DarkAlley() {
  const { scene } = useGLTF('/cards/dark_alley.glb');
  return <primitive object={scene} position={[0, 0, 0]} scale={2} />;
}

function FortuneTeller() {
  const { scene } = useGLTF('/cards/fortune_teller.glb');
  return <primitive object={scene} position={[0, -1, 2]} scale={0.008} />;
}

function ModelViewer({ onComplete }) {
  return (
    <div className="model-viewer-container">
      <Canvas
        camera={{ position: [0, 12, 15], fov: 50 }}
        style={{ background: '#000' }}
      >
        <Suspense fallback={
          <Box args={[1, 1, 1]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#1a1a1a" />
          </Box>
        }>
          <ambientLight intensity={0.2} />
          <spotLight 
            position={[10, 10, 10]} 
            angle={0.15} 
            penumbra={1} 
            intensity={0.5}
            castShadow
          />
          <pointLight position={[-10, 10, -10]} intensity={0.3} />
          <DarkAlley />
          <FortuneTeller />
          <Environment preset="night" />
          <OrbitControls 
            enableZoom={true}
            minDistance={8}
            maxDistance={20}
            enablePan={false}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 6}
          />
        </Suspense>
      </Canvas>
      <button onClick={onComplete} className="proceed-button">
        Continue
      </button>
    </div>
  );
}

export default ModelViewer; 