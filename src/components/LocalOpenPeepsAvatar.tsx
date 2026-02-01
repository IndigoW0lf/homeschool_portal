'use client';

/**
 * LocalOpenPeepsAvatar - Custom SVG compositor using local Open Peeps assets
 * Layers SVG components on top of each other with proper z-indexing
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

const BODY_MAP: Record<string, string> = {
  none: '',
  hoodie: 'Hoodie.svg',
  tee1: 'Tee 1.svg',
  tee2: 'Tee 2.svg',
  sweater: 'Sweater.svg',
  blazerBlackTee: 'Blazer Black Tee.svg',
  dress: 'Dress.svg',
  buttonShirt1: 'Button Shirt 1.svg',
  buttonShirt2: 'Button Shirt 2.svg',
  gymShirt: 'Gym Shirt.svg',
  stripedTee: 'Striped Tee.svg',
  stripedPocketTee: 'Striped Pocket Tee.svg',
  sportyTee: 'Sporty Tee.svg',
  thunderTShirt: 'Thunder T-Shirt.svg',
  teeSelena: 'Tee Selena.svg',
  teeArmsCrossed: 'Tee Arms Crossed.svg',
  poloAndSweater: 'Polo and Sweater.svg',
  sweaterDots: 'Sweater Dots.svg',
  turtleneck: 'Turtleneck.svg',
  shirtAndCoat: 'Shirt and Coat.svg',
  polkaDotJacket: 'Polka Dot Jacket.svg',
  furJacket: 'Fur Jacket.svg',
  coffee: 'Coffee.svg',
  device: 'Device.svg',
  gaming: 'Gaming.svg',
  macbook: 'Macbook.svg',
  paper: 'Paper.svg',
  pointingUp: 'Pointing Up.svg',
  explaining: 'Explaining.svg',
  killer: 'Killer.svg',
  whatever: 'Whatever.svg',
};

const ACCESSORIES_MAP: Record<string, string> = {
  none: '',
  glasses: 'Glasses.svg',
  glasses2: 'Glasses 2.svg',
  eyepatch: 'Eyepatch.svg',
  sunglasses: 'Sunglasses.svg',
  sunglasses2: 'Sunglasses 2.svg',
};

const FACIAL_HAIR_MAP: Record<string, string> = {
  none: '',
  fullMajestic: 'Full Majestic.svg',
  goatee1: 'Goatee 1.svg',
  goatee2: 'Goatee 2.svg',
  moustaceFancy: 'Moustache Fancy.svg',
  moustacheMagnum: 'Moustache Magnum.svg',
};

export interface LocalOpenPeepsAvatarProps {
  face?: string;
  head?: string;
  body?: string;
  accessories?: string;
  facialHair?: string;
  skinColor?: string;
  clothingColor?: string;
  backgroundColor?: string;
  size?: number;
  className?: string;
}

export function LocalOpenPeepsAvatar({
  face = 'smile',
  head = 'short1',
  body = 'hoodie',
  accessories = 'none',
  facialHair = 'none',
  skinColor = 'd08b5b',
  clothingColor = '8fa7df',
  backgroundColor = 'b6e3f4',
  size = 120,
  className = '',
}: LocalOpenPeepsAvatarProps) {
  
  // Build the SVG paths
  const faceSrc = FACE_MAP[face] ? `${BASE_PATH}/face/${encodeURIComponent(FACE_MAP[face])}` : null;
  const headSrc = HEAD_MAP[head] ? `${BASE_PATH}/head/${encodeURIComponent(HEAD_MAP[head])}` : null;
  const bodySrc = body && body !== 'none' && BODY_MAP[body] ? `${BASE_PATH}/body/${encodeURIComponent(BODY_MAP[body])}` : null;
  const accessoriesSrc = accessories && accessories !== 'none' && ACCESSORIES_MAP[accessories] ? `${BASE_PATH}/accessories/${encodeURIComponent(ACCESSORIES_MAP[accessories])}` : null;
  const facialHairSrc = facialHair && facialHair !== 'none' && FACIAL_HAIR_MAP[facialHair] ? `${BASE_PATH}/facial-hair/${encodeURIComponent(FACIAL_HAIR_MAP[facialHair])}` : null;

  // Full body mode - stack body below head with overlap
  const isFullBody = body && body !== 'none' && bodySrc;
  
  // Sizing calculations
  const aspectRatio = isFullBody ? 1.5 : 1; // Full body is taller
  const containerHeight = size * aspectRatio;
  
  // Head positioning for full body mode
  const headTop = isFullBody ? '0%' : '0%';
  const headHeight = isFullBody ? '55%' : '100%';
  const bodyTop = isFullBody ? '35%' : '0%'; // Overlap body with head
  const bodyHeight = isFullBody ? '65%' : '0%';

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ 
        width: size, 
        height: containerHeight,
        backgroundColor: backgroundColor === 'transparent' ? undefined : `#${backgroundColor}`,
        borderRadius: isFullBody ? '20%' : '50%',
      }}
    >
      {/* Layer 1: Body (bottom layer for full body) */}
      {bodySrc && (
        <div 
          className="absolute left-0 right-0"
          style={{ 
            top: bodyTop,
            height: bodyHeight,
          }}
        >
          <Image
            src={bodySrc}
            alt="body"
            fill
            className="object-contain object-top"
            unoptimized
          />
        </div>
      )}

      {/* Layer 2: Face base */}
      {faceSrc && (
        <div 
          className="absolute left-1/2 -translate-x-1/2"
          style={{ 
            top: headTop,
            height: headHeight,
            width: isFullBody ? '70%' : '100%',
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

      {/* Layer 3: Hair/head */}
      {headSrc && (
        <div 
          className="absolute left-1/2 -translate-x-1/2"
          style={{ 
            top: headTop,
            height: headHeight,
            width: isFullBody ? '70%' : '100%',
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

      {/* Layer 4: Facial hair */}
      {facialHairSrc && (
        <div 
          className="absolute left-1/2 -translate-x-1/2"
          style={{ 
            top: headTop,
            height: headHeight,
            width: isFullBody ? '70%' : '100%',
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

      {/* Layer 5: Accessories (top layer) */}
      {accessoriesSrc && (
        <div 
          className="absolute left-1/2 -translate-x-1/2"
          style={{ 
            top: headTop,
            height: headHeight,
            width: isFullBody ? '70%' : '100%',
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
 * Generate a static URL/path for database storage (stores first body or bust)
 */
export function generateLocalOpenPeepsUrl(options: LocalOpenPeepsAvatarProps): string {
  const body = options.body || 'hoodie';
  if (body !== 'none' && BODY_MAP[body]) {
    return `${BASE_PATH}/body/${encodeURIComponent(BODY_MAP[body])}`;
  }
  // Fall back to a pre-composed bust from upper_template
  return `${BASE_PATH}/upper_template/peep-1.svg`;
}
