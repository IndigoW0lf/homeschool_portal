import { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

// ... imports

interface BlockyAvatarProps {
  className?: string;
  skinColors?: {
    head?: string;
    torso?: string;
    torsoSide?: string; // New: Side of torso
    leftArm?: string;
    rightArm?: string;
    leftLeg?: string;
    rightLeg?: string;
    leftLegSide?: string; // New
    rightLegSide?: string; // New
    skin?: string;
  };
  size?: number;
}


/**
 * Renders a blocky character in "Isometric" 3D style (Roblox/Minecraft look)
 */
export function BlockyAvatar({ className, skinColors = {}, size = 200 }: BlockyAvatarProps) {
  // Default skin tone if not specified
  const defaultSkin = skinColors.skin || '#ffdbac';
  
  const style = {
    '--skin-head': skinColors.head || defaultSkin,
    '--skin-torso': skinColors.torso || '#5e7fb8', 
    '--skin-torso-side': skinColors.torsoSide || skinColors.torso || '#5e7fb8', // Fallback to main torso color
    '--skin-arm': skinColors.leftArm || skinColors.rightArm || defaultSkin,
    '--skin-leg': skinColors.leftLeg || skinColors.rightLeg || '#4a5568', 
    '--skin-leg-side': skinColors.leftLegSide || skinColors.rightLegSide || skinColors.leftLeg || skinColors.rightLeg || '#4a5568',
    width: size,
    height: size, 
  } as CSSProperties;

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
          {/* Torso Front - with basic Neckline cutout simulation if needed (though hard in isometric projection) */}
          {/* We'll keep it simple: The underlying fill is the torso color. */}
          <path d="M0 0 L70 0 L70 60 L0 60 Z" fill="var(--skin-torso)" />
          
           {/* If we want a neckline, we could overlay a skin-colored shape at the top center. 
               Let's simulate a simple round neck by drawing a small arc at the top. */}
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

        {/* HEAD */}
        <g transform="translate(75, 10)">
          <path d="M0 0 L50 0 L50 50 L0 50 Z" fill="var(--skin-head)" />
          <path d="M50 0 L70 -15 L70 35 L50 50 Z" fill="var(--skin-head)" filter="url(#shade-side)" />
          <path d="M0 0 L20 -15 L70 -15 L50 0 Z" fill="var(--skin-head)" filter="url(#shade-top)" />
          
          {/* Face */}
          <g transform="translate(12, 18)" opacity="0.8">
            <circle cx="0" cy="0" r="3" fill="#333" />
            <circle cx="26" cy="0" r="3" fill="#333" />
            <path d="M3 10 Q13 16 23 10" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </g>
        </g>
      </svg>
    </div>
  );
}
