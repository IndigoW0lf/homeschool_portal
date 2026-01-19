'use client';

import { useRef, useEffect, Suspense, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

interface SyntyAvatarProps {
  modelPath?: string;
  textureUrl?: string; // Legacy/Full Outfit
  topUrl?: string;
  bottomUrl?: string;
  shoesUrl?: string;
  skinColor?: string;
  autoRotate?: boolean;
  className?: string;
}

/**
 * Hook to composite multiple texture layers into a single 512x512 texture.
 * Layers: Skin Color -> Top -> Bottom -> Shoes
 */
function useTextureCompositor({ 
  skinColor, 
  topUrl, 
  bottomUrl, 
  shoesUrl 
}: { 
  skinColor: string; 
  topUrl?: string; 
  bottomUrl?: string; 
  shoesUrl?: string 
}) {
  const [compositeTexture, setCompositeTexture] = useState<THREE.CanvasTexture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 512;
      canvasRef.current.height = 512;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loadAndDraw = async () => {
      // 1. Clear canvas
      ctx.clearRect(0, 0, 512, 512);

      // 2. Base Skin Layer (White texture base tinted with skinColor)
      const baseImg = new Image();
      baseImg.crossOrigin = 'anonymous';
      baseImg.src = '/assets/avatars/uv-templates/synty_skin_base.png';
      
      await new Promise((resolve) => {
        baseImg.onload = () => {
          ctx.fillStyle = skinColor;
          ctx.fillRect(0, 0, 512, 512);
          // Multiply/Overlay the skin texture detail
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(baseImg, 0, 0, 512, 512);
          ctx.globalCompositeOperation = 'source-over';
          resolve(null);
        };
        baseImg.onerror = () => {
          // Fallback to solid color if image fails
          ctx.fillStyle = skinColor;
          ctx.fillRect(0, 0, 512, 512);
          resolve(null);
        };
      });

      // 3. Helper to draw layer
      const drawLayer = (url?: string) => {
        if (!url) return Promise.resolve();
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = url;
          img.onload = () => {
            ctx.drawImage(img, 0, 0, 512, 512);
            resolve(null);
          };
          img.onerror = () => resolve(null);
        });
      };

      // 4. Draw layers in order
      await drawLayer(topUrl);
      await drawLayer(bottomUrl);
      await drawLayer(shoesUrl);

      // 5. Update or create texture
      setCompositeTexture((prev: THREE.CanvasTexture | null) => {
        if (prev) {
          prev.needsUpdate = true;
          return prev;
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.flipY = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      });
    };

    loadAndDraw();
  }, [skinColor, topUrl, bottomUrl, shoesUrl]);

  return compositeTexture;
}

function Model({ 
  modelPath = '/assets/avatars/models/SimplePeople.glb',
  textureUrl,
  topUrl,
  bottomUrl,
  shoesUrl,
  skinColor = '#f2d3b1',
  autoRotate = true
}: { 
  modelPath: string; 
  textureUrl?: string; 
  topUrl?: string; 
  bottomUrl?: string; 
  shoesUrl?: string;
  skinColor?: string;
  autoRotate?: boolean 
}) {
  const { scene } = useGLTF(modelPath);
  const modelRef = useRef<THREE.Group>(null);
  const clonedSceneRef = useRef<THREE.Group | null>(null);
  
  // Create composite texture if modular URLs are used
  const compositeTexture = useTextureCompositor({ skinColor, topUrl, bottomUrl, shoesUrl });

  useEffect(() => {
    // Clone the scene to avoid modifying the cached version
    if (!clonedSceneRef.current) {
      clonedSceneRef.current = scene.clone(true);
      
      // Hide accessory nodes that cause "humps" (backpacks, caps, etc.)
      clonedSceneRef.current.traverse((node) => {
        const accessoriesToHide = [
          'Backpack', 'Cape', 'Bag', 'Tool', 'Weapon', 'Shield',
          'Item', 'Carry', 'Hat', 'Helmet', 'Glasses', 'Mask'
        ];
        
        if (accessoriesToHide.some(name => node.name.includes(name))) {
          node.visible = false;
        }
      });
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
        
        // Final texture determination
        
        // Priority 1: Full textureUrl if provided
        if (textureUrl) {
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load(textureUrl, (texture) => {
            texture.flipY = false;
            texture.colorSpace = THREE.SRGBColorSpace;
            applyToMesh(child, texture);
          });
        } 
        // Priority 2: Modular textures from compositor
        else if (compositeTexture) {
          applyToMesh(child, compositeTexture);
        }
        // Fallback: Skin color
        else {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.color = new THREE.Color(skinColor);
            }
          });
        }
      }
    });

    function applyToMesh(mesh: THREE.Mesh, tex: THREE.Texture) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat) => {
        if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
          mat.map = tex;
          mat.needsUpdate = true;
        }
      });
    }
    
    if (modelRef.current) {
      modelRef.current.clear();
      modelRef.current.add(clonedScene);
    }
  }, [scene, textureUrl, compositeTexture, skinColor]);

  // Slow auto-rotation (only if enabled)
  useFrame((_state, delta) => {
    if (modelRef.current && autoRotate) {
      modelRef.current.rotation.y += delta * 0.3;
    }
  });

  return <group ref={modelRef} />;
}



export function SyntyAvatar({
  modelPath = '/assets/avatars/models/SimplePeople.glb',
  textureUrl,
  topUrl,
  bottomUrl,
  shoesUrl,
  skinColor = '#f2d3b1',
  autoRotate = true,
  className = '',
}: SyntyAvatarProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 1.8, 6], fov: 35 }}
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
              topUrl={topUrl}
              bottomUrl={bottomUrl}
              shoesUrl={shoesUrl}
              skinColor={skinColor}
              autoRotate={autoRotate}
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
          target={[0, 1.3, 0]}
        />
      </Canvas>
    </div>
  );
}


// Pre-load the model
useGLTF.preload('/assets/avatars/models/SimplePeople.glb');
