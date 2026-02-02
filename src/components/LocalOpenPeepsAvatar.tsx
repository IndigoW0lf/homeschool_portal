'use client';

/**
 * LocalOpenPeepsAvatar - Custom SVG compositor using local Open Peeps assets
 * Layers SVG components on top of each other with proper z-indexing
 * 
 * Supports two modes:
 * 1. Pose-based (default): Full body pose + face + hair + accessories
 * 2. Bust-only: Upper body + face + hair + accessories (no legs)
 */

import Image from 'next/image';

const BASE_PATH = '/assets/avatars/open-peeps';

// Maps option IDs to actual SVG filenames
const FACE_MAP: Record<string, string> = {
  smile: 'Smile.svg',
  smileBig: 'Smile Big.svg',
  cute: 'Cute.svg',
  calm: 'Calm.svg',
  cheeky: 'Cheeky.svg',
  awe: 'Awe.svg',
  lovingGrin1: 'Loving Grin 1.svg',
  lovingGrin2: 'Loving Grin 2.svg',
  smileLOL: 'Smile LOL.svg',
  smileTeethGap: 'Smile Teeth Gap.svg',
  eyesClosed: 'Eyes Closed.svg',
  eatingHappy: 'Eating Happy.svg',
  explaining: 'Explaining.svg',
  driven: 'Driven.svg',
  serious: 'Serious.svg',
  solemn: 'Solemn.svg',
  concerned: 'Concerned.svg',
  blank: 'Blank.svg',
  tired: 'Tired.svg',
  suspicious: 'Suspicious.svg',
  hectic: 'Hectic.svg',
  contempt: 'Contempt.svg',
  concernedFear: 'Concerned Fear.svg',
  fear: 'Fear.svg',
  angryWithFang: 'Angry with Fang.svg',
  veryAngry: 'Very Angry.svg',
  rage: 'Rage.svg',
  cyclops: 'Cyclops.svg',
  monster: 'Monster.svg',
  old: 'Old.svg',
};

const HEAD_MAP: Record<string, string> = {
  short1: 'Short 1.svg',
  short2: 'Short 2.svg',
  short3: 'Short 3.svg',
  short4: 'Short 4.svg',
  short5: 'Short 5.svg',
  medium1: 'Medium 1.svg',
  medium2: 'Medium 2.svg',
  medium3: 'Medium 3.svg',
  mediumBangs: 'Medium Bangs.svg',
  mediumBangs2: 'Medium Bangs 2.svg',
  mediumBangs3: 'Medium Bangs 3.svg',
  mediumStraight: 'Medium Straight.svg',
  long: 'Long.svg',
  longBangs: 'Long Bangs.svg',
  longCurly: 'Long Curly.svg',
  longAfro: 'Long Afro.svg',
  afro: 'Afro.svg',
  bun: 'Bun.svg',
  bun2: 'Bun 2.svg',
  buns: 'Buns.svg',
  bangs: 'Bangs.svg',
  bangs2: 'Bangs 2.svg',
  bantuKnots: 'Bantu Knots.svg',
  cornrows: 'Cornrows.svg',
  cornrows2: 'Cornrows 2.svg',
  twists: 'Twists.svg',
  twists2: 'Twists 2.svg',
  mohawk: 'Mohawk.svg',
  mohawk2: 'Mohawk 2.svg',
  flatTop: 'Flat Top.svg',
  flatTopLong: 'Flat Top Long.svg',
  pomp: 'Pomp.svg',
  hijab: 'Hijab.svg',
  turban: 'Turban.svg',
  noHair1: 'No Hair 1.svg',
  noHair2: 'No Hair 2.svg',
  noHair3: 'No Hair 3.svg',
  shaved1: 'Shaved 1.svg',
  shaved2: 'Shaved 2.svg',
  shaved3: 'Shaved 3.svg',
  grayShort: 'Gray Short.svg',
  grayMedium: 'Gray Medium.svg',
  grayBun: 'Gray Bun.svg',
  bear: 'Bear.svg',
  hatBeanie: 'hat-beanie.svg',
  hatHip: 'hat-hip.svg',
};

const ACCESSORIES_MAP: Record<string, string> = {
  none: '',
  glasses: 'Glasses.svg',
  glasses2: 'Glasses 2.svg',
  glasses3: 'Glasses 3.svg',
  glasses4: 'Glasses 4.svg',
  glasses5: 'Glasses 5.svg',
  eyepatch: 'Eyepatch.svg',
  sunglasses: 'Sunglasses.svg',
  sunglasses2: 'Sunglasses 2.svg',
};

const FACIAL_HAIR_MAP: Record<string, string> = {
  none: '',
  chin: 'Chin.svg',
  goatee1: 'Goatee 1.svg',
  goatee2: 'Goatee 2.svg',
  moustache1: 'Moustache 1.svg',
  moustache2: 'Moustache 2.svg',
  moustache3: 'Moustache 3.svg',
  moustache4: 'Moustache 4.svg',
  moustache5: 'Moustache 5.svg',
  moustache6: 'Moustache 6.svg',
  moustache7: 'Moustache 7.svg',
  moustache8: 'Moustache 8.svg',
  moustache9: 'Moustache 9.svg',
  full: 'Full.svg',
  full2: 'Full 2.svg',
  full3: 'Full 3.svg',
  full4: 'Full 4.svg',
};

// Pose options map to files in pose/sitting/ or pose/standing/
interface PoseInfo {
  folder: 'sitting' | 'standing';
  file: string;
}

const POSE_MAP: Record<string, PoseInfo> = {
  // Standing poses
  standing_shirt1: { folder: 'standing', file: 'shirt-1.svg' },
  standing_shirt2: { folder: 'standing', file: 'shirt-2.svg' },
  standing_shirt3: { folder: 'standing', file: 'shirt-3.svg' },
  standing_shirt4: { folder: 'standing', file: 'shirt-4.svg' },
  standing_blazer1: { folder: 'standing', file: 'blazer-1.svg' },
  standing_blazer2: { folder: 'standing', file: 'blazer-2.svg' },
  standing_blazer3: { folder: 'standing', file: 'blazer-3.svg' },
  standing_blazer4: { folder: 'standing', file: 'blazer-4.svg' },
  standing_crossed1: { folder: 'standing', file: 'crossed_arms-1.svg' },
  standing_crossed2: { folder: 'standing', file: 'crossed_arms-2.svg' },
  standing_resting1: { folder: 'standing', file: 'resting-1.svg' },
  standing_resting2: { folder: 'standing', file: 'resting-2.svg' },
  standing_walking1: { folder: 'standing', file: 'walking-1.svg' },
  standing_walking2: { folder: 'standing', file: 'walking-2.svg' },
  standing_walking3: { folder: 'standing', file: 'walking-3.svg' },
  standing_pointing1: { folder: 'standing', file: 'pointing_finger-1.svg' },
  standing_pointing2: { folder: 'standing', file: 'pointing_finger-2.svg' },
  standing_polka: { folder: 'standing', file: 'polka_dots.svg' },
  standing_easing1: { folder: 'standing', file: 'easing-1.svg' },
  standing_easing2: { folder: 'standing', file: 'easing-2.svg' },
  standing_robot1: { folder: 'standing', file: 'robot_dance-1.svg' },
  standing_robot2: { folder: 'standing', file: 'robot_dance-2.svg' },
  standing_robot3: { folder: 'standing', file: 'robot_dance-3.svg' },
  // Sitting poses
  sitting_closed1: { folder: 'sitting', file: 'closed_legs-1.svg' },
  sitting_closed2: { folder: 'sitting', file: 'closed_legs-2.svg' },
  sitting_crossed: { folder: 'sitting', file: 'crossed_legs.svg' },
  sitting_mid1: { folder: 'sitting', file: 'mid-1.svg' },
  sitting_mid2: { folder: 'sitting', file: 'mid-2.svg' },
  sitting_hands1: { folder: 'sitting', file: 'hands_back-1.svg' },
  sitting_hands2: { folder: 'sitting', file: 'hands_back-2.svg' },
  sitting_leg1: { folder: 'sitting', file: 'one_leg_up-1.svg' },
  sitting_leg2: { folder: 'sitting', file: 'one_leg_up-2.svg' },
  sitting_bike: { folder: 'sitting', file: 'bike.svg' },
  sitting_wheelchair: { folder: 'sitting', file: 'wheelchair.svg' },
};

export interface LocalOpenPeepsAvatarProps {
  pose?: string;           // New: full body pose from pose/
  face?: string;
  head?: string;
  accessories?: string;
  facialHair?: string;
  backgroundColor?: string;
  size?: number;
  className?: string;
}

export function LocalOpenPeepsAvatar({
  pose = 'standing_shirt1',
  face = 'smile',
  head = 'short1',
  accessories = 'none',
  facialHair = 'none',
  backgroundColor = 'b6e3f4',
  size = 120,
  className = '',
}: LocalOpenPeepsAvatarProps) {
  
  // Get pose info
  const poseInfo = POSE_MAP[pose];
  const poseSrc = poseInfo 
    ? `${BASE_PATH}/pose/${poseInfo.folder}/${encodeURIComponent(poseInfo.file)}`
    : null;
  
  // Determine if sitting (affects layout)
  const isSitting = pose.startsWith('sitting_');
  
  // Build the other SVG paths
  const faceSrc = FACE_MAP[face] ? `${BASE_PATH}/face/${encodeURIComponent(FACE_MAP[face])}` : null;
  const headSrc = HEAD_MAP[head] ? `${BASE_PATH}/head/${encodeURIComponent(HEAD_MAP[head])}` : null;
  const accessoriesSrc = accessories && accessories !== 'none' && ACCESSORIES_MAP[accessories] 
    ? `${BASE_PATH}/accessories/${encodeURIComponent(ACCESSORIES_MAP[accessories])}` 
    : null;
  const facialHairSrc = facialHair && facialHair !== 'none' && FACIAL_HAIR_MAP[facialHair] 
    ? `${BASE_PATH}/facial-hair/${encodeURIComponent(FACIAL_HAIR_MAP[facialHair])}` 
    : null;

  // Full body sizing - slightly larger container for more visible space
  const aspectRatio = isSitting ? 1.5 : 1.7;  // Taller container = more space
  const containerHeight = size * aspectRatio;
  
  // Head positioning - USE SAME VALUES for sitting and standing
  // The user tuned these for standing, sitting was using bigger values
  const headTop = '2%';
  const headHeight = '25%';  // Constrain by HEIGHT to keep size correct
  const headWidth = '85%';   // VERY WIDE box to prevent side clipping (hair)
  const headLeft = '46%';    // Shift slightly left
  
  // Face - same for both sitting and standing
  const faceHeight = '15%';
  const faceWidth = '20%';
  const faceTop = '7.5%';
  const faceLeft = '48.5%';

  return (
    <div 
      className={`relative ${className}`}
      style={{ 
        width: size, 
        height: containerHeight,
        backgroundColor: backgroundColor === 'transparent' ? undefined : `#${backgroundColor}`,
        borderRadius: '20%',
      }}
    >
      {/* Layer 1: Pose (full body - bottom layer) */}
      {poseSrc && (
        <div 
          className="absolute inset-0"
          style={{ 
            top: '22%', 
            bottom: '-5%', // Allow feet to extend below default bottom
            left: isSitting ? '5%' : '-2%' 
          }}
        >
          <Image
            src={poseSrc}
            alt="pose"
            fill
            className="object-contain object-top"
            unoptimized
          />
        </div>
      )}

      {/* Layer 2: Hair/head (renders UNDER face) */}
      {headSrc && (
        <div 
          className="absolute -translate-x-1/2"
          style={{ 
            top: headTop,
            left: headLeft,
            height: headHeight,
            width: headWidth,
            overflow: 'visible',  // Don't clip hair
          }}
        >
          <Image
            src={headSrc}
            alt="hair"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      )}

      {/* Layer 3: Face (renders ON TOP of hair, slightly smaller) */}
      {faceSrc && (
        <div 
          className="absolute -translate-x-1/2"
          style={{ 
            top: faceTop,
            left: faceLeft,
            height: faceHeight,
            width: faceWidth,
          }}
        >
          <Image
            src={faceSrc}
            alt="face"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      )}

      {/* Layer 4: Facial hair (same position as face) */}
      {facialHairSrc && (
        <div 
          className="absolute -translate-x-1/2"
          style={{ 
            top: faceTop,
            left: faceLeft,
            height: faceHeight,
            width: faceWidth,
          }}
        >
          <Image
            src={facialHairSrc}
            alt="facial hair"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      )}

      {/* Layer 5: Accessories (glasses - same as face) */}
      {accessoriesSrc && (
        <div 
          className="absolute -translate-x-1/2"
          style={{ 
            top: faceTop,
            left: faceLeft,
            height: faceHeight,
            width: faceWidth,
          }}
        >
          <Image
            src={accessoriesSrc}
            alt="accessories"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      )}
    </div>
  );
}

/**
 * Generate a static URL/path for database storage
 */
export function generateLocalOpenPeepsUrl(options: LocalOpenPeepsAvatarProps): string {
  const pose = options.pose || 'standing_shirt1';
  const poseInfo = POSE_MAP[pose];
  if (poseInfo) {
    return `${BASE_PATH}/pose/${poseInfo.folder}/${encodeURIComponent(poseInfo.file)}`;
  }
  // Fallback
  return `${BASE_PATH}/pose/standing/shirt-1.svg`;
}
