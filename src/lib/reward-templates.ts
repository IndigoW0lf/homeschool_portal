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
  emoji: string;
}

export const REWARD_CATEGORIES = {
  screen_time: { label: 'Screen Time', emoji: '📱' },
  activities: { label: 'Activities', emoji: '🎮' },
  treats: { label: 'Treats', emoji: '🍬' },
  privileges: { label: 'Privileges', emoji: '⭐' },
  experiences: { label: 'Experiences', emoji: '🎪' },
} as const;

export const REWARD_TEMPLATES: RewardTemplate[] = [
  // Screen Time (8)
  { id: 'screen-15', name: '15 Extra Minutes Screen Time', description: 'Extra screen time for devices', category: 'screen_time', suggestedCost: 5, emoji: '📱' },
  { id: 'screen-30', name: '30 Extra Minutes Screen Time', description: 'Extra screen time for devices', category: 'screen_time', suggestedCost: 10, emoji: '📱' },
  { id: 'screen-60', name: '1 Hour Extra Screen Time', description: 'A full hour of extra screen time', category: 'screen_time', suggestedCost: 18, emoji: '📱' },
  { id: 'movie-night', name: 'Movie Night Pick', description: 'Choose the movie for family movie night', category: 'screen_time', suggestedCost: 15, emoji: '🎬' },
  { id: 'youtube-time', name: 'YouTube Time (30 min)', description: '30 minutes to watch approved videos', category: 'screen_time', suggestedCost: 8, emoji: '▶️' },
  { id: 'game-session', name: 'Video Game Session', description: 'Extra video game time', category: 'screen_time', suggestedCost: 12, emoji: '🎮' },
  { id: 'tablet-time', name: 'Tablet Time', description: 'Extra time on tablet or iPad', category: 'screen_time', suggestedCost: 10, emoji: '📲' },
  { id: 'bedtime-show', name: 'One More Episode', description: 'Watch one more episode before bed', category: 'screen_time', suggestedCost: 8, emoji: '📺' },

  // Activities (8)
  { id: 'board-game', name: 'Board Game Night', description: 'Choose and play a board game with family', category: 'activities', suggestedCost: 12, emoji: '🎲' },
  { id: 'craft-project', name: 'Special Craft Project', description: 'Get supplies for a craft project', category: 'activities', suggestedCost: 20, emoji: '🎨' },
  { id: 'baking-together', name: 'Baking Session', description: 'Bake something yummy together', category: 'activities', suggestedCost: 15, emoji: '🧁' },
  { id: 'bike-ride', name: 'Bike Ride', description: 'Family bike ride', category: 'activities', suggestedCost: 10, emoji: '🚴' },
  { id: 'park-trip', name: 'Trip to the Park', description: 'Visit a local park', category: 'activities', suggestedCost: 12, emoji: '🌳' },
  { id: 'science-experiment', name: 'Science Experiment', description: 'Do a fun science experiment', category: 'activities', suggestedCost: 15, emoji: '🔬' },
  { id: 'dance-party', name: 'Dance Party', description: 'Have a living room dance party', category: 'activities', suggestedCost: 5, emoji: '💃' },
  { id: 'puzzle-time', name: 'New Puzzle', description: 'Work on a new puzzle together', category: 'activities', suggestedCost: 10, emoji: '🧩' },

  // Treats (8)
  { id: 'ice-cream', name: 'Ice Cream Treat', description: 'Get your favorite ice cream', category: 'treats', suggestedCost: 20, emoji: '🍦' },
  { id: 'candy', name: 'Candy from Store', description: 'Pick out a candy at the store', category: 'treats', suggestedCost: 10, emoji: '🍬' },
  { id: 'special-snack', name: 'Special Snack', description: 'Choose a special snack', category: 'treats', suggestedCost: 8, emoji: '🍿' },
  { id: 'breakfast-choice', name: 'Breakfast of Choice', description: 'Pick breakfast (pancakes, waffles, etc.)', category: 'treats', suggestedCost: 15, emoji: '🥞' },
  { id: 'dinner-pick', name: 'Pick Dinner', description: 'Choose what is for dinner', category: 'treats', suggestedCost: 15, emoji: '🍕' },
  { id: 'dessert', name: 'Extra Dessert', description: 'Get an extra dessert', category: 'treats', suggestedCost: 12, emoji: '🍰' },
  { id: 'hot-chocolate', name: 'Hot Chocolate', description: 'Special hot chocolate with toppings', category: 'treats', suggestedCost: 6, emoji: '☕' },
  { id: 'smoothie', name: 'Smoothie Shop Trip', description: 'Get a smoothie from a shop', category: 'treats', suggestedCost: 25, emoji: '🥤' },

  // Privileges (8)
  { id: 'stay-up-late', name: 'Stay Up 30 Min Later', description: 'Extend bedtime by 30 minutes', category: 'privileges', suggestedCost: 15, emoji: '🌙' },
  { id: 'skip-chore', name: 'Skip One Chore', description: 'Get out of one daily chore', category: 'privileges', suggestedCost: 20, emoji: '🙅' },
  { id: 'choose-music', name: 'DJ Car Ride', description: 'Control the music in the car', category: 'privileges', suggestedCost: 8, emoji: '🎵' },
  { id: 'front-seat', name: 'Front Seat Ride', description: 'Sit in the front seat (if allowed)', category: 'privileges', suggestedCost: 10, emoji: '🚗' },
  { id: 'no-vegetables', name: 'Skip Vegetables Once', description: 'Skip veggies for one meal', category: 'privileges', suggestedCost: 12, emoji: '🥦' },
  { id: 'friend-call', name: 'Video Call a Friend', description: 'Call a friend for 30 minutes', category: 'privileges', suggestedCost: 10, emoji: '📞' },
  { id: 'sleepover', name: 'Plan a Sleepover', description: 'Have a friend sleep over', category: 'privileges', suggestedCost: 50, emoji: '🛏️' },
  { id: 'breakfast-bed', name: 'Breakfast in Bed', description: 'Get breakfast served in bed', category: 'privileges', suggestedCost: 18, emoji: '🛌' },

  // Experiences (8)
  { id: 'library', name: 'Library Trip', description: 'Trip to the library to pick books', category: 'experiences', suggestedCost: 10, emoji: '📚' },
  { id: 'restaurant', name: 'Restaurant Choice', description: 'Pick the restaurant for next outing', category: 'experiences', suggestedCost: 30, emoji: '🍽️' },
  { id: 'zoo', name: 'Zoo Trip', description: 'Family trip to the zoo', category: 'experiences', suggestedCost: 75, emoji: '🦁' },
  { id: 'museum', name: 'Museum Visit', description: 'Visit a museum', category: 'experiences', suggestedCost: 50, emoji: '🏛️' },
  { id: 'bowling', name: 'Bowling Outing', description: 'Go bowling as a family', category: 'experiences', suggestedCost: 40, emoji: '🎳' },
  { id: 'mini-golf', name: 'Mini Golf', description: 'Go play mini golf', category: 'experiences', suggestedCost: 35, emoji: '⛳' },
  { id: 'aquarium', name: 'Aquarium Trip', description: 'Visit the aquarium', category: 'experiences', suggestedCost: 60, emoji: '🐠' },
  { id: 'arcade', name: 'Arcade Trip', description: 'Go to the arcade', category: 'experiences', suggestedCost: 45, emoji: '👾' },
];

export function getTemplatesByCategory(category: RewardTemplate['category']): RewardTemplate[] {
  return REWARD_TEMPLATES.filter(t => t.category === category);
}

export function getAllCategories(): (keyof typeof REWARD_CATEGORIES)[] {
  return Object.keys(REWARD_CATEGORIES) as (keyof typeof REWARD_CATEGORIES)[];
}
