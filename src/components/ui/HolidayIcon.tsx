'use client';

import { 
  Sun, Snowflake, Tree, Gift, Heart, Star, Sparkle, Confetti,
  Umbrella, Flower, Moon, Campfire, Airplane, House, Balloon,
  Cake, Coffee, BookOpen, MusicNote, GameController, Bed, Alarm
} from '@phosphor-icons/react';

// Curated list of holiday/break-appropriate icons
const HOLIDAY_ICONS: Record<string, { Icon: React.ComponentType<any>; color: string }> = {
  sun: { Icon: Sun, color: '#e7b58d' },
  snowflake: { Icon: Snowflake, color: '#b6e1d8' },
  tree: { Icon: Tree, color: '#b6e1d8' },
  gift: { Icon: Gift, color: '#ffcdf6' },
  heart: { Icon: Heart, color: '#ffcdf6' },
  star: { Icon: Star, color: '#e7b58d' },
  sparkle: { Icon: Sparkle, color: '#caa2d8' },
  confetti: { Icon: Confetti, color: '#ffcdf6' },
  umbrella: { Icon: Umbrella, color: '#b6e1d8' },
  flower: { Icon: Flower, color: '#ffcdf6' },
  moon: { Icon: Moon, color: '#caa2d8' },
  campfire: { Icon: Campfire, color: '#e7b58d' },
  airplane: { Icon: Airplane, color: '#b6e1d8' },
  house: { Icon: House, color: '#e7b58d' },
  balloon: { Icon: Balloon, color: '#ffcdf6' },
  cake: { Icon: Cake, color: '#ffcdf6' },
  coffee: { Icon: Coffee, color: '#e7b58d' },
  book: { Icon: BookOpen, color: '#b6e1d8' },
  music: { Icon: MusicNote, color: '#caa2d8' },
  game: { Icon: GameController, color: '#caa2d8' },
  bed: { Icon: Bed, color: '#b6e1d8' },
  alarm: { Icon: Alarm, color: '#e7b58d' },
};

interface HolidayIconProps {
  iconId: string;
  size?: number;
}

export function HolidayIcon({ iconId, size = 32 }: HolidayIconProps) {
  const iconData = HOLIDAY_ICONS[iconId];
  
  if (iconData) {
    const IconComponent = iconData.Icon;
    return <IconComponent size={size} weight="duotone" color={iconData.color} />;
  }
  
  // Fallback for old emoji format or unknown icons - show star
  const FallbackIcon = HOLIDAY_ICONS.star.Icon;
  return <FallbackIcon size={size} weight="duotone" color={HOLIDAY_ICONS.star.color} />;
}

// Export the icons list for use in pickers
export { HOLIDAY_ICONS };
