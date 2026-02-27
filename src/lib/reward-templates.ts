/**
 * Reward Templates Library
 * 
 * Pre-made reward ideas for parents to add to their kid's shop.
 * Parents can customize the moon cost when adding to their shop.
 */

export interface RewardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'screen_time' | 'activities' | 'treats' | 'privileges' | 'experiences';
  suggestedCost: number; // Default moon cost (parent can adjust)
  emoji?: string; // Legacy fallback
  icon: string; // Phosphor icon name
}

export const REWARD_CATEGORIES = {
  screen_time: { label: 'Screen Time', icon: 'DeviceTablet' },
  activities: { label: 'Activities', icon: 'GameController' },
  treats: { label: 'Treats', icon: 'Cookie' },
  privileges: { label: 'Privileges', icon: 'Star' },
  experiences: { label: 'Experiences', icon: 'Ticket' },
} as const;

export const REWARD_TEMPLATES: RewardTemplate[] = [
  // Screen Time (8)
  { id: 'screen-15', name: '15 Extra Minutes Screen Time', description: 'Extra screen time for devices', category: 'screen_time', suggestedCost: 5, icon: 'DeviceMobile' },
  { id: 'screen-30', name: '30 Extra Minutes Screen Time', description: 'Extra screen time for devices', category: 'screen_time', suggestedCost: 10, icon: 'DeviceMobile' },
  { id: 'screen-60', name: '1 Hour Extra Screen Time', description: 'A full hour of extra screen time', category: 'screen_time', suggestedCost: 18, icon: 'Television' },
  { id: 'movie-night', name: 'Movie Night Pick', description: 'Choose the movie for family movie night', category: 'screen_time', suggestedCost: 15, icon: 'Popcorn' },
  { id: 'youtube-time', name: 'YouTube Time (30 min)', description: '30 minutes to watch approved videos', category: 'screen_time', suggestedCost: 8, icon: 'Television' },
  { id: 'game-session', name: 'Video Game Session', description: 'Extra video game time', category: 'screen_time', suggestedCost: 12, icon: 'GameController' },
  { id: 'tablet-time', name: 'Tablet Time', description: 'Extra time on tablet or iPad', category: 'screen_time', suggestedCost: 10, icon: 'DeviceTablet' },
  { id: 'bedtime-show', name: 'One More Episode', description: 'Watch one more episode before bed', category: 'screen_time', suggestedCost: 8, icon: 'Television' },

  // Activities (8)
  { id: 'board-game', name: 'Board Game Night', description: 'Choose and play a board game with family', category: 'activities', suggestedCost: 12, icon: 'PuzzlePiece' },
  { id: 'craft-project', name: 'Special Craft Project', description: 'Get supplies for a craft project', category: 'activities', suggestedCost: 20, icon: 'Palette' },
  { id: 'baking-together', name: 'Baking Session', description: 'Bake something yummy together', category: 'activities', suggestedCost: 15, icon: 'Cookie' },
  { id: 'bike-ride', name: 'Bike Ride', description: 'Family bike ride', category: 'activities', suggestedCost: 10, icon: 'Bicycle' },
  { id: 'park-trip', name: 'Trip to the Park', description: 'Visit a local park', category: 'activities', suggestedCost: 12, icon: 'Tree' },
  { id: 'science-experiment', name: 'Science Experiment', description: 'Do a fun science experiment', category: 'activities', suggestedCost: 15, icon: 'Flask' },
  { id: 'dance-party', name: 'Dance Party', description: 'Have a living room dance party', category: 'activities', suggestedCost: 5, icon: 'MusicNotes' },
  { id: 'puzzle-time', name: 'New Puzzle', description: 'Work on a new puzzle together', category: 'activities', suggestedCost: 10, icon: 'PuzzlePiece' },

  // Treats (8)
  { id: 'ice-cream', name: 'Ice Cream Treat', description: 'Get your favorite ice cream', category: 'treats', suggestedCost: 20, icon: 'IceCream' },
  { id: 'candy', name: 'Candy from Store', description: 'Pick out a candy at the store', category: 'treats', suggestedCost: 10, icon: 'Candy' },
  { id: 'special-snack', name: 'Special Snack', description: 'Choose a special snack', category: 'treats', suggestedCost: 8, icon: 'Popcorn' },
  { id: 'breakfast-choice', name: 'Breakfast of Choice', description: 'Pick breakfast (pancakes, waffles, etc.)', category: 'treats', suggestedCost: 15, icon: 'Cookie' }, // Could use real food icon or cookie fallback
  { id: 'dinner-pick', name: 'Pick Dinner', description: 'Choose what is for dinner', category: 'treats', suggestedCost: 15, icon: 'Pizza' },
  { id: 'dessert', name: 'Extra Dessert', description: 'Get an extra dessert', category: 'treats', suggestedCost: 12, icon: 'IceCream' },
  { id: 'hot-chocolate', name: 'Hot Chocolate', description: 'Special hot chocolate with toppings', category: 'treats', suggestedCost: 6, icon: 'Coffee' },
  { id: 'smoothie', name: 'Smoothie Shop Trip', description: 'Get a smoothie from a shop', category: 'treats', suggestedCost: 25, icon: 'Coffee' },

  // Privileges (8)
  { id: 'stay-up-late', name: 'Stay Up 30 Min Later', description: 'Extend bedtime by 30 minutes', category: 'privileges', suggestedCost: 15, icon: 'Moon' },
  { id: 'skip-chore', name: 'Skip One Chore', description: 'Get out of one daily chore', category: 'privileges', suggestedCost: 20, icon: 'Broom' },
  { id: 'choose-music', name: 'DJ Car Ride', description: 'Control the music in the car', category: 'privileges', suggestedCost: 8, icon: 'MusicNotes' },
  { id: 'front-seat', name: 'Front Seat Ride', description: 'Sit in the front seat (if allowed)', category: 'privileges', suggestedCost: 10, icon: 'Car' },
  { id: 'no-vegetables', name: 'Skip Vegetables Once', description: 'Skip veggies for one meal', category: 'privileges', suggestedCost: 12, icon: 'ForkKnife' },
  { id: 'friend-call', name: 'Video Call a Friend', description: 'Call a friend for 30 minutes', category: 'privileges', suggestedCost: 10, icon: 'Phone' },
  { id: 'sleepover', name: 'Plan a Sleepover', description: 'Have a friend sleep over', category: 'privileges', suggestedCost: 50, icon: 'Moon' },
  { id: 'breakfast-bed', name: 'Breakfast in Bed', description: 'Get breakfast served in bed', category: 'privileges', suggestedCost: 18, icon: 'Coffee' },

  // Experiences (8)
  { id: 'library', name: 'Library Trip', description: 'Trip to the library to pick books', category: 'experiences', suggestedCost: 10, icon: 'Book' },
  { id: 'restaurant', name: 'Restaurant Choice', description: 'Pick the restaurant for next outing', category: 'experiences', suggestedCost: 30, icon: 'ForkKnife' },
  { id: 'zoo', name: 'Zoo Trip', description: 'Family trip to the zoo', category: 'experiences', suggestedCost: 75, icon: 'Cat' },
  { id: 'museum', name: 'Museum Visit', description: 'Visit a museum', category: 'experiences', suggestedCost: 50, icon: 'Bank' },
  { id: 'bowling', name: 'Bowling Outing', description: 'Go bowling as a family', category: 'experiences', suggestedCost: 40, icon: 'Target' },
  { id: 'mini-golf', name: 'Mini Golf', description: 'Go play mini golf', category: 'experiences', suggestedCost: 35, icon: 'Flag' },
  { id: 'aquarium', name: 'Aquarium Trip', description: 'Visit the aquarium', category: 'experiences', suggestedCost: 60, icon: 'Fish' },
  { id: 'arcade', name: 'Arcade Trip', description: 'Go to the arcade', category: 'experiences', suggestedCost: 45, icon: 'GameController' },
];

export function getTemplatesByCategory(category: RewardTemplate['category']): RewardTemplate[] {
  return REWARD_TEMPLATES.filter(t => t.category === category);
}

export function getAllCategories(): (keyof typeof REWARD_CATEGORIES)[] {
  return Object.keys(REWARD_CATEGORIES) as (keyof typeof REWARD_CATEGORIES)[];
}
