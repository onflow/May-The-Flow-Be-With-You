import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Box } from '@react-three/drei';
import './ModelViewer.css';

function DarkAlley() {
  const { scene } = useGLTF('/cards/dark_alley.glb');
  return <primitive object={scene} position={[0, 0, 0]} scale={2} />;
}

function FortuneTeller() {
  const { scene } = useGLTF('/cards/fortune_teller.glb');
  return (
    <primitive
      object={scene}
      position={[-10, -1.5, 0]}
      scale={0.01}
      rotation={[-0.05, 1.5, 0]}
      castShadow
      receiveShadow
    />
  );
}

// Spotlight that targets the fortune teller
function FocusedSpotlight({ targetPosition }) {
  const lightRef = useRef();
  const target = useRef();

  useEffect(() => {
    if (lightRef.current && target.current) {
      lightRef.current.target = target.current;
    }
  }, []);

  return (
    <>
      <spotLight
        ref={lightRef}
        position={[-10, 5, 2]} // Above and in front of the fortune teller
        angle={0.4}
        penumbra={0.8}
        intensity={3}
        distance={10}
        castShadow
      />
      <object3D ref={target} position={targetPosition} />
    </>
  );
}

// Optional: Glow from the crystal ball inside the fortune teller booth
function CrystalBallGlow() {
  return (
    <pointLight
      position={[-10, -1, 0]}
      intensity={3}
      distance={4}
      color={'#ffffff'}
    />
  );
}

function CameraController() {
  const controls = useRef();
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(3, 4, 0);
    camera.lookAt(-6, 5, 0);
    controls.current.target.set(1, 8, 0);
    controls.current.update();
  }, [camera]);

  return (
    <OrbitControls
      ref={controls}
      enableZoom={true}
      minDistance={1}
      maxDistance={8}
      enablePan={false}
      maxPolarAngle={Math.PI / 2}
      minPolarAngle={Math.PI / 6}
    />
  );
}

function ModelViewer({ onComplete }) {
  return (
    <div className="model-viewer-container">
      <Canvas
        camera={{ position: [5, 10, 15], fov: 50 }}
        style={{ background: '#000' }}
        shadows
      >
        <Suspense
          fallback={
            <Box args={[1, 1, 1]} position={[0, 0, 0]}>
              <meshStandardMaterial color="#1a1a1a" />
            </Box>
          }
        >
          {/* Ambient fill light (very dim) */}
          <ambientLight intensity={0.1} />

          {/* General environmental light */}
          <Environment preset="night" />

          {/* Focused lighting */}
          <FocusedSpotlight targetPosition={[-10, -1.5, 0]} />
          <CrystalBallGlow />

          {/* Scene */}
          <DarkAlley />
          <FortuneTeller />
          <CameraController />
        </Suspense>
      </Canvas>

      <button onClick={onComplete} className="proceed-button">
        Continue
      </button>
    </div>
  );
}

export default ModelViewer;
