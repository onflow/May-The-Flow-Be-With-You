// Three.js Fiber type declarations
import { Object3DNode, MaterialNode, LightNode } from '@react-three/fiber';
import * as THREE from 'three';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: Object3DNode<THREE.Group, typeof THREE.Group>;
      mesh: Object3DNode<THREE.Mesh, typeof THREE.Mesh>;
      boxGeometry: Object3DNode<THREE.BoxGeometry, typeof THREE.BoxGeometry>;
      sphereGeometry: Object3DNode<THREE.SphereGeometry, typeof THREE.SphereGeometry>;
      meshStandardMaterial: MaterialNode<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>;
      ambientLight: LightNode<THREE.AmbientLight, typeof THREE.AmbientLight>;
      directionalLight: LightNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>;
      pointLight: LightNode<THREE.PointLight, typeof THREE.PointLight>;
    }
  }
}
