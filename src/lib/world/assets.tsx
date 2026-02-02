/**
 * World Assets - Open Peeps style SVG components
 * 
 * Design principles:
 * - Thick black strokes (strokeWidth 3-4)
 * - White or flat color fills
 * - Hand-drawn, approachable vibe
 */

import React from 'react';

// ============================================================================
// Terrain Colors (matches Open Peeps soft palette)
// ============================================================================

export const TERRAIN_COLORS: Record<string, string> = {
  grass: 'bg-emerald-50 border-emerald-200',
  sand: 'bg-amber-50 border-amber-200',
  water: 'bg-sky-100 border-sky-200',
};

export const TERRAIN_HEX: Record<string, string> = {
  grass: '#ecfdf5',
  sand: '#fffbeb',
  water: '#e0f2fe',
};

// ============================================================================
// Item SVG Components
// ============================================================================

interface AssetProps {
  className?: string;
}

const TreeSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Tree">
    {/* Trunk */}
    <rect
      x="42"
      y="65"
      width="16"
      height="30"
      fill="white"
      stroke="black"
      strokeWidth="3"
      rx="2"
    />
    {/* Foliage - triangular shape */}
    <path
      d="M50 8 L85 65 H15 Z"
      fill="white"
      stroke="black"
      strokeWidth="3"
      strokeLinejoin="round"
    />
  </svg>
);

const HouseSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="House">
    {/* Base */}
    <rect
      x="15"
      y="45"
      width="70"
      height="50"
      fill="white"
      stroke="black"
      strokeWidth="3"
      rx="2"
    />
    {/* Roof */}
    <path
      d="M10 48 L50 15 L90 48"
      fill="white"
      stroke="black"
      strokeWidth="3"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    {/* Door */}
    <rect
      x="40"
      y="60"
      width="20"
      height="35"
      fill="white"
      stroke="black"
      strokeWidth="3"
      rx="2"
    />
    {/* Window */}
    <rect
      x="60"
      y="55"
      width="15"
      height="15"
      fill="white"
      stroke="black"
      strokeWidth="2"
    />
    <line x1="67.5" y1="55" x2="67.5" y2="70" stroke="black" strokeWidth="2" />
    <line x1="60" y1="62.5" x2="75" y2="62.5" stroke="black" strokeWidth="2" />
  </svg>
);

const RockSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Rock">
    {/* Main rock shape - organic blob */}
    <path
      d="M25 75 Q15 60 30 50 Q35 35 55 40 Q75 35 80 55 Q90 70 75 80 Q60 90 40 85 Z"
      fill="white"
      stroke="black"
      strokeWidth="3"
    />
    {/* Detail line */}
    <path
      d="M40 55 Q50 50 55 60"
      fill="none"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const FlowerSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Flower">
    {/* Stem */}
    <line
      x1="50"
      y1="50"
      x2="50"
      y2="95"
      stroke="black"
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Leaf */}
    <ellipse
      cx="58"
      cy="75"
      rx="12"
      ry="6"
      fill="white"
      stroke="black"
      strokeWidth="2"
      transform="rotate(-30 58 75)"
    />
    {/* Petals */}
    {[0, 72, 144, 216, 288].map((angle) => (
      <ellipse
        key={angle}
        cx="50"
        cy="35"
        rx="10"
        ry="18"
        fill="white"
        stroke="black"
        strokeWidth="2"
        transform={`rotate(${angle} 50 50)`}
      />
    ))}
    {/* Center */}
    <circle cx="50" cy="50" r="10" fill="white" stroke="black" strokeWidth="3" />
  </svg>
);

const BushSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Bush">
    {/* Multiple overlapping circles for bush effect */}
    <circle cx="30" cy="65" r="22" fill="white" stroke="black" strokeWidth="3" />
    <circle cx="50" cy="55" r="25" fill="white" stroke="black" strokeWidth="3" />
    <circle cx="70" cy="65" r="22" fill="white" stroke="black" strokeWidth="3" />
    <circle cx="40" cy="45" r="18" fill="white" stroke="black" strokeWidth="3" />
    <circle cx="60" cy="45" r="18" fill="white" stroke="black" strokeWidth="3" />
  </svg>
);

// ============================================================================
// Medieval Pack Items
// ============================================================================

const CastleSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Castle">
    {/* Main wall */}
    <rect x="20" y="40" width="60" height="55" fill="white" stroke="black" strokeWidth="3" />
    {/* Towers */}
    <rect x="10" y="25" width="20" height="70" fill="white" stroke="black" strokeWidth="3" />
    <rect x="70" y="25" width="20" height="70" fill="white" stroke="black" strokeWidth="3" />
    {/* Crenellations */}
    <rect x="10" y="20" width="8" height="10" fill="white" stroke="black" strokeWidth="2" />
    <rect x="22" y="20" width="8" height="10" fill="white" stroke="black" strokeWidth="2" />
    <rect x="70" y="20" width="8" height="10" fill="white" stroke="black" strokeWidth="2" />
    <rect x="82" y="20" width="8" height="10" fill="white" stroke="black" strokeWidth="2" />
    {/* Gate */}
    <path d="M40 95 V65 A10 10 0 0 1 60 65 V95" fill="white" stroke="black" strokeWidth="3" />
  </svg>
);

const KnightSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Knight">
    {/* Helmet */}
    <ellipse cx="50" cy="30" rx="18" ry="22" fill="white" stroke="black" strokeWidth="3" />
    <rect x="32" y="25" width="36" height="8" fill="white" stroke="black" strokeWidth="2" />
    {/* Body */}
    <path d="M35 50 L50 45 L65 50 L60 90 H40 Z" fill="white" stroke="black" strokeWidth="3" />
    {/* Sword */}
    <line x1="70" y1="50" x2="85" y2="35" stroke="black" strokeWidth="4" strokeLinecap="round" />
    <line x1="75" y1="45" x2="80" y2="50" stroke="black" strokeWidth="3" />
  </svg>
);

const DragonSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Dragon">
    {/* Body */}
    <ellipse cx="55" cy="60" rx="30" ry="20" fill="white" stroke="black" strokeWidth="3" />
    {/* Head */}
    <ellipse cx="20" cy="45" rx="15" ry="12" fill="white" stroke="black" strokeWidth="3" />
    <circle cx="15" cy="42" r="3" fill="black" />
    {/* Wing */}
    <path d="M55 45 L75 20 L80 35 L85 25 L75 50 Z" fill="white" stroke="black" strokeWidth="3" />
    {/* Tail */}
    <path d="M85 60 Q95 55 90 45" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" />
    {/* Spikes */}
    <path d="M40 42 L45 30 L50 42" fill="white" stroke="black" strokeWidth="2" />
  </svg>
);

const BannerSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Banner">
    {/* Pole */}
    <line x1="30" y1="10" x2="30" y2="95" stroke="black" strokeWidth="4" strokeLinecap="round" />
    {/* Flag */}
    <path d="M32 15 L75 25 L75 55 L32 45 Z" fill="white" stroke="black" strokeWidth="3" />
    {/* Emblem */}
    <circle cx="53" cy="35" r="8" fill="white" stroke="black" strokeWidth="2" />
  </svg>
);

// ============================================================================
// Beach Pack Items
// ============================================================================

const PalmTreeSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Palm Tree">
    {/* Trunk - curved */}
    <path d="M50 95 Q45 70 55 50" fill="none" stroke="black" strokeWidth="6" strokeLinecap="round" />
    {/* Fronds */}
    <path d="M55 50 Q30 35 15 45" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" />
    <path d="M55 50 Q75 30 85 40" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" />
    <path d="M55 50 Q50 25 40 20" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" />
    <path d="M55 50 Q65 25 75 20" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" />
    {/* Coconuts */}
    <circle cx="52" cy="52" r="5" fill="white" stroke="black" strokeWidth="2" />
    <circle cx="58" cy="48" r="4" fill="white" stroke="black" strokeWidth="2" />
  </svg>
);

const UmbrellaSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Umbrella">
    {/* Pole */}
    <line x1="50" y1="35" x2="50" y2="95" stroke="black" strokeWidth="4" strokeLinecap="round" />
    {/* Canopy */}
    <path d="M15 40 Q50 5 85 40 Q75 35 65 38 Q55 32 50 38 Q40 32 30 38 Q20 35 15 40 Z" 
          fill="white" stroke="black" strokeWidth="3" />
  </svg>
);

const SandcastleSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Sandcastle">
    {/* Base */}
    <rect x="20" y="60" width="60" height="35" fill="white" stroke="black" strokeWidth="3" />
    {/* Towers */}
    <rect x="25" y="45" width="15" height="20" fill="white" stroke="black" strokeWidth="3" />
    <rect x="60" y="45" width="15" height="20" fill="white" stroke="black" strokeWidth="3" />
    {/* Center tower */}
    <rect x="40" y="35" width="20" height="30" fill="white" stroke="black" strokeWidth="3" />
    {/* Flags */}
    <line x1="50" y1="35" x2="50" y2="20" stroke="black" strokeWidth="2" />
    <path d="M50 20 L60 25 L50 30" fill="white" stroke="black" strokeWidth="2" />
  </svg>
);

const CrabSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Crab">
    {/* Body */}
    <ellipse cx="50" cy="55" rx="25" ry="18" fill="white" stroke="black" strokeWidth="3" />
    {/* Claws */}
    <ellipse cx="18" cy="50" rx="10" ry="8" fill="white" stroke="black" strokeWidth="3" />
    <ellipse cx="82" cy="50" rx="10" ry="8" fill="white" stroke="black" strokeWidth="3" />
    {/* Arms */}
    <line x1="28" y1="50" x2="35" y2="48" stroke="black" strokeWidth="3" />
    <line x1="72" y1="50" x2="65" y2="48" stroke="black" strokeWidth="3" />
    {/* Eyes */}
    <line x1="40" y1="40" x2="40" y2="30" stroke="black" strokeWidth="3" />
    <line x1="60" y1="40" x2="60" y2="30" stroke="black" strokeWidth="3" />
    <circle cx="40" cy="28" r="4" fill="white" stroke="black" strokeWidth="2" />
    <circle cx="60" cy="28" r="4" fill="white" stroke="black" strokeWidth="2" />
    {/* Legs */}
    <line x1="35" y1="65" x2="25" y2="80" stroke="black" strokeWidth="2" />
    <line x1="45" y1="68" x2="40" y2="82" stroke="black" strokeWidth="2" />
    <line x1="55" y1="68" x2="60" y2="82" stroke="black" strokeWidth="2" />
    <line x1="65" y1="65" x2="75" y2="80" stroke="black" strokeWidth="2" />
  </svg>
);

// ============================================================================
// Space Pack Items
// ============================================================================

const RocketSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Rocket">
    {/* Body */}
    <path d="M50 10 Q35 30 35 70 H65 Q65 30 50 10 Z" fill="white" stroke="black" strokeWidth="3" />
    {/* Fins */}
    <path d="M35 60 L20 85 L35 75" fill="white" stroke="black" strokeWidth="3" />
    <path d="M65 60 L80 85 L65 75" fill="white" stroke="black" strokeWidth="3" />
    {/* Window */}
    <circle cx="50" cy="40" r="10" fill="white" stroke="black" strokeWidth="3" />
    {/* Flame */}
    <path d="M40 75 L50 95 L60 75" fill="white" stroke="black" strokeWidth="3" />
  </svg>
);

const AlienSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Friendly Alien">
    {/* Head */}
    <ellipse cx="50" cy="40" rx="30" ry="25" fill="white" stroke="black" strokeWidth="3" />
    {/* Eyes */}
    <ellipse cx="38" cy="38" rx="10" ry="12" fill="white" stroke="black" strokeWidth="2" />
    <ellipse cx="62" cy="38" rx="10" ry="12" fill="white" stroke="black" strokeWidth="2" />
    <circle cx="38" cy="38" r="4" fill="black" />
    <circle cx="62" cy="38" r="4" fill="black" />
    {/* Body */}
    <ellipse cx="50" cy="75" rx="15" ry="18" fill="white" stroke="black" strokeWidth="3" />
    {/* Antenna */}
    <line x1="50" y1="15" x2="50" y2="5" stroke="black" strokeWidth="2" />
    <circle cx="50" cy="5" r="3" fill="white" stroke="black" strokeWidth="2" />
  </svg>
);

const CraterSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Crater">
    {/* Outer rim */}
    <ellipse cx="50" cy="55" rx="38" ry="25" fill="white" stroke="black" strokeWidth="3" />
    {/* Inner hole */}
    <ellipse cx="50" cy="55" rx="22" ry="14" fill="white" stroke="black" strokeWidth="2" />
    {/* Rocks around */}
    <circle cx="25" cy="50" r="5" fill="white" stroke="black" strokeWidth="2" />
    <circle cx="75" cy="52" r="4" fill="white" stroke="black" strokeWidth="2" />
    <circle cx="55" cy="35" r="3" fill="white" stroke="black" strokeWidth="2" />
  </svg>
);

const SpaceFlagSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Space Flag">
    {/* Pole */}
    <line x1="25" y1="15" x2="25" y2="95" stroke="black" strokeWidth="4" strokeLinecap="round" />
    {/* Flag */}
    <rect x="27" y="18" width="50" height="35" fill="white" stroke="black" strokeWidth="3" />
    {/* Star */}
    <path d="M52 28 L55 38 L65 38 L57 44 L60 54 L52 48 L44 54 L47 44 L39 38 L49 38 Z" 
          fill="white" stroke="black" strokeWidth="2" />
  </svg>
);

// ============================================================================
// Spooky Pack Items
// ============================================================================

const GravestoneSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Gravestone">
    {/* Stone */}
    <path d="M25 95 L25 45 Q25 20 50 20 Q75 20 75 45 L75 95 Z" 
          fill="white" stroke="black" strokeWidth="3" />
    {/* RIP text represented as lines */}
    <line x1="40" y1="45" x2="60" y2="45" stroke="black" strokeWidth="3" />
    <line x1="40" y1="55" x2="60" y2="55" stroke="black" strokeWidth="2" />
    <line x1="45" y1="65" x2="55" y2="65" stroke="black" strokeWidth="2" />
  </svg>
);

const GhostSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Ghost">
    {/* Body */}
    <path d="M25 50 Q25 15 50 15 Q75 15 75 50 L75 85 
             Q70 80 65 85 Q60 80 55 85 Q50 80 45 85 Q40 80 35 85 Q30 80 25 85 Z" 
          fill="white" stroke="black" strokeWidth="3" />
    {/* Eyes */}
    <ellipse cx="38" cy="45" rx="6" ry="8" fill="black" />
    <ellipse cx="62" cy="45" rx="6" ry="8" fill="black" />
    {/* Mouth */}
    <ellipse cx="50" cy="62" rx="8" ry="5" fill="black" />
  </svg>
);

const PumpkinSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Pumpkin">
    {/* Body segments */}
    <ellipse cx="50" cy="60" rx="35" ry="30" fill="white" stroke="black" strokeWidth="3" />
    <path d="M50 30 Q50 60 50 90" fill="none" stroke="black" strokeWidth="2" />
    <path d="M20 55 Q50 75 80 55" fill="none" stroke="black" strokeWidth="2" />
    {/* Stem */}
    <rect x="45" y="25" width="10" height="12" fill="white" stroke="black" strokeWidth="3" rx="2" />
    {/* Face */}
    <path d="M35 55 L40 48 L45 55" fill="black" />
    <path d="M55 55 L60 48 L65 55" fill="black" />
    <path d="M40 70 Q50 78 60 70" fill="none" stroke="black" strokeWidth="3" />
  </svg>
);

const BatSVG: React.FC<AssetProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-label="Bat">
    {/* Body */}
    <ellipse cx="50" cy="50" rx="12" ry="18" fill="white" stroke="black" strokeWidth="3" />
    {/* Head */}
    <circle cx="50" cy="35" r="10" fill="white" stroke="black" strokeWidth="3" />
    {/* Ears */}
    <path d="M42 28 L38 15 L45 25" fill="white" stroke="black" strokeWidth="2" />
    <path d="M58 28 L62 15 L55 25" fill="white" stroke="black" strokeWidth="2" />
    {/* Wings */}
    <path d="M38 45 Q20 35 10 50 Q15 55 20 60 Q25 50 35 55" fill="white" stroke="black" strokeWidth="3" />
    <path d="M62 45 Q80 35 90 50 Q85 55 80 60 Q75 50 65 55" fill="white" stroke="black" strokeWidth="3" />
    {/* Eyes */}
    <circle cx="46" cy="33" r="2" fill="black" />
    <circle cx="54" cy="33" r="2" fill="black" />
  </svg>
);

// ============================================================================
// Asset Registry & Getter
// ============================================================================

const ASSET_COMPONENTS: Record<string, React.FC<AssetProps>> = {
  // Base items
  tree: TreeSVG,
  house: HouseSVG,
  rock: RockSVG,
  flower: FlowerSVG,
  bush: BushSVG,
  // Medieval
  castle: CastleSVG,
  knight: KnightSVG,
  dragon: DragonSVG,
  banner: BannerSVG,
  // Beach
  palm_tree: PalmTreeSVG,
  umbrella: UmbrellaSVG,
  sandcastle: SandcastleSVG,
  crab: CrabSVG,
  // Space
  rocket: RocketSVG,
  alien: AlienSVG,
  crater: CraterSVG,
  space_flag: SpaceFlagSVG,
  // Spooky
  gravestone: GravestoneSVG,
  ghost: GhostSVG,
  pumpkin: PumpkinSVG,
  bat: BatSVG,
};

export const ASSET_METADATA: Record<string, { label: string; collision: boolean; pack?: string }> = {
  // Base items (always available)
  tree: { label: 'Tree', collision: true },
  house: { label: 'House', collision: true },
  rock: { label: 'Rock', collision: true },
  flower: { label: 'Flower', collision: false },
  bush: { label: 'Bush', collision: true },
  // Medieval pack
  castle: { label: 'Castle', collision: true, pack: 'pack_medieval' },
  knight: { label: 'Knight', collision: false, pack: 'pack_medieval' },
  dragon: { label: 'Dragon', collision: true, pack: 'pack_medieval' },
  banner: { label: 'Banner', collision: false, pack: 'pack_medieval' },
  // Beach pack
  palm_tree: { label: 'Palm Tree', collision: true, pack: 'pack_beach' },
  umbrella: { label: 'Umbrella', collision: false, pack: 'pack_beach' },
  sandcastle: { label: 'Sandcastle', collision: true, pack: 'pack_beach' },
  crab: { label: 'Crab', collision: false, pack: 'pack_beach' },
  // Space pack
  rocket: { label: 'Rocket', collision: true, pack: 'pack_space' },
  alien: { label: 'Alien', collision: false, pack: 'pack_space' },
  crater: { label: 'Crater', collision: false, pack: 'pack_space' },
  space_flag: { label: 'Flag', collision: false, pack: 'pack_space' },
  // Spooky pack
  gravestone: { label: 'Gravestone', collision: true, pack: 'pack_spooky' },
  ghost: { label: 'Ghost', collision: false, pack: 'pack_spooky' },
  pumpkin: { label: 'Pumpkin', collision: false, pack: 'pack_spooky' },
  bat: { label: 'Bat', collision: false, pack: 'pack_spooky' },
};

/**
 * Get the SVG component for a specific item type
 */
export function getAssetComponent(type: string, className?: string): React.ReactNode {
  const Component = ASSET_COMPONENTS[type];
  if (!Component) return null;
  return <Component className={`w-full h-full ${className || ''}`} />;
}

/**
 * Get base items (always available, no pack required)
 */
export function getBaseItems(): Array<{ type: string; label: string }> {
  return Object.entries(ASSET_METADATA)
    .filter(([, meta]) => !meta.pack)
    .map(([type, meta]) => ({ type, label: meta.label }));
}

/**
 * Get items for a specific pack
 */
export function getPackItems(packId: string): Array<{ type: string; label: string }> {
  return Object.entries(ASSET_METADATA)
    .filter(([, meta]) => meta.pack === packId)
    .map(([type, meta]) => ({ type, label: meta.label }));
}

/**
 * Get all available items for the editor toolbar (base + unlocked packs)
 */
export function getAvailableItems(unlockedPacks: string[] = []): Array<{ type: string; label: string }> {
  return Object.entries(ASSET_METADATA)
    .filter(([, meta]) => !meta.pack || unlockedPacks.includes(meta.pack))
    .map(([type, meta]) => ({ type, label: meta.label }));
}

