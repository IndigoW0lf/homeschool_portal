'use client';

import { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

interface SyntyAvatarProps {
  modelPath?: string;
  textureUrl?: string;
  skinColor?: string;
  autoRotate?: boolean;
  className?: string;
}

function Model({ 
  modelPath = '/assets/avatars/models/SimplePeople.glb',
  textureUrl,
  skinColor = '#f2d3b1'
}: { modelPath: string; textureUrl?: string; skinColor?: string }) {
  const { scene } = useGLTF(modelPath);
  const modelRef = useRef<THREE.Group>(null);
  const clonedSceneRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    // Clone the scene to avoid modifying the cached version
    if (!clonedSceneRef.current) {
      clonedSceneRef.current = scene.clone(true);
    }
    const clonedScene = clonedSceneRef.current;
    
    // Apply texture or color to materials
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Clone material to avoid shared material issues
        if (Array.isArray(child.material)) {
          child.material = child.material.map(m => m.clone());
        } else {
          child.material = child.material.clone();
        }
        
        if (textureUrl) {
          // Load custom texture
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load(textureUrl, (texture) => {
            texture.flipY = false;
            texture.colorSpace = THREE.SRGBColorSpace;
            
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
                mat.map = texture;
                mat.needsUpdate = true;
              }
            });
          });
        } else {
          // Apply skin color for preview when no texture
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
            }
          });
        }
      }
    });
    
    if (modelRef.current) {
      modelRef.current.clear();
      modelRef.current.add(clonedScene);
    }
  }, [scene, textureUrl, skinColor]);

  // Slow auto-rotation
  useFrame((state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 0.3;
    }
  });

  return <group ref={modelRef} />;
}


export function SyntyAvatar({
  modelPath = '/assets/avatars/models/SimplePeople.glb',
  textureUrl,
  skinColor = '#f2d3b1',
  autoRotate = true,
  className = '',
}: SyntyAvatarProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 1.2, 7], fov: 30 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          logarithmicDepthBuffer: true 
        }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} />
        
        <Suspense fallback={null}>
          <Center>
            <Model 
              modelPath={modelPath} 
              textureUrl={textureUrl}
              skinColor={skinColor}
            />
          </Center>
        </Suspense>
        
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={8}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
          autoRotate={autoRotate}
          autoRotateSpeed={1}
          target={[0, 1, 0]}
        />
      </Canvas>
    </div>
  );
}

// Pre-load the model
useGLTF.preload('/assets/avatars/models/SimplePeople.glb');
