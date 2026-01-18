'use client';

import { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface BlockyAvatar3DProps {
  textureUrl?: string | null; // URL or base64 data URI of the skin texture
  className?: string;
  autoRotate?: boolean;
}

function Model({ textureUrl }: { textureUrl?: string | null }) {
  const { scene, materials, nodes } = useGLTF('/assets/avatars/models/character.glb');
  const groupRef = useRef<THREE.Group>(null);
  const textureRef = useRef<THREE.Texture | null>(null);

  // If a texture URL is provided, load it and apply to the model
  useEffect(() => {
    if (textureUrl && scene) {
      const loader = new THREE.TextureLoader();
      loader.load(textureUrl, (texture) => {
        texture.flipY = false; // UVs usually expect this for GLB
        texture.colorSpace = THREE.SRGBColorSpace;
        textureRef.current = texture;

        // Traverse scene and apply texture to all meshes
        scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            // Clone material to avoid affecting other instances
            const baseMaterial = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
            const material = baseMaterial.clone() as THREE.MeshStandardMaterial;
            
            material.map = texture;
            material.needsUpdate = true;
            mesh.material = material;
          }
        });
      });
    }
  }, [textureUrl, scene]);

  return <primitive object={scene} ref={groupRef} scale={2} position={[0, -2, 0]} />;
}

export function BlockyAvatar3D({ textureUrl, className, autoRotate = true }: BlockyAvatar3DProps) {
  return (
    <div className={className}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 1, 5]} />
        <OrbitControls 
          enableZoom={true} 
          enablePan={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 2}
          autoRotate={autoRotate}
          autoRotateSpeed={4}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />
        
        <Model textureUrl={textureUrl} />
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}

// Preload the model
useGLTF.preload('/assets/avatars/models/character.glb');
