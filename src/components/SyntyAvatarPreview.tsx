'use client';

import dynamic from 'next/dynamic';

// Default Synty texture - neutral character with visible clothing
const DEFAULT_SYNTY_TEXTURE = '/assets/avatars/Simple_People_Source/Textures/SimplePeople_BusinessMan_White.png';

// Dynamically import SyntyAvatar to avoid SSR issues with Three.js
const SyntyAvatar = dynamic(
  () => import('./SyntyAvatar').then((mod) => mod.SyntyAvatar),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-4xl animate-pulse">🧑</div>
      </div>
    )
  }
);

interface SyntyAvatarPreviewProps {
  kidId: string;
  textureUrl?: string;
  skinColor?: string;
}

export function SyntyAvatarPreview({ 
  kidId, 
  textureUrl,
  skinColor = '#f2d3b1'
}: SyntyAvatarPreviewProps) {
  // Use default texture if none provided
  const finalTextureUrl = textureUrl || DEFAULT_SYNTY_TEXTURE;
  
  return (
    <SyntyAvatar
      modelPath="/assets/avatars/models/SimplePeople.glb"
      textureUrl={finalTextureUrl}
      skinColor={skinColor}
      autoRotate={true}
      className="w-full h-full"
    />
  );
}

