import { 
  CalendarCheck, 
  ChartLineUp, 
  Users, 
  Moon, 
  Sparkle,
  BookOpen 
} from '@phosphor-icons/react/dist/ssr';

const features = [
  {
    icon: CalendarCheck,
    title: 'Lesson Planning',
    description: 'Organize your curriculum with lessons, daily playlists, and a visual calendar. Never wonder "what are we doing today?" again.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: ChartLineUp,
    title: 'Progress Tracking',
    description: 'See assignments completed, streaks maintained, and growth over time. Beautiful insights without the spreadsheet headaches.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Users,
    title: 'Kid Portals',
    description: 'Each child gets their own personalized dashboard with daily quests, their favorite colors, and age-appropriate views.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Moon,
    title: 'Moon Rewards',
    description: 'Kids earn moons for completing work, then spend them in the shop. Motivation that feels like play, not pressure.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Sparkle,
    title: 'Luna AI Assistant',
    description: 'Your helpful planning companion. Get lesson ideas, adapt activities for different ages, and brainstorm together.',
    color: 'from-[#9c8fb8] to-[#E27D60]',
  },
  {
    icon: BookOpen,
    title: 'Family Collaboration',
    description: 'Invite co-parents, grandparents, or tutors to share the load. Everyone stays on the same page.',
    color: 'from-rose-500 to-red-500',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[#E27D60] font-medium">FEATURES</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-4">
            Everything you need to homeschool joyfully
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            From planning to tracking to keeping kids engaged—Lunara Quest handles it all.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-8 rounded-2xl bg-gray-800/50 border border-gray-700/50 hover:border-gray-600 hover:bg-gray-800 transition-all duration-300"
            >
              {/* Icon */}
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon size={28} weight="fill" className="text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
