import { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface BlockyAvatarProps {
  className?: string;
  skinColors?: {
    head?: string;
    torso?: string;
    torsoSide?: string;
    leftArm?: string;
    rightArm?: string;
    leftLeg?: string;
    rightLeg?: string;
    leftLegSide?: string;
    rightLegSide?: string;
    skin?: string;
  };
  size?: number;
  faceType?: 'happy' | 'cool' | 'surprised' | 'sleepy' | 'silly';
  hairType?: 'none' | 'short' | 'medium' | 'long' | 'curly' | 'spiky';
  hairColor?: string;
  outfitColor?: string;
  pantsColor?: string;
}

// Face components as inline SVG for reliability
const FACES = {
  happy: (
    <g transform="translate(12, 18)" opacity="0.9">
      <circle cx="0" cy="0" r="3" fill="#333"/>
      <circle cx="26" cy="0" r="3" fill="#333"/>
      <path d="M3 10 Q13 18 23 10" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </g>
  ),
  cool: (
    <g transform="translate(12, 18)" opacity="0.9">
      <path d="M-3 -2 L3 0 L-3 2 Z" fill="#333"/>
      <path d="M23 -2 L29 0 L23 2 Z" fill="#333"/>
      <path d="M5 12 Q13 14 21 10" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </g>
  ),
  surprised: (
    <g transform="translate(12, 18)" opacity="0.9">
      <circle cx="0" cy="0" r="4" fill="#333"/>
      <circle cx="26" cy="0" r="4" fill="#333"/>
      <circle cx="13" cy="12" r="4" fill="#333"/>
    </g>
  ),
  sleepy: (
    <g transform="translate(12, 18)" opacity="0.9">
      <path d="M-3 0 Q0 -3 3 0" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M23 0 Q26 -3 29 0" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M8 12 Q13 14 18 12" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </g>
  ),
  silly: (
    <g transform="translate(12, 18)" opacity="0.9">
      <circle cx="0" cy="0" r="3" fill="#333"/>
      <path d="M23 -2 L29 0 L23 2" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M5 10 Q13 14 21 10" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <ellipse cx="13" cy="14" rx="4" ry="3" fill="#e57373"/>
    </g>
  ),
};

// Hair components as inline SVG
const HAIR = {
  none: null,
  short: (color: string) => (
    <g transform="translate(73, -5)">
      <path d="M0 20 L0 8 L4 4 L52 4 L56 8 L56 20 L48 16 L8 16 Z" fill={color}/>
    </g>
  ),
  medium: (color: string) => (
    <g transform="translate(68, -8)">
      <path d="M0 10 L4 5 L60 5 L64 10 L64 35 L56 40 L48 30 L16 30 L8 40 L0 35 Z" fill={color}/>
    </g>
  ),
  long: (color: string) => (
    <g transform="translate(65, -10)">
      <path d="M0 10 L5 5 L65 5 L70 10 L70 55 L60 60 L50 45 L20 45 L10 60 L0 55 Z" fill={color}/>
    </g>
  ),
  curly: (color: string) => (
    <g transform="translate(68, -8)">
      <path d="M4 25 Q0 20 4 15 Q0 10 4 8 Q10 4 20 8 Q30 0 35 8 Q45 0 50 8 Q58 4 64 12 Q68 16 64 20 Q68 25 56 30 L8 30 Q0 28 4 25" fill={color}/>
    </g>
  ),
  spiky: (color: string) => (
    <g transform="translate(70, -15)">
      <path d="M0 30 L4 22 L8 12 L12 22 L20 0 L24 22 L32 6 L36 22 L44 0 L48 22 L52 12 L56 30 Z" fill={color}/>
    </g>
  ),
};

/**
 * Renders a blocky character in "Isometric" 3D style (Roblox/Minecraft look)
 * with customizable face, hair, and outfit colors
 */
export function BlockyAvatar({ 
  className, 
  skinColors = {}, 
  size = 200,
  faceType = 'happy',
  hairType = 'none',
  hairColor = '#4a3728',
  outfitColor,
  pantsColor,
}: BlockyAvatarProps) {
  // Default skin tone if not specified
  const defaultSkin = skinColors.skin || '#ffdbac';
  const torsoColor = outfitColor || skinColors.torso || '#5e7fb8';
  const legColor = pantsColor || skinColors.leftLeg || skinColors.rightLeg || '#4a5568';
  
  const style = {
    '--skin-head': skinColors.head || defaultSkin,
    '--skin-torso': torsoColor,
    '--skin-torso-side': skinColors.torsoSide || torsoColor,
    '--skin-arm': skinColors.leftArm || skinColors.rightArm || defaultSkin,
    '--skin-leg': legColor,
    '--skin-leg-side': skinColors.leftLegSide || skinColors.rightLegSide || legColor,
    width: size,
    height: size,
  } as CSSProperties;

  const faceElement = FACES[faceType] || FACES.happy;
  const hairElement = hairType !== 'none' && HAIR[hairType] ? HAIR[hairType](hairColor) : null;

  return (
    <div className={cn("relative inline-block", className)} style={style}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <filter id="shade-side">
            <feComponentTransfer>
              <feFuncR type="linear" slope="0.7"/>
              <feFuncG type="linear" slope="0.7"/>
              <feFuncB type="linear" slope="0.7"/>
            </feComponentTransfer>
          </filter>
          <filter id="shade-top">
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.1"/>
              <feFuncG type="linear" slope="1.1"/>
              <feFuncB type="linear" slope="1.1"/>
            </feComponentTransfer>
          </filter>
        </defs>

        {/* RIGHT LEG (Stage Left) - Back */}
        <g transform="translate(105, 110)">
          <path d="M0 0 L25 0 L25 55 L0 55 Z" fill="var(--skin-leg)" />
          <path d="M25 0 L35 -10 L35 45 L25 55 Z" fill="var(--skin-leg-side)" filter="url(#shade-side)" />
        </g>

        {/* LEFT LEG (Stage Right) - Front */}
        <g transform="translate(70, 110)">
          <path d="M0 0 L25 0 L25 55 L0 55 Z" fill="var(--skin-leg)" />
          <path d="M25 0 L35 -10 L35 45 L25 55 Z" fill="var(--skin-leg-side)" filter="url(#shade-side)" />
          <path d="M0 0 L10 -10 L35 -10 L25 0 Z" fill="var(--skin-leg)" filter="url(#shade-top)" />
        </g>
        
        {/* RIGHT ARM (Stage Left) - Back */}
        <g transform="translate(133, 55)">
          <path d="M0 0 L18 0 L18 45 L0 45 Z" fill="var(--skin-arm)" />
          <path d="M18 0 L26 -8 L26 37 L18 45 Z" fill="var(--skin-arm)" filter="url(#shade-side)" />
          <path d="M0 0 L8 -8 L26 -8 L18 0 Z" fill="var(--skin-arm)" filter="url(#shade-top)" />
        </g>

        {/* TORSO - Center */}
        <g transform="translate(65, 55)">
          <path d="M0 0 L70 0 L70 60 L0 60 Z" fill="var(--skin-torso)" />
          {/* Neckline */}
          <path d="M25 0 Q35 15 45 0 Z" fill={defaultSkin} />
          {/* Torso Side (Right) */}
          <path d="M70 0 L90 -15 L90 45 L70 60 Z" fill="var(--skin-torso-side)" filter="url(#shade-side)" />
          {/* Torso Top */}
          <path d="M0 0 L20 -15 L90 -15 L70 0 Z" fill="var(--skin-torso)" filter="url(#shade-top)" />
        </g>

        {/* LEFT ARM (Stage Right) - Front */}
        <g transform="translate(42, 55)">
           <path d="M0 0 L18 0 L18 45 L0 45 Z" fill="var(--skin-arm)" />
           <path d="M18 0 L26 -8 L26 37 L18 45 Z" fill="var(--skin-arm)" filter="url(#shade-side)" />
           <path d="M0 0 L8 -8 L26 -8 L18 0 Z" fill="var(--skin-arm)" filter="url(#shade-top)" />
        </g>

        {/* HAIR - Behind head for some styles */}
        {hairType === 'long' && hairElement}

        {/* HEAD */}
        <g transform="translate(75, 10)">
          <path d="M0 0 L50 0 L50 50 L0 50 Z" fill="var(--skin-head)" />
          <path d="M50 0 L70 -15 L70 35 L50 50 Z" fill="var(--skin-head)" filter="url(#shade-side)" />
          <path d="M0 0 L20 -15 L70 -15 L50 0 Z" fill="var(--skin-head)" filter="url(#shade-top)" />
          
          {/* Face */}
          {faceElement}
        </g>

        {/* HAIR - On top of head for most styles */}
        {hairType !== 'long' && hairElement}
      </svg>
    </div>
  );
}

